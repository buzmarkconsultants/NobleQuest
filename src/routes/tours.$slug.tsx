import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, ChevronRight, Clock, MapPin, Users, X } from "lucide-react";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookingCard } from "@/components/site/BookingCard";
import { SmartImage } from "@/components/site/SmartImage";
import { DayTripCard, SafariCard } from "@/components/site/TourCards";
import { unsplashSized } from "@/data/images";
import { site } from "@/data/site";
import { getDestination, tripTypeLabels } from "@/data/tours";
import { loadTrips } from "@/lib/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tours/$slug")({
  loader: async ({ params }) => {
    const all = await loadTrips();
    const tour = all.find((t) => t.slug === params.slug);
    if (!tour) throw notFound();
    const related = all.filter((t) => t.type === tour.type && t.slug !== tour.slug).slice(0, 3);
    return { tour, related };
  },
  staleTime: 60_000,
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: `Tour not found | ${site.name}` }, { name: "robots", content: "noindex" }] };
    const { tour } = loaderData;
    const title = `${tour.title} | ${site.name}`;
    const description = `${tour.summary.slice(0, 150)}…`;
    const img = unsplashSized(tour.image, 1200, 630);
    const abs = img.startsWith("https://");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(abs ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-site py-32 text-center">
      <h1 className="text-4xl font-semibold">Tour not found</h1>
      <p className="mt-3 text-muted-foreground">This trip may have been renamed or retired.</p>
      <Link to="/safaris" className="mt-6 inline-block font-semibold text-accent hover:underline">Browse all safaris</Link>
    </div>
  ),
  component: TourPage,
});

function TourPage() {
  const { tour, related } = Route.useLoaderData();
  const destination = getDestination(tour.destination);
  const [active, setActive] = useState(0);
  const listing = tripTypeLabels[tour.type].listing;

  return (
    <article>
      <div className="container-site pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={listing} className="hover:text-foreground">{tripTypeLabels[tour.type].many}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="truncate text-foreground">{tour.title}</span>
        </nav>

        <header className="mt-5">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{tour.title}</h1>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-accent" />{tour.durationLabel}</li>
            {destination && <li className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent" />{destination.name}</li>}
            <li className="flex items-center gap-1.5"><Users className="h-4 w-4 text-accent" />{tour.groupSize}</li>
          </ul>
        </header>

        {/* Gallery */}
        <section aria-label="Photo gallery" className="mt-6 grid gap-3 md:grid-cols-[3fr_1fr]">
          <div className="aspect-[16/10] overflow-hidden rounded-3xl md:aspect-auto md:h-[520px]">
            <SmartImage
              key={(tour.gallery[active] ?? tour.gallery[0])?.src ?? tour.image}
              src={(tour.gallery[active] ?? tour.gallery[0])?.src ?? tour.image}
              alt={(tour.gallery[active] ?? tour.gallery[0])?.alt ?? tour.imageAlt}
              width={1400}
              priority
              className="animate-in fade-in duration-500"
            />
          </div>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-1 md:grid-rows-4">
            {tour.gallery.map((g, i) => (
              <button
                key={g.src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo: ${g.alt}`}
                aria-pressed={i === active}
                className={cn(
                  "aspect-square overflow-hidden rounded-2xl ring-offset-2 ring-offset-background transition md:aspect-auto",
                  i === active ? "ring-2 ring-accent" : "opacity-80 hover:opacity-100",
                )}
              >
                <SmartImage src={g.src} alt="" width={320} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="container-site grid gap-12 py-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-14">
          <section>
            <h2 className="text-3xl font-semibold">Overview</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{tour.summary}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {tour.highlights.map((h) => (
                <li key={h} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium">{h}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold">{tour.days > 1 ? "Day-by-day itinerary" : "Schedule"}</h2>
            <Accordion type="multiple" defaultValue={["item-0"]} className="mt-5 rounded-3xl border border-border bg-card px-6">
              {tour.itinerary.map((d, i) => (
                <AccordionItem key={d.day + d.title} value={`item-${i}`} className="last:border-b-0">
                  <AccordionTrigger className="py-5 text-left hover:no-underline">
                    <span className="flex items-center gap-4">
                      <span className="min-w-20 rounded-full bg-accent-soft px-3 py-1 text-center text-xs font-bold text-accent">{d.day}</span>
                      <span className="font-display text-lg">{d.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">{d.description}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-secondary/70 p-7">
              <h2 className="text-2xl font-semibold">What's included</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {tour.included.map((x) => (
                  <li key={x} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border p-7">
              <h2 className="text-2xl font-semibold">Not included</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {tour.excluded.map((x) => (
                  <li key={x} className="flex gap-3"><X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />{x}</li>
                ))}
              </ul>
            </div>
          </section>

          {destination && (
            <section>
              <h2 className="text-3xl font-semibold">Where you'll go</h2>
              <p className="mt-2 text-muted-foreground">{destination.name} · {destination.region} · Best time: {destination.bestTime}</p>
              <div className="mt-5 aspect-[16/9] overflow-hidden rounded-3xl border border-border bg-muted">
                <iframe
                  title={`Map of ${destination.name}`}
                  loading="lazy"
                  className="h-full w-full"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${destination.lng - 0.6}%2C${destination.lat - 0.4}%2C${destination.lng + 0.6}%2C${destination.lat + 0.4}&layer=mapnik&marker=${destination.lat}%2C${destination.lng}`}
                />
              </div>
            </section>
          )}

          <section>
            <h2 className="text-3xl font-semibold">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-5">
              {tour.faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit" aria-label="Book this trip">
          <BookingCard tour={tour} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-secondary/60 py-16">
          <div className="container-site">
            <h2 className="mb-8 text-3xl font-semibold">You might also like</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (t.type === "day-trip" ? <DayTripCard key={t.slug} tour={t} /> : <SafariCard key={t.slug} tour={t} />))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
