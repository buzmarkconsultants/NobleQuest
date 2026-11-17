import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { toKES } from "@/lib/pricing";
import type { MpesaDatabase, MpesaPaymentRow } from "./mpesa.types";

type MpesaConfig = {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
};

const stkResponseSchema = z.object({
  ResponseCode: z.string(),
  ResponseDescription: z.string().optional(),
  CustomerMessage: z.string().optional(),
  MerchantRequestID: z.string().optional(),
  CheckoutRequestID: z.string().optional(),
});

const callbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      CheckoutRequestID: z.string().min(1),
      ResultCode: z.coerce.number().int(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]),
            }),
          ),
        })
        .optional(),
    }),
  }),
});

function db() {
  // The Lovable-created table is not present in the locally synced generated types yet.
  return supabaseAdmin as unknown as SupabaseClient<MpesaDatabase>;
}

function config(): MpesaConfig {
  const values = {
    consumerKey: process.env["MPESA_CONSUMER_KEY"]?.trim() ?? "",
    consumerSecret: process.env["MPESA_CONSUMER_SECRET"]?.trim() ?? "",
    shortcode: process.env["MPESA_SHORTCODE"]?.trim() ?? "",
    passkey: process.env["MPESA_PASSKEY"]?.trim() ?? "",
    callbackUrl: process.env["MPESA_CALLBACK_URL"]?.trim() ?? "",
  };
  const missing = [
    ["MPESA_CONSUMER_KEY", values.consumerKey],
    ["MPESA_CONSUMER_SECRET", values.consumerSecret],
    ["MPESA_SHORTCODE", values.shortcode],
    ["MPESA_PASSKEY", values.passkey],
    ["MPESA_CALLBACK_URL", values.callbackUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(`Missing Sandbox setting(s): ${missing.join(", ")}`);
  }
  const url = new URL(values.callbackUrl);
  if (url.protocol !== "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    throw new Error("MPESA_CALLBACK_URL must be a public HTTPS URL.");
  }
  return values;
}

export function normalizeMpesaPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const phone = digits.startsWith("0")
    ? `254${digits.slice(1)}`
    : digits.startsWith("254")
      ? digits
      : `254${digits}`;
  if (!/^254[17]\d{8}$/.test(phone)) {
    throw new Error("Enter a valid Kenyan Safaricom number.");
  }
  return phone;
}

function darajaTimestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values["year"]}${values["month"]}${values["day"]}${values["hour"]}${values["minute"]}${values["second"]}`;
}

async function getAccessToken(settings: MpesaConfig) {
  const authorization = Buffer.from(`${settings.consumerKey}:${settings.consumerSecret}`).toString(
    "base64",
  );
  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${authorization}` } },
  );
  const body: unknown = await response.json().catch(() => null);
  const parsed = z.object({ access_token: z.string().min(1) }).safeParse(body);
  if (!response.ok || !parsed.success) {
    throw new Error("Daraja Sandbox authentication failed. Check the Sandbox credentials.");
  }
  return parsed.data.access_token;
}

