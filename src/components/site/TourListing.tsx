import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { tripTypeLabels, type Tour, type TripType } from "@/data/tours";
import { useCurrency } from "@/lib/currency";
import {
  destinationsForTours,
  durationOptions,
  filterTours,
  type ListingSearch,
} from "@/lib/listing";
import { DayTripCard, SafariCard } from "./TourCards";

const ANY = "any";

export function TourListing({
  type,
  tours,
  search,
  onChange,
}: {
  type: TripType;
  tours: Tour[];
  search: ListingSearch;
  onChange: (next: ListingSearch) => void;
}) {
  const { format } = useCurrency();
  const prices = tours.length ? tours.map((t) => t.priceUSD) : [0];
  const ceiling = Math.max(50, Math.ceil(Math.max(...prices) / 50) * 50);
  const floor = Math.min(ceiling - 50, Math.floor(Math.min(...prices) / 50) * 50);
  const isDayTrip = type === "day-trip";
  const maxPrice = search.maxPrice ?? ceiling;
  const results = filterTours(tours, search);
  const usedDestinations = destinationsForTours(tours, type);
  const active = Boolean(search.destination || search.duration || search.maxPrice);

  return (
    <section className="container-site py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label="Filters" className="h-fit rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-28">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider">
              <SlidersHorizontal className="h-4 w-4 text-accent" /> Filters
            </h2>
            {active && (
              <button
                type="button"
                onClick={() => onChange({ travelers: search.travelers })}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="f-dest">Destination</Label>
              <Select
                value={search.destination ?? ANY}
                onValueChange={(v) => onChange({ ...search, destination: v === ANY ? undefined : v })}
              >
                <SelectTrigger id="f-dest" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All destinations</SelectItem>
                  {usedDestinations.map((d) => (
                    <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="f-dur">Duration</Label>
              <Select
                value={search.duration ?? ANY}
                onValueChange={(v) => onChange({ ...search, duration: v === ANY ? undefined : v })}
              >
                <SelectTrigger id="f-dur" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any length</SelectItem>
                  {durationOptions[type].map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label id="f-price">Max price pp</Label>
                <span className="text-sm font-semibold text-accent">{format(maxPrice)}</span>
              </div>
              <Slider
                aria-labelledby="f-price"
                min={floor}
                max={ceiling}
                step={isDayTrip ? 5 : 50}
                value={[maxPrice]}
                onValueChange={([v]) => onChange({ ...search, maxPrice: v === undefined || v >= ceiling ? undefined : v })}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{format(floor)}</span>
                <span>{format(ceiling)}</span>
              </div>
            </div>
          </div>
        </aside>

        <div>
          <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
            Showing <strong className="text-foreground">{results.length}</strong> of {tours.length}{" "}
            {tripTypeLabels[type].many.toLowerCase()}
            {search.travelers ? ` · ${search.travelers} travelers` : ""}
          </p>
          {results.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <h3 className="text-2xl font-semibold">No trips match those filters</h3>
              <p className="mt-2 text-muted-foreground">Try widening your search — or ask us for a custom itinerary.</p>
              <Button variant="forest" className="mt-6 rounded-full" onClick={() => onChange({})}>
                Reset filters
              </Button>
            </div>
          ) : (
            <div className={isDayTrip ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"}>
              {results.map((t) =>
                isDayTrip ? <DayTripCard key={t.slug} tour={t} /> : <SafariCard key={t.slug} tour={t} />,
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
