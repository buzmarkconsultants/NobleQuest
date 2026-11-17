import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO, isValid } from "date-fns";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Lock, Smartphone } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { DatePicker, TravelerStepper } from "@/components/site/BookingCard";
import { MastercardBadge, MpesaBadge, VisaBadge } from "@/components/site/BrandBadges";
import { SmartImage } from "@/components/site/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/data/site";
import { tripTypeLabels } from "@/data/tours";
import { loadTrips } from "@/lib/content";
import { createBooking } from "@/lib/content.functions";
import { checkMpesaPayment, initiateMpesaStkPush } from "@/lib/mpesa.functions";
import type { MpesaPaymentStatus } from "@/lib/mpesa.types";
import { useCurrency } from "@/lib/currency";
import {
  allowsDeposit,
  depositUSD,
  formatPrice,
  SAFARI_DEPOSIT_RATE,
  tripTotalUSD,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface BookSearch {
  tour?: string | undefined;
  date?: string | undefined;
  travelers?: number | undefined;
}

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>): BookSearch => {
    const travelers = Number(s["travelers"]);
    return {
      tour:
        typeof s["tour"] === "string" && /^[a-z0-9-]{1,120}$/.test(s["tour"])
          ? s["tour"]
          : undefined,
      date:
        typeof s["date"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s["date"])
          ? s["date"]
          : undefined,
      travelers:
        Number.isInteger(travelers) && travelers > 0 && travelers <= 500 ? travelers : undefined,
    };
  },
  loader: async () => ({ trips: await loadTrips() }),
  staleTime: 60_000,
  head: () => ({
    meta: [
      { title: `Book Your Trip | ${site.name}` },
      {
        name: "description",
        content:
          "Choose your date and travelers, then pay securely by M-Pesa or card. Safaris, beach holidays and corporate trips can be secured with a 30% deposit.",
      },
      { property: "og:title", content: `Book Your Trip | ${site.name}` },
      {
        property: "og:description",
        content: "Secure your Kenya safari or day trip in minutes with M-Pesa or card.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookPage,
});

const steps = ["Trip", "Your details", "Payment", "Confirmed"] as const;

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a phone number")
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Digits, spaces and + only"),
  country: z.string().trim().min(2, "Enter your country").max(60),
  pickup: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(500).optional(),
});
type Details = z.infer<typeof detailsSchema>;

