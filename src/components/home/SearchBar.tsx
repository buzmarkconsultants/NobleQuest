import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tripTypeLabels, type Tour, type TripType } from "@/data/tours";
import { destinationsForTours, durationOptions } from "@/lib/listing";

const ANY = "any";

export function SearchBar({ trips }: { trips: Tour[] }) {
  const navigate = useNavigate();
  const [type, setType] = useState<TripType>("safari");
  const [destination, setDestination] = useState(ANY);
  const [duration, setDuration] = useState(ANY);
  const [travelers, setTravelers] = useState("2");
  const availableDestinations = destinationsForTours(trips, type);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const search = {
      destination: destination === ANY ? undefined : destination,
      duration: duration === ANY ? undefined : duration,
      travelers: Number(travelers),
    };
    navigate({ to: tripTypeLabels[type].listing, search });
  };

  return (
    <section aria-label="Find your trip" className="container-site relative z-10 -mt-24 md:-mt-20">
      <form
        onSubmit={submit}
        className="grid gap-3 rounded-3xl bg-card p-4 shadow-elevated sm:grid-cols-2 md:p-5 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] lg:items-end"
      >
        <Field label="Destination" id="s-dest">
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger id="s-dest" className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Anywhere in Kenya</SelectItem>
              {availableDestinations.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Trip type" id="s-type">
          <Select
            value={type}
            onValueChange={(v) => {
              const nextType = v as TripType;
              setType(nextType);
              setDuration(ANY);
              if (!destinationsForTours(trips, nextType).some((d) => d.slug === destination))
                setDestination(ANY);
            }}
          >
            <SelectTrigger id="s-type" className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safari">Safari</SelectItem>
              <SelectItem value="day-trip">Day Trips</SelectItem>
              <SelectItem value="beach">Beach Holidays</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Duration" id="s-dur">
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="s-dur" className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any length</SelectItem>
              {durationOptions[type].map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Travelers" id="s-trav">
          <Select value={travelers} onValueChange={setTravelers}>
            <SelectTrigger id="s-trav" className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
                <SelectItem key={n} value={n}>
                  {n} {n === "1" ? "traveler" : "travelers"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button
          type="submit"
          variant="accent"
          className="h-12 rounded-xl px-7 text-base sm:col-span-2 lg:col-span-1"
        >
          <Search /> Search
        </Button>
      </form>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
