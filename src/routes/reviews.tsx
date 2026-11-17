import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { ReviewBadges, TestimonialCard } from "@/components/site/Reviews";
import { images } from "@/data/images";
import { loadReviews } from "@/lib/content";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Guest Reviews | NobleQuest Safaris" },
      { name: "description", content: "Read 5-star reviews from travellers on TripAdvisor and Google about our Kenya safaris and day trips." },
      { property: "og:title", content: "Guest Reviews | NobleQuest Safaris" },
      { property: "og:description", content: "Read 5-star reviews from travellers on TripAdvisor and Google about our Kenya safaris and day trips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => ({ testimonials: await loadReviews() }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { testimonials } = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Reviews" title="What our guests say" image={images.pageHeaders.reviews} imageAlt="Happy travellers in a safari vehicle watching elephants" />
      <section className="container-site py-16">
        <ReviewBadges className="mb-12" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => <TestimonialCard key={t.id} t={t} />)}
        </div>
      </section>
    </>
  );
}
