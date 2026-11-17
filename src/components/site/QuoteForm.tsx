import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createQuoteRequest } from "@/lib/content.functions";
import { cn } from "@/lib/utils";

export const interestOptions = ["Big Five", "Migration", "Photography", "Culture", "Family", "Beach"] as const;
export const corporateInterestOptions = ["Team building", "Conference", "Incentive trip", "Leadership retreat", "Client hosting"] as const;
export const budgetOptions = [
  "Under $500 pp",
  "$500 – $1,000 pp",
  "$1,000 – $2,500 pp",
  "$2,500 – $5,000 pp",
  "$5,000+ pp",
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a phone / WhatsApp number")
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Only digits, spaces and + are allowed"),
  dates: z.string().trim().min(2, "Tell us roughly when you'd like to travel").max(100),
  groupSize: z.coerce.number().int().min(1, "At least 1 traveler").max(500),
  budget: z.string().min(1, "Choose a budget range"),
  interests: z.array(z.string()).max(5),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000, "Max 1000 characters").optional(),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export function QuoteForm({
  kind = "custom",
  tripSlug,
  defaultMessage = "",
  className,
}: {
  kind?: "custom" | "corporate";
  tripSlug?: string | undefined;
  defaultMessage?: string;
  className?: string;
}) {
  const corporate = kind === "corporate";
  const options: readonly string[] = corporate ? corporateInterestOptions : interestOptions;
  const send = useServerFn(createQuoteRequest);
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState<Errors & { form?: string }>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = schema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      dates: fd.get("dates"),
      groupSize: fd.get("groupSize"),
      budget,
      interests,
      company: fd.get("company") || undefined,
      message: fd.get("message") || undefined,
    });
    if (!result.success) {
      const errs: Errors = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof Errors;
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      return;
    }
    if (corporate && !result.data.company) {
      setErrors({ company: "Enter your company or organisation" });
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const d = result.data;
      const res = await send({
        data: {
          kind,
          fullName: d.name,
          email: d.email,
          phone: d.phone,
          company: d.company,
          travelDates: d.dates,
          groupSize: String(d.groupSize),
          budget: d.budget,
          interests: d.interests,
          tripSlug,
          message: d.message,
        },
      });
      if (!res.ok) {
        setErrors({ form: res.error });
        return;
      }
      setSent(d.name.split(" ")[0] ?? d.name);
    } catch (err) {
      console.error(err);
      setErrors({ form: "We couldn't send your request. Please try again or WhatsApp us." });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className={cn("rounded-3xl bg-card p-10 text-center shadow-elevated", className)} role="status">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h3 className="mt-4 text-3xl font-semibold">Asante, {sent}!</h3>
        <p className="mt-3 text-muted-foreground">
          {corporate
            ? "Your request is in. Our corporate desk will send a full proposal within 24 hours."
            : "Your request is in. A safari expert will send your free, no-obligation quote within 24 hours — usually much sooner."}
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSent(null)}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={cn("rounded-3xl bg-card p-6 shadow-elevated md:p-9", className)}>
      <div className="grid gap-5 md:grid-cols-2">
        {corporate && (
          <F label="Company / organisation" id="q-company" error={errors.company} className="md:col-span-2">
            <Input id="q-company" name="company" autoComplete="organization" maxLength={120} className="h-12 rounded-xl" />
          </F>
        )}
        <F label="Full name" id="q-name" error={errors.name}>
          <Input id="q-name" name="name" autoComplete="name" maxLength={100} className="h-12 rounded-xl" />
        </F>
        <F label="Email" id="q-email" error={errors.email}>
          <Input id="q-email" name="email" type="email" autoComplete="email" maxLength={255} className="h-12 rounded-xl" />
        </F>
        <F label="Phone / WhatsApp" id="q-phone" error={errors.phone}>
          <Input id="q-phone" name="phone" type="tel" autoComplete="tel" placeholder="+254 7XX XXX XXX" maxLength={20} className="h-12 rounded-xl" />
        </F>
        <F label="Travel dates" id="q-dates" error={errors.dates}>
          <Input id="q-dates" name="dates" placeholder="e.g. 10–15 Aug 2027" maxLength={100} className="h-12 rounded-xl" />
        </F>
        <F label="Group size" id="q-group" error={errors.groupSize}>
          <Input id="q-group" name="groupSize" type="number" min={1} max={corporate ? 500 : 50} defaultValue={corporate ? 20 : 2} className="h-12 rounded-xl" />
        </F>
        <F label="Budget range" id="q-budget" error={errors.budget}>
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger id="q-budget" className="h-12 rounded-xl"><SelectValue placeholder="Select a range" /></SelectTrigger>
            <SelectContent>
              {budgetOptions.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </F>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-medium">{corporate ? "What are you planning?" : "Interests"}</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const checked = interests.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) =>
                    setInterests((prev) => (c ? [...prev, opt] : prev.filter((x) => x !== opt)))
                  }
                  className="sr-only"
                />
                {opt}
              </label>
            );
          })}
        </div>
      </fieldset>

      <F label="Message" id="q-msg" error={errors.message} className="mt-6">
        <Textarea
          id="q-msg"
          name="message"
          rows={4}
          maxLength={1000}
          defaultValue={defaultMessage}
          placeholder="Tell us about your dream trip — special occasions, accommodation style, must-sees…"
          className="rounded-xl"
        />
      </F>

      {errors.form && <p role="alert" className="mt-5 text-sm font-medium text-destructive">{errors.form}</p>}
      <Button type="submit" variant="hero" size="xl" className="mt-7 w-full md:w-auto" disabled={sending}>
        {sending ? <><Loader2 className="animate-spin" /> Sending…</> : corporate ? "Get My Corporate Proposal" : "Get My Free Quote"}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">Free & no obligation. We reply within 24 hours.</p>
    </form>
  );
}

function F({
  label,
  id,
  error,
  className,
  children,
}: {
  label: string;
  id: string;
  error?: string | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
