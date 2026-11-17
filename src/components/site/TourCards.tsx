import { Link } from "@tanstack/react-router";
import { Check, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tour } from "@/data/tours";
import { useCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/pricing";
import { SmartImage } from "./SmartImage";

export function SafariCard({ tour }: { tour: Tour }) {
  const { format } = useCurrency();
  return (
    <article className="lift zoom-img group flex flex-col overflow-hidden rounded-3xl bg-card shadow-card">
      <Link to="/tours/$slug" params={{ slug: tour.slug }} className="relative block aspect-[4/3] overflow-hidden">
        <SmartImage src={tour.image} alt={tour.imageAlt} width={720} />
        <Badge className="absolute left-4 top-4 rounded-full border-0 bg-background/95 px-3 py-1 text-xs font-semibold text-foreground shadow-card">
          <Clock className="mr-1 h-3.5 w-3.5 text-accent" /> {tour.durationLabel}
        </Badge>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-semibold leading-snug">
          <Link to="/tours/$slug" params={{ slug: tour.slug }} className="hover:text-primary">
            {tour.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          From <span className="text-lg font-bold text-accent">{format(tour.priceUSD)}</span> per person
          {tour.minGroup > 1 && <span className="block text-xs">Minimum group: {tour.minGroup} people</span>}
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {tour.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" /> {h}
            </li>
          ))}
        </ul>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
          <Button asChild variant="forest" className="rounded-full">
            <Link to="/tours/$slug" params={{ slug: tour.slug }}>View Details</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/contact" search={{ tour: tour.slug }}>Request Quote</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function DayTripCard({ tour }: { tour: Tour }) {
  const { currency } = useCurrency();
  const primary = formatPrice(tour.priceUSD, currency);
  const secondary = formatPrice(tour.priceUSD, currency === "USD" ? "KES" : "USD");
  return (
    <article className="lift zoom-img group flex flex-col overflow-hidden rounded-3xl bg-card shadow-card">
      <Link to="/tours/$slug" params={{ slug: tour.slug }} className="relative block aspect-[4/3] overflow-hidden">
        <SmartImage src={tour.image} alt={tour.imageAlt} width={560} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-semibold leading-snug">
          <Link to="/tours/$slug" params={{ slug: tour.slug }} className="hover:text-primary">
            {tour.title}
          </Link>
        </h3>
        <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Duration</dt>
            <Clock className="h-4 w-4 text-accent" /> <dd>{tour.durationLabel}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Pick-up</dt>
            <MapPin className="h-4 w-4 text-accent" /> <dd>Pick-up: {tour.pickup}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-lg font-bold leading-tight text-foreground">{primary}</p>
            <p className="text-xs text-muted-foreground">≈ {secondary} pp</p>
          </div>
          <Button asChild variant="accent" className="rounded-full">
            <Link to="/book" search={{ tour: tour.slug }}>Book Now</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
