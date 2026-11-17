import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { TourListing } from "@/components/site/TourListing";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { byType, loadTrips } from "@/lib/content";
import { parseListingSearch, type ListingSearch } from "@/lib/listing";
const title = `Kenya Safari Packages — Maasai Mara, Amboseli & Tsavo | ${site.name}`;
const description =
  "Compare 2 to 7-day Kenya safaris with pop-up roof 4x4s, expert guides and transparent prices. Secure with a 30% deposit via M-Pesa or card.";

export const Route = createFileRoute("/safaris")({
  validateSearch: (s: Record<string, unknown>): ListingSearch => parseListingSearch(s),
  loader: async () => ({ tours: byType(await loadTrips(), "safari") }),
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
        eyebrow="Safari packages"
        title="Kenya safaris"
        description="From quick Mara escapes to week-long Big Five circuits  every safari includes park fees, full-board stays and a private pop-up roof 4x4 option."
        image={images.pageHeaders.safaris}
        imageAlt="Elephants grazing at sunset in Amboseli"
      />
      <TourListing
        type="safari"
        tours={tours}
        search={search}
        onChange={(next) => navigate({ search: next, replace: true, resetScroll: false })}
      />
    </>
  );
}
