import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { TourListing } from "@/components/site/TourListing";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { byType, loadTrips } from "@/lib/content";
import { parseListingSearch, type ListingSearch } from "@/lib/listing";
const title = `Kenya Beach Holidays — Diani, Watamu, Lamu & Malindi | ${site.name}`;
const description =
  "Beach holiday packages on the Kenyan coast: Diani, Watamu, Lamu and Malindi. Flights or SGR, beach hotels and ocean excursions. Secure with a 30% deposit.";

export const Route = createFileRoute("/beach-holidays")({
  validateSearch: (s: Record<string, unknown>): ListingSearch => parseListingSearch(s),
  loader: async () => ({ tours: byType(await loadTrips(), "beach") }),
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
        eyebrow="Beach holidays"
        title="Kenya coast escapes"
        description="White sand, coral reefs and Swahili culture — add a few beach days after your safari or plan a whole coastal holiday."
        image={images.pageHeaders.beachHolidays}
        imageAlt="Palm-fringed white sand beach on the Kenyan coast"
      />
      <TourListing
        type="beach"
        tours={tours}
        search={search}
        onChange={(next) => navigate({ search: next, replace: true, resetScroll: false })}
      />
    </>
  );
}