function BookPage() {
  const search = Route.useSearch();
  const { trips } = Route.useLoaderData();
  const saveBooking = useServerFn(createBooking);
  const startMpesaPayment = useServerFn(initiateMpesaStkPush);
  const checkMpesaPaymentStatus = useServerFn(checkMpesaPayment);
  const { currency } = useCurrency();
  const [step, setStep] = useState(0);
  const [tourSlug, setTourSlug] = useState(() =>
    search.tour && trips.some((t) => t.slug === search.tour) ? search.tour : "",
  );
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!search.date) return undefined;
    const d = parseISO(search.date);
    return isValid(d) ? d : undefined;
  });
  const [travelers, setTravelers] = useState(search.travelers ?? 2);
  const [details, setDetails] = useState<Details | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [plan, setPlan] = useState<"deposit" | "full">("deposit");
  const [paying, setPaying] = useState(false);
  const [reference, setReference] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [mpesaPaymentId, setMpesaPaymentId] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<MpesaPaymentStatus | "idle" | "timeout">("idle");
  const [mpesaReceipt, setMpesaReceipt] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const tour = trips.find((t) => t.slug === tourSlug);
  const minGroup = tour?.minGroup ?? 1;
  const total = tour ? tripTotalUSD(tour.priceUSD, travelers) : 0;
  const canDeposit = tour ? allowsDeposit(tour.type) : false;
  const payNowUSD = tour && canDeposit && plan === "deposit" ? depositUSD(total, tour.type) : total;

  const chooseTrip = (slug: string) => {
    setTourSlug(slug);
    const next = trips.find((t) => t.slug === slug);
    if (next && travelers < next.minGroup) setTravelers(next.minGroup);
  };
  const payCurrency = method === "mpesa" ? "KES" : currency;

  useEffect(() => {
    if (step !== 3 || method !== "mpesa" || !mpesaPaymentId || mpesaStatus !== "pending") return;

    let active = true;
    let attempts = 0;
    let timer: number | undefined;
    const poll = async () => {
      if (!active) return;
      if (attempts >= 60) {
        setMpesaStatus("timeout");
        return;
      }
      attempts += 1;
      try {
        const result = await checkMpesaPaymentStatus({ data: { paymentId: mpesaPaymentId } });
        if (!active) return;
        if (result.ok) {
          setPaymentError("");
          if (result.status !== "pending") {
            setMpesaStatus(result.status);
            setMpesaReceipt(result.receiptNumber ?? "");
            if (result.status === "failed" && result.resultDescription) {
              setPaymentError(result.resultDescription);
            }
            return;
          }
        } else {
          setPaymentError(result.error);
        }
      } catch (error) {
        if (!active) return;
        console.error("Could not check M-Pesa payment status:", error);
        setPaymentError("We couldn't check the payment status. We'll keep trying.");
      }
      timer = window.setTimeout(() => void poll(), 2000);
    };

    void poll();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [checkMpesaPaymentStatus, method, mpesaPaymentId, mpesaStatus, step]);

  const goTrip = () => {
    const errs: Record<string, string> = {};
    if (!tour) errs["tour"] = "Choose a trip";
    if (!date) errs["date"] = "Pick a travel date";
    if (tour && travelers < tour.minGroup)
      errs["travelers"] = `This package needs at least ${tour.minGroup} travelers`;
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(1);
  };

  const goDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = detailsSchema.safeParse(Object.fromEntries(fd));
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setDetails(r.data);
    setStep(2);
  };

  const pay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    const phone = String(fd.get("mpesa") ?? "").trim();
    if (method === "mpesa") {
      const n = phone.replace(/\s/g, "");
      if (!/^(\+?254|0)?7\d{8}$|^(\+?254|0)?1\d{8}$/.test(n))
        errs["mpesa"] = "Enter a valid Safaricom number, e.g. 0712 345 678";
    } else {
      const num = String(fd.get("card") ?? "").replace(/\s/g, "");
      if (!/^\d{15,16}$/.test(num)) errs["card"] = "Enter a 15–16 digit card number";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(fd.get("exp") ?? ""))) errs["exp"] = "MM/YY";
      if (!/^\d{3,4}$/.test(String(fd.get("cvc") ?? ""))) errs["cvc"] = "3–4 digits";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!tour || !date || !details) return;
    setPaying(true);
    try {
      let savedReference = bookingReference;
      if (!savedReference) {
        const result = await saveBooking({
          data: {
            tripSlug: tour.slug,
            travelDate: format(date, "yyyy-MM-dd"),
            travelers,
            fullName: details.name,
            email: details.email,
            phone: details.phone,
            country: details.country,
            pickup: details.pickup || undefined,
            notes: details.notes || undefined,
            paymentMethod: method,
            paymentPlan: canDeposit ? plan : "full",
          },
        });
        if (!result.ok) {
          setErrors({ pay: result.error });
          return;
        }
        savedReference = result.reference;
        setBookingReference(savedReference);
      }

      setReference(savedReference);
      if (method === "mpesa") {
        const result = await startMpesaPayment({
          data: { bookingReference: savedReference, phone },
        });
        if (!result.ok) {
          setErrors({ pay: result.error });
          return;
        }
        setMpesaPaymentId(result.paymentId);
        setMpesaPhone(phone);
        setMpesaStatus("pending");
        setMpesaReceipt("");
        setPaymentError("");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setStep(3);
    } catch (err) {
      console.error(err);
      setErrors({
        pay: "We couldn't process this request. Please check your details or WhatsApp us.",
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="container-site py-10 md:py-14">
      <h1 className="text-4xl font-semibold md:text-5xl">Book your trip</h1>

      <ol className="mt-6 flex flex-wrap gap-2" aria-label="Booking progress">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-secondary text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-background/20 text-xs">
              {i < step ? "✓" : i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-9">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Choose your trip</h2>
              <div className="space-y-1.5">
                <Label htmlFor="b-tour">Trip</Label>
                <Select value={tourSlug} onValueChange={chooseTrip}>
                  <SelectTrigger id="b-tour" className="h-12 rounded-xl">
                    <SelectValue placeholder="Select a trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.title} · {tripTypeLabels[t.type].one} ·{" "}
                        {formatPrice(t.priceUSD, currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["tour"] && (
                  <p className="text-xs font-medium text-destructive">{errors["tour"]}</p>
                )}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="b-date">Travel date</Label>
                  <DatePicker id="b-date" date={date} onChange={setDate} />
                  {errors["date"] && (
                    <p className="text-xs font-medium text-destructive">{errors["date"]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-trav">Travelers</Label>
                  <TravelerStepper
                    id="b-trav"
                    value={travelers}
                    onChange={setTravelers}
                    min={minGroup}
                    max={tour?.type === "corporate" ? 300 : 20}
                  />
                  {errors["travelers"] && (
                    <p className="text-xs font-medium text-destructive">{errors["travelers"]}</p>
                  )}
                </div>
              </div>
              <Button variant="hero" size="xl" onClick={goTrip}>
                Continue
              </Button>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={goDetails} noValidate className="space-y-5">
              <h2 className="text-2xl font-semibold">Lead traveler details</h2>
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="d-name" label="Full name" error={errors["name"]}>
                  <Input
                    id="d-name"
                    name="name"
                    autoComplete="name"
                    defaultValue={details?.name}
                    maxLength={100}
                    className="h-12 rounded-xl"
                  />
                </Field>
                <Field id="d-email" label="Email" error={errors["email"]}>
                  <Input
                    id="d-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={details?.email}
                    maxLength={255}
                    className="h-12 rounded-xl"
                  />
                </Field>
                <Field id="d-phone" label="Phone / WhatsApp" error={errors["phone"]}>
                  <Input
                    id="d-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    defaultValue={details?.phone}
                    maxLength={20}
                    className="h-12 rounded-xl"
                  />
                </Field>
                <Field id="d-country" label="Country of residence" error={errors["country"]}>
                  <Input
                    id="d-country"
                    name="country"
                    autoComplete="country-name"
                    defaultValue={details?.country}
                    maxLength={60}
                    className="h-12 rounded-xl"
                  />
                </Field>
              </div>
              <Field
                id="d-pickup"
                label="Hotel / pick-up location (optional)"
                error={errors["pickup"]}
              >
                <Input
                  id="d-pickup"
                  name="pickup"
                  defaultValue={details?.pickup}
                  maxLength={150}
                  className="h-12 rounded-xl"
                />
              </Field>
              <Field
                id="d-notes"
                label="Dietary needs or special requests (optional)"
                error={errors["notes"]}
              >
                <Textarea
                  id="d-notes"
                  name="notes"
                  rows={3}
                  defaultValue={details?.notes}
                  maxLength={500}
                  className="rounded-xl"
                />
              </Field>
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="xl" onClick={() => setStep(0)}>
                  <ArrowLeft /> Back
                </Button>
                <Button type="submit" variant="hero" size="xl">
                  Continue to payment
                </Button>
              </div>
            </form>
          )}

          {step === 2 && tour && (
            <form onSubmit={pay} noValidate className="space-y-6">
              <h2 className="text-2xl font-semibold">Payment</h2>

              {canDeposit && (
                <fieldset>
                  <legend className="mb-3 text-sm font-medium">
                    How much would you like to pay now?
                  </legend>
                  <RadioGroup
                    value={plan}
                    disabled={Boolean(bookingReference)}
                    onValueChange={(v) => setPlan(v as "deposit" | "full")}
                    className="grid gap-3 md:grid-cols-2"
                  >
                    <Choice
                      value="deposit"
                      checked={plan === "deposit"}
                      title={`Pay ${SAFARI_DEPOSIT_RATE * 100}% deposit`}
                      sub={`${formatPrice(depositUSD(total, tour.type), payCurrency)} today, balance 30 days before travel`}
                    />
                    <Choice
                      value="full"
                      checked={plan === "full"}
                      title="Pay in full"
                      sub={`${formatPrice(total, payCurrency)} today`}
                    />
                  </RadioGroup>
                </fieldset>
              )}

              <fieldset>
                <legend className="mb-3 text-sm font-medium">Payment method</legend>
                <RadioGroup
                  value={method}
                  disabled={Boolean(bookingReference)}
                  onValueChange={(v) => {
                    setMethod(v as "mpesa" | "card");
                    setErrors({});
                  }}
                  className="grid gap-3 md:grid-cols-2"
                >
                  <Choice
                    value="mpesa"
                    checked={method === "mpesa"}
                    title="M-Pesa"
                    sub="STK prompt to your phone · Sandbox"
                    icon={<Smartphone className="h-5 w-5 text-mpesa" />}
                    badge={<MpesaBadge />}
                  />
                  <Choice
                    value="card"
                    checked={method === "card"}
                    title="Debit / credit card"
                    sub="Card payments are demo only"
                    icon={<CreditCard className="h-5 w-5 text-visa" />}
                    badge={
                      <span className="flex gap-1">
                        <VisaBadge />
                        <MastercardBadge />
                      </span>
                    }
                  />
                </RadioGroup>
              </fieldset>

              {method === "mpesa" ? (
                <Field id="p-mpesa" label="M-Pesa phone number" error={errors["mpesa"]}>
                  <Input
                    id="p-mpesa"
                    name="mpesa"
                    type="tel"
                    inputMode="tel"
                    placeholder="0712 345 678"
                    defaultValue={mpesaPhone || details?.phone}
                    maxLength={20}
                    className="h-12 rounded-xl"
                  />
                </Field>
              ) : (
                <div className="grid gap-4 md:grid-cols-[1fr_120px_100px]">
                  <Field id="p-card" label="Card number" error={errors["card"]}>
                    <Input
                      id="p-card"
                      name="card"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="h-12 rounded-xl"
                    />
                  </Field>
                  <Field id="p-exp" label="Expiry" error={errors["exp"]}>
                    <Input
                      id="p-exp"
                      name="exp"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      maxLength={5}
                      className="h-12 rounded-xl"
                    />
                  </Field>
                  <Field id="p-cvc" label="CVC" error={errors["cvc"]}>
                    <Input
                      id="p-cvc"
                      name="cvc"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      maxLength={4}
                      className="h-12 rounded-xl"
                    />
                  </Field>
                </div>
              )}

              <div className="rounded-2xl bg-secondary/70 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-primary" />{" "}
                  {method === "mpesa" ? "M-Pesa Sandbox" : "Card demo mode"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {method === "mpesa"
                    ? "A test STK prompt will be sent to your phone. Sandbox transactions do not charge real money."
                    : "Card processing is not connected. No card payment will be made."}
                </p>
              </div>

              {errors["pay"] && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {errors["pay"]}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  onClick={() => setStep(1)}
                  disabled={paying || Boolean(bookingReference)}
                >
                  <ArrowLeft /> Back
                </Button>
                <Button type="submit" variant="hero" size="xl" disabled={paying}>
                  {paying ? (
                    <>
                      <Loader2 className="animate-spin" />{" "}
                      {method === "mpesa" ? "Sending M-Pesa prompt…" : "Processing…"}
                    </>
                  ) : (
                    `Pay ${formatPrice(payNowUSD, payCurrency)}`
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 3 &&
            tour &&
            details &&
            (method === "mpesa" && mpesaStatus !== "completed" ? (
              <div className="py-6 text-center" role="status">
                {mpesaStatus === "failed" ? (
                  <>
                    <h2 className="mt-4 text-3xl font-semibold">Payment not completed</h2>
                    <p className="mt-3 text-muted-foreground">
                      {paymentError || "The M-Pesa request was not completed."}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Booking reference <strong className="text-foreground">{reference}</strong>
                    </p>
                    <Button
                      className="mt-6"
                      variant="hero"
                      size="xl"
                      onClick={() => {
                        setStep(2);
                        setMpesaPaymentId("");
                        setMpesaStatus("idle");
                        setPaymentError("");
                      }}
                    >
                      Try M-Pesa again
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
                    <h2 className="mt-4 text-3xl font-semibold">
                      {mpesaStatus === "timeout"
                        ? "Still waiting for confirmation"
                        : "Check your phone"}
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                      Enter your M-Pesa PIN on the prompt sent to{" "}
                      <strong className="text-foreground">{mpesaPhone}</strong>. This page will
                      update when Safaricom confirms the payment.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Booking reference <strong className="text-foreground">{reference}</strong>
                    </p>
                    {paymentError && (
                      <p role="alert" className="mt-3 text-sm text-destructive">
                        {paymentError}
                      </p>
                    )}
                    {mpesaStatus === "timeout" && (
                      <Button
                        className="mt-6"
                        variant="outline"
                        size="xl"
                        onClick={() => {
                          setPaymentError("");
                          setMpesaStatus("pending");
                        }}
                      >
                        Check payment again
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="py-6 text-center" role="status">
                <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
                <h2 className="mt-4 text-3xl font-semibold">
                  {method === "mpesa" ? "Payment received" : "Booking request saved"}
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Booking reference <strong className="text-foreground">{reference}</strong>.
                  {method === "mpesa"
                    ? ` M-Pesa receipt: ${mpesaReceipt || "confirmed"}. Our team will follow up at ${details.email}.`
                    : " No card payment was processed; our team will follow up to arrange payment."}
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button asChild variant="forest" size="xl">
                    <Link to="/">Back to home</Link>
                  </Button>
                  <Button asChild variant="outline" size="xl">
                    <Link to="/day-trips">Add a day trip</Link>
                  </Button>
                </div>
              </div>
            ))}
        </div>

        <aside
          aria-label="Order summary"
          className="h-fit overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:sticky lg:top-28"
        >
          {tour ? (
            <>
              <div className="aspect-[16/9]">
                <SmartImage src={tour.image} alt={tour.imageAlt} width={480} />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold">{tour.title}</h2>
                <p className="text-sm text-muted-foreground">{tour.durationLabel}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <Row k="Date" v={date ? format(date, "d MMM yyyy") : "—"} />
                  <Row k="Travelers" v={String(travelers)} />
                  <Row k="Price per person" v={formatPrice(tour.priceUSD, payCurrency)} />
                  <div className="my-3 border-t border-border" />
                  <Row k="Total" v={formatPrice(total, payCurrency)} strong />
                  {canDeposit && plan === "deposit" && (
                    <Row k="Due today (deposit)" v={formatPrice(payNowUSD, payCurrency)} accent />
                  )}
                </dl>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              Select a trip to see your summary.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({
  k,
  v,
  strong,
  accent,
}: {
  k: string;
  v: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={cn("flex justify-between", accent && "text-primary")}>
      <dt className={cn(!accent && "text-muted-foreground")}>{k}</dt>
      <dd className={cn(strong || accent ? "font-bold" : "font-medium")}>{v}</dd>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function Choice({
  value,
  checked,
  title,
  sub,
  icon,
  badge,
}: {
  value: string;
  checked: boolean;
  title: string;
  sub: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={`c-${value}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 font-normal transition-colors",
        checked
          ? "border-primary bg-secondary/60 ring-1 ring-primary"
          : "border-border hover:bg-secondary/40",
      )}
    >
      <RadioGroupItem id={`c-${value}`} value={value} className="mt-1" />
      <span className="flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">{sub}</span>
        {badge && <span className="mt-3 block">{badge}</span>}
      </span>
    </Label>
  );
}