async function markAttemptFailed(
  paymentId: string,
  description: string,
  resultCode: number | null = null,
) {
  const { error } = await db()
    .from("mpesa_payments")
    .update({
      status: "failed",
      result_code: resultCode,
      result_description: description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);
  if (error) console.error("M-Pesa attempt could not be marked failed", error);
}

export async function initiateMpesaStkPush(input: { bookingReference: string; phone: string }) {
  let paymentId = "";
  try {
    const settings = config();
    const phone = normalizeMpesaPhone(input.phone);
    const client = db();
    const { data: booking, error: bookingError } = await client
      .from("bookings")
      .select("reference, payment_method, payment_plan, amount_due_usd, status")
      .eq("reference", input.bookingReference)
      .maybeSingle();
    if (bookingError) {
      console.error("M-Pesa booking lookup failed", bookingError);
      return { ok: false as const, error: "We couldn't verify this booking. Please try again." };
    }
    if (!booking) return { ok: false as const, error: "Booking not found." };
    if (booking.payment_method !== "mpesa" || booking.status !== "new") {
      return { ok: false as const, error: "This booking isn't available for M-Pesa payment." };
    }

    const { data: pending, error: pendingError } = await client
      .from("mpesa_payments")
      .select("id, phone, checkout_request_id")
      .eq("booking_reference", booking.reference)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingError) {
      console.error("M-Pesa pending payment lookup failed", pendingError);
      return { ok: false as const, error: "We couldn't check the existing payment request." };
    }
    if (pending) {
      if (pending.phone !== phone) {
        return {
          ok: false as const,
          error:
            "A payment prompt is already pending for this booking. Complete it before changing the number.",
        };
      }
      if (!pending.checkout_request_id) {
        return {
          ok: false as const,
          error:
            "A previous prompt may still be processing. Please wait or contact us before retrying.",
        };
      }
      return { ok: true as const, paymentId: pending.id };
    }

    const amountKES = toKES(booking.amount_due_usd);
    if (amountKES < 1) {
      return { ok: false as const, error: "The amount due must be greater than zero." };
    }

    const { data: attempt, error: insertError } = await client
      .from("mpesa_payments")
      .insert({
        booking_reference: booking.reference,
        phone,
        amount_kes: amountKES,
        status: "pending",
        merchant_request_id: null,
        checkout_request_id: null,
        result_code: null,
        result_description: null,
        receipt_number: null,
      })
      .select("id")
      .single();
    if (insertError || !attempt) {
      console.error("M-Pesa payment record could not be created", insertError);
      return { ok: false as const, error: "We couldn't start the payment. Please try again." };
    }
    paymentId = attempt.id;

    const accessToken = await getAccessToken(settings);
    const timestamp = darajaTimestamp();
    const password = Buffer.from(`${settings.shortcode}${settings.passkey}${timestamp}`).toString(
      "base64",
    );
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: settings.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amountKES,
          PartyA: phone,
          PartyB: settings.shortcode,
          PhoneNumber: phone,
          CallBackURL: settings.callbackUrl,
          AccountReference: booking.reference,
          TransactionDesc: "NobleQuest booking",
        }),
      },
    );
    const responseBody: unknown = await response.json().catch(() => null);
    const parsedResponse = stkResponseSchema.safeParse(responseBody);
    if (
      !response.ok ||
      !parsedResponse.success ||
      parsedResponse.data.ResponseCode !== "0" ||
      !parsedResponse.data.CheckoutRequestID ||
      !parsedResponse.data.MerchantRequestID
    ) {
      const description = parsedResponse.success
        ? parsedResponse.data.ResponseDescription || "Daraja rejected the STK Push request."
        : "Daraja returned an invalid STK Push response.";
      await markAttemptFailed(paymentId, description);
      return { ok: false as const, error: description };
    }

    const { error: updateError } = await client
      .from("mpesa_payments")
      .update({
        merchant_request_id: parsedResponse.data.MerchantRequestID,
        checkout_request_id: parsedResponse.data.CheckoutRequestID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);
    if (updateError) {
      console.error("M-Pesa IDs could not be saved", updateError);
      return {
        ok: false as const,
        error:
          "The M-Pesa prompt may have been sent, but tracking could not be saved. Contact us with your booking reference.",
      };
    }
    return { ok: true as const, paymentId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected M-Pesa error.";
    console.error("M-Pesa STK Push failed", message);
    if (paymentId) await markAttemptFailed(paymentId, message);
    return { ok: false as const, error: message };
  }
}

export async function getMpesaPaymentStatus(paymentId: string) {
  const { data, error } = await db()
    .from("mpesa_payments")
    .select("status, result_description, receipt_number")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) {
    console.error("M-Pesa status lookup failed", error);
    return { ok: false as const, error: "We couldn't check the M-Pesa payment status." };
  }
  if (!data) return { ok: false as const, error: "Payment request not found." };
  return {
    ok: true as const,
    status: data.status,
    resultDescription: data.result_description,
    receiptNumber: data.receipt_number,
  };
}

function callbackValue(
  payment: z.infer<typeof callbackSchema>["Body"]["stkCallback"],
  name: string,
) {
  return payment.CallbackMetadata?.Item.find((item) => item.Name === name)?.Value;
}

