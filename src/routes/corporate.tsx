import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { TourListing } from "@/components/site/TourListing";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { byType, loadTrips } from "@/lib/content";
import { parseListingSearch, type ListingSearch } from "@/lib/listing";
import { QuoteForm } from "@/components/site/QuoteForm";
const title = `Corporate Trips, Team Building & Incentive Safaris in Kenya | ${site.name}`;
const description =
  "Team-building days, leadership retreats and incentive safaris for companies in Kenya. Fixed group packages or a custom corporate quote within 24 hours.";

export const Route = createFileRoute("/corporate")({
  validateSearch: (s: Record<string, unknown>): ListingSearch => parseListingSearch(s),
  loader: async () => ({ tours: byType(await loadTrips(), "corporate") }),
  staleTime: 60_000,
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
  errorComponent: ListingError,
  notFoundComponent: () => <p className="container-site py-24 text-center">No trips found.</p>,
  component: ListingPage,
});

function ListingError() {
  const router = useRouter();
  return (
    <div role="alert" className="container-site py-24 text-center">
      <h1 className="text-3xl font-semibold">Trips couldn't load</h1>
      <p className="mt-2 text-muted-foreground">Please check your connection and try again.</p>
      <button type="button" onClick={() => router.invalidate()} className="mt-6 font-semibold text-accent hover:underline">Try again</button>
    </div>
  );
}

function ListingPage() {
  const { tours } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="Corporate trips"
        title="Team building & incentive travel"
        description="Fixed group packages you can book today or tell us your goals and headcount for a tailored corporate quote."
        image={images.pageHeaders.corporate}
        imageAlt="Colleagues celebrating together outdoors in Kenya"
      />
      <TourListing
        type="corporate"
        tours={tours}
        search={search}
        onChange={(next) => navigate({ search: next, replace: true, resetScroll: false })}
      />
      <section id="quote" className="bg-secondary/60 py-16 md:py-24">
        <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="eyebrow mb-3">Custom corporate quote</p>
            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Planning something bigger?</h2>
            <p className="mt-4 text-muted-foreground">
              Conferences with game drives, staff rewards, client hosting or year-end retreats. Share your headcount,
              dates and budget and our corporate desk will send a full proposal with an invoice your finance team can use.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ One invoice in KES or USD, with VAT receipt</li>
              <li>✓ Groups of 10 to 300+</li>
              <li>✓ Venues, transport, activities and meals handled for you</li>
            </ul>
          </div>
          <QuoteForm kind="corporate" />
        </div>
      </section>
    </>
  );
}
