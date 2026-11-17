import { destinations, type Tour, type TripType } from "@/data/tours";

export interface ListingSearch {
  destination?: string | undefined;
  duration?: string | undefined;
  maxPrice?: number | undefined;
  travelers?: number | undefined;
}

export function parseListingSearch(search: Record<string, unknown>): ListingSearch {
  const str = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length < 60 ? v : undefined);
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  };
  return {
    destination: str(search["destination"]),
    duration: str(search["duration"]),
    maxPrice: num(search["maxPrice"]),
    travelers: num(search["travelers"]),
  };
}

export function destinationsForTours(tours: Pick<Tour, "destination" | "type">[], type: TripType) {
  const used = new Set(tours.filter((tour) => tour.type === type).map((tour) => tour.destination));
  return destinations.filter((destination) => used.has(destination.slug));
}

export const durationOptions: Record<TripType, { value: string; label: string }[]> = {
  safari: [
    { value: "2-3", label: "2 – 3 days" },
    { value: "4-5", label: "4 – 5 days" },
    { value: "6+", label: "6+ days" },
  ],
  "day-trip": [
    { value: "half", label: "Half day" },
    { value: "full", label: "Full day" },
  ],
  beach: [
    { value: "2-3", label: "2 – 3 days" },
    { value: "4-5", label: "4 – 5 days" },
    { value: "6+", label: "6+ days" },
  ],
  corporate: [
    { value: "day", label: "1 day" },
    { value: "multi", label: "2+ days" },
  ],
};

function matchesDuration(t: Tour, d?: string) {
  if (!d) return true;
  if (d === "2-3") return t.days >= 2 && t.days <= 3;
  if (d === "4-5") return t.days >= 4 && t.days <= 5;
  if (d === "6+") return t.days >= 6;
  if (d === "half") return (t.hours ?? 24) <= 6;
  if (d === "full") return (t.hours ?? 0) > 6;
  if (d === "day") return t.days <= 1;
  if (d === "multi") return t.days >= 2;
  return true;
}

export function filterTours(list: Tour[], s: ListingSearch) {
  return list.filter(
    (t) =>
      (!s.destination || t.destination === s.destination) &&
      matchesDuration(t, s.duration) &&
      (!s.maxPrice || t.priceUSD <= s.maxPrice),
  );
}
