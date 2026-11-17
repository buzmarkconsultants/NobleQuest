import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { site } from "@/data/site";
import type { Testimonial } from "@/data/tours";
import { cn } from "@/lib/utils";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < Math.round(rating) ? "fill-gold text-gold" : "text-border")} />
      ))}
    </span>
  );
}

export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-card">
      <div className="flex items-center justify-between">
        <Stars rating={t.rating} />
        <span className="text-xs font-medium text-muted-foreground">via {t.source}</span>
      </div>
      <blockquote className="mt-5 flex-1 font-display text-lg leading-relaxed text-foreground">“{t.quote}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <span className="text-2xl" role="img" aria-label={t.country}>{t.flag}</span>
        <span>
          <span className="block text-sm font-semibold">{t.name}</span>
          <span className="block text-xs text-muted-foreground">{t.trip}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  return (
    <Carousel opts={{ align: "start", loop: true }} className="w-full">
      <CarouselContent className="-ml-4">
        {items.map((t) => (
          <CarouselItem key={t.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
            <TestimonialCard t={t} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-8 flex justify-center gap-3">
        <CarouselPrevious className="static h-11 w-11 translate-y-0 rounded-full" />
        <CarouselNext className="static h-11 w-11 translate-y-0 rounded-full" />
      </div>
    </Carousel>
  );
}

export function ReviewBadges({ className }: { className?: string }) {
  const { tripadvisor, google } = site.ratings;
  return (
    <div className={cn("flex flex-wrap justify-center gap-3", className)}>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="7" cy="13" r="3.5" />
            <circle cx="17" cy="13" r="3.5" />
            <circle cx="7" cy="13" r="1" fill="currentColor" />
            <circle cx="17" cy="13" r="1" fill="currentColor" />
            <path d="M3 8.5h18M12 8.5l-1.5 3M12 8.5l1.5 3" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold">TripAdvisor · Travellers' Choice</p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Stars rating={tripadvisor.score} className="[&_svg]:h-3 [&_svg]:w-3" /> {tripadvisor.score.toFixed(1)} · {tripadvisor.count} reviews
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-display text-xl font-bold text-accent" aria-hidden="true">
          G
        </span>
        <div>
          <p className="text-sm font-semibold">Google Reviews</p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Stars rating={google.score} className="[&_svg]:h-3 [&_svg]:w-3" /> {google.score.toFixed(1)} · {google.count} reviews
          </p>
        </div>
      </div>
    </div>
  );
}
