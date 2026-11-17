import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { TourListing } from "@/components/site/TourListing";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { byType, loadTrips } from "@/lib/content";
import { parseListingSearch, type ListingSearch } from "@/lib/listing";
const title = `Nairobi Day Trips & Excursions | ${site.name}`;
const description =
  "Half and full-day trips from Nairobi: Nairobi National Park, Hell's Gate & Lake Naivasha, Giraffe Centre, Ol Pejeta. Hotel pick-up, prices in KES & USD.";

export const Route = createFileRoute("/day-trips")({
  validateSearch: (s: Record<string, unknown>): ListingSearch => parseListingSearch(s),
  loader: async () => ({ tours: byType(await loadTrips(), "day-trip") }),
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
        eyebrow="Day trips from Nairobi"
        title="Day trips & excursions"
        description="Perfect for layovers, business travellers and families. Hotel or airport pick-up and instant confirmation."
        image={images.pageHeaders.dayTrips}
        imageAlt="Young elephant walking across the open plains"
      />
      <TourListing
        type="day-trip"
        tours={tours}
        search={search}
        onChange={(next) => navigate({ search: next, replace: true, resetScroll: false })}
      />
    </>
  );
}
