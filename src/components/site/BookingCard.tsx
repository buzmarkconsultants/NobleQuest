import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Tour } from "@/data/tours";
import { useCurrency } from "@/lib/currency";
import { allowsDeposit, depositUSD, SAFARI_DEPOSIT_RATE, tripTotalUSD } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { PaymentBadges } from "./BrandBadges";

export function DatePicker({
  date,
  onChange,
  id,
}: {
  date?: Date | undefined;
  onChange: (d?: Date) => void;
  id: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn("h-12 w-full justify-start rounded-xl text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="text-accent" />
          {date ? format(date, "EEE, d MMM yyyy") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          disabled={{ before: new Date(today.getTime() + 86400000) }}
          initialFocus
          className="pointer-events-auto p-3"
        />
      </PopoverContent>
    </Popover>
  );
}

export function TravelerStepper({
  value,
  onChange,
  id,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (n: number) => void;
  id: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-input bg-background px-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Fewer travelers"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus />
      </Button>
      <output id={id} aria-live="polite" className="text-sm font-semibold">
        {value} {value === 1 ? "traveler" : "travelers"}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="More travelers"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus />
      </Button>
    </div>
  );
}

export function BookingCard({ tour }: { tour: Tour }) {
  const { format: fmt } = useCurrency();
  const [date, setDate] = useState<Date>();
  const [travelers, setTravelers] = useState(Math.max(2, tour.minGroup));
  const total = tripTotalUSD(tour.priceUSD, travelers);
  const deposit = depositUSD(total, tour.type);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated">
      <p className="text-sm text-muted-foreground">From</p>
      <p className="font-display text-4xl font-semibold text-foreground">
        {fmt(tour.priceUSD)} <span className="font-sans text-sm font-normal text-muted-foreground">per person</span>
      </p>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bc-date">Travel date</Label>
          <DatePicker id="bc-date" date={date} onChange={setDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bc-trav">Travelers</Label>
          <TravelerStepper id="bc-trav" value={travelers} onChange={setTravelers} min={tour.minGroup} max={tour.type === "corporate" ? 300 : 20} />
        </div>
      </div>

      <dl className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{fmt(tour.priceUSD)} × {travelers}</dt>
          <dd className="font-semibold">{fmt(total)}</dd>
        </div>
        {allowsDeposit(tour.type) && (
          <div className="flex justify-between text-primary">
            <dt>Deposit due today ({SAFARI_DEPOSIT_RATE * 100}%)</dt>
            <dd className="font-semibold">{fmt(deposit)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 grid gap-2">
        <Button asChild variant="hero" size="xl">
          <Link
            to="/book"
            search={{ tour: tour.slug, date: date ? format(date, "yyyy-MM-dd") : undefined, travelers }}
          >
            Book Now
          </Link>
        </Button>
        <Button asChild variant="outline" size="xl">
          <Link to="/contact" search={{ tour: tour.slug }}>Request Quote</Link>
        </Button>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" /> Free cancellation · secure payment
      </p>
      <PaymentBadges className="mt-3" />
    </div>
  );
}
