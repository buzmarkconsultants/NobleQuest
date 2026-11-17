import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const startInput = z.object({
  bookingReference: z.string().regex(/^NQ-[A-HJ-NP-Z2-9]{6}$/),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^[+\d\s()-]+$/),
});

export const initiateMpesaStkPush = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => startInput.parse(input))
  .handler(async ({ data }) => {
    const { initiateMpesaStkPush: initiate } = await import("./mpesa.server");
    return initiate(data);
  });

export const checkMpesaPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ paymentId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { getMpesaPaymentStatus } = await import("./mpesa.server");
    return getMpesaPaymentStatus(data.paymentId);
  });