export async function handleMpesaCallback(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ResultCode: 1, ResultDesc: "Invalid JSON" }, { status: 400 });
  }
  const parsed = callbackSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { ResultCode: 1, ResultDesc: "Invalid callback payload" },
      { status: 400 },
    );
  }

  const callback = parsed.data.Body.stkCallback;
  let client: SupabaseClient<MpesaDatabase>;
  try {
    client = db();
  } catch (error) {
    console.error("M-Pesa callback client unavailable", error);
    return Response.json(
      { ResultCode: 1, ResultDesc: "Payment service unavailable" },
      { status: 503 },
    );
  }

  let attempt: Pick<
    MpesaPaymentRow,
    "id" | "booking_reference" | "phone" | "amount_kes" | "status"
  > | null = null;
  for (let retry = 0; retry < 5; retry++) {
    const { data, error } = await client
      .from("mpesa_payments")
      .select("id, booking_reference, phone, amount_kes, status")
      .eq("checkout_request_id", callback.CheckoutRequestID)
      .maybeSingle();
    if (error) {
      console.error("M-Pesa callback lookup failed", error);
      return Response.json({ ResultCode: 1, ResultDesc: "Payment lookup failed" }, { status: 503 });
    }
    if (data) {
      attempt = data;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!attempt) {
    console.error("M-Pesa callback did not match a payment attempt");
    return Response.json(
      { ResultCode: 1, ResultDesc: "Payment attempt not found" },
      { status: 503 },
    );
  }

  if (callback.ResultCode === 0) {
    const amount = callbackValue(callback, "Amount");
    const phone = callbackValue(callback, "PhoneNumber");
    const receipt = callbackValue(callback, "MpesaReceiptNumber");
    let callbackPhone = "";
    try {
      callbackPhone = normalizeMpesaPhone(String(phone ?? ""));
    } catch {
      callbackPhone = "";
    }
    if (Number(amount) !== attempt.amount_kes || callbackPhone !== attempt.phone || !receipt) {
      console.error("M-Pesa callback amount or phone verification failed");
      return Response.json(
        { ResultCode: 1, ResultDesc: "Payment verification failed" },
        { status: 400 },
      );
    }

    const { data: booking, error: bookingError } = await client
      .from("bookings")
      .select("payment_plan, status")
      .eq("reference", attempt.booking_reference)
      .maybeSingle();
    if (bookingError || !booking) {
      console.error("M-Pesa callback booking lookup failed", bookingError);
      return Response.json({ ResultCode: 1, ResultDesc: "Booking lookup failed" }, { status: 503 });
    }
    if (booking.status === "new") {
      const status = booking.payment_plan === "deposit" ? "deposit-paid" : "paid";
      const { error: bookingUpdateError } = await client
        .from("bookings")
        .update({ status })
        .eq("reference", attempt.booking_reference)
        .eq("status", "new");
      if (bookingUpdateError) {
        console.error("M-Pesa callback booking update failed", bookingUpdateError);
        return Response.json(
          { ResultCode: 1, ResultDesc: "Booking update failed" },
          { status: 503 },
        );
      }
    }

    const { error: paymentUpdateError } = await client
      .from("mpesa_payments")
      .update({
        status: "completed",
        result_code: callback.ResultCode,
        result_description: callback.ResultDesc,
        receipt_number: String(receipt),
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);
    if (paymentUpdateError) {
      console.error("M-Pesa callback payment update failed", paymentUpdateError);
      return Response.json({ ResultCode: 1, ResultDesc: "Payment update failed" }, { status: 503 });
    }
  } else {
    const { error: paymentUpdateError } = await client
      .from("mpesa_payments")
      .update({
        status: "failed",
        result_code: callback.ResultCode,
        result_description: callback.ResultDesc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id)
      .neq("status", "completed");
    if (paymentUpdateError) {
      console.error("M-Pesa callback failure update failed", paymentUpdateError);
      return Response.json({ ResultCode: 1, ResultDesc: "Payment update failed" }, { status: 503 });
    }
  }

  return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
