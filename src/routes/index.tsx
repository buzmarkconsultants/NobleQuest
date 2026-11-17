import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BlogCard } from "@/components/home/BlogCard";
import { DestinationsGrid } from "@/components/home/DestinationsGrid";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { MigrationBanner } from "@/components/home/MigrationBanner";
import { SearchBar } from "@/components/home/SearchBar";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/site/QuoteForm";
import { ReviewBadges, TestimonialsCarousel } from "@/components/site/Reviews";
import { SectionHeading } from "@/components/site/SectionHeading";
import { DayTripCard, SafariCard } from "@/components/site/TourCards";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { byType, loadArticles, loadReviews, loadTrips } from "@/lib/content";

const title = `${site.name} | Maasai Mara Safaris & Nairobi Day Trips`;
const description =
  "Book Kenya safaris to the Maasai Mara, Amboseli and Tsavo, plus Nairobi day trips. Expert local guides, 4x4 pop-up roof vehicles, pay with M-Pesa or card.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const [trips, testimonials, blogPosts] = await Promise.all([loadTrips(), loadReviews(), loadArticles()]);
    return { trips, testimonials, blogPosts: blogPosts.slice(0, 3) };
  },
  staleTime: 60_000,
  component: Index,
});

function Index() {
  const { trips, testimonials, blogPosts } = Route.useLoaderData();
  const safaris = byType(trips, "safari");
  const dayTrips = byType(trips, "day-trip");
  const featuredSafaris = safaris.filter((t) => t.featured).slice(0, 3);
  const featuredDayTrips = dayTrips.filter((t) => t.featured).slice(0, 4);

  return (
    <>
      <Hero />
      <SearchBar trips={trips} />

      <section className="py-20 md:py-28" aria-labelledby="featured-safaris">
        <div className="container-site">
          <SectionHeading
            align="left"
            eyebrow="Featured safaris"
            title="Our most-loved safaris"
            description="Small groups, pop-up roof Land Cruisers and handpicked camps."
            action={
              <Button asChild variant="link" className="px-0 text-base">
                <Link to="/safaris">View all safaris <ArrowRight /></Link>
              </Button>
            }
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredSafaris.map((t) => (
              <SafariCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/60 py-20 md:py-28" aria-labelledby="day-trips">
        <div className="container-site">
          <SectionHeading
            align="left"
            eyebrow="Popular day trips"
            title="Adventures from Nairobi"
            description="Back at your hotel by evening. Instant booking, paid in full by M-Pesa or card."
            action={
              <Button asChild variant="link" className="px-0 text-base">
                <Link to="/day-trips">All day trips <ArrowRight /></Link>
              </Button>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredDayTrips.map((t) => (
              <DayTripCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>

      <WhyChooseUs />

      <section className="pb-20 md:pb-28">
        <div className="container-site">
          <SectionHeading eyebrow="Destinations" title="Where the wild things roam" />
          <DestinationsGrid />
        </div>
      </section>

      <HowItWorks />

      <section id="quote" className="py-20 md:py-28">
        <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow mb-3">Tailor-made safari</p>
            <h2 className="text-3xl font-semibold leading-tight md:text-5xl">Design your dream safari</h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Tell us your dates, group and budget. A Nairobi-based safari expert will craft a personalised itinerary
              with transparent pricing free.
            </p>
            <div className="mt-8 hidden aspect-[4/3] overflow-hidden rounded-3xl lg:block">
              <img
                src={images.home.quoteSection}
                alt="Giraffe silhouetted against a sunset sky"
                loading="lazy"
                width={800}
                height={600}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <QuoteForm />
        </div>
      </section>

      <section className="bg-secondary/60 py-20 md:py-28" aria-labelledby="reviews">
        <div className="container-site">
          <SectionHeading eyebrow="Guest reviews" title="Loved by travellers worldwide" />
          <ReviewBadges className="-mt-4 mb-12" />
          <TestimonialsCarousel items={testimonials} />
        </div>
      </section>

      <MigrationBanner />

      <section className="pb-20 md:pb-28">
        <div className="container-site">
          <SectionHeading
            align="left"
            eyebrow="Travel tips"
            title="Plan like a pro"
            action={
              <Button asChild variant="link" className="px-0 text-base">
                <Link to="/blog">All articles <ArrowRight /></Link>
              </Button>
            }
          />
          <div className="grid gap-8 md:grid-cols-3">
            {blogPosts.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
