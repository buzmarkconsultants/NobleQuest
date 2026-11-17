import { createFileRoute } from "@tanstack/react-router";
import { DestinationsGrid } from "@/components/home/DestinationsGrid";
import { PageHeader } from "@/components/site/PageHeader";
import { images } from "@/data/images";

export const Route = createFileRoute("/destinations")({
  head: () => ({
    meta: [
      { title: "Kenya Safari Destinations | NobleQuest Safaris" },
      { name: "description", content: "Explore Maasai Mara, Amboseli, Tsavo, Samburu, Lake Nakuru and Naivasha — when to go and what you'll see." },
      { property: "og:title", content: "Kenya Safari Destinations | NobleQuest Safaris" },
      { property: "og:description", content: "Explore Maasai Mara, Amboseli, Tsavo, Samburu, Lake Nakuru and Naivasha — when to go and what you'll see." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <PageHeader eyebrow="Destinations" title="Kenya's wildest places" description="From the Mara's big cats to Samburu's rare northern species." image={images.pageHeaders.destinations} imageAlt="The Great Rift Valley escarpment seen from above" />
      <section className="container-site py-16"><DestinationsGrid showAll /></section>
    </>
  ),
});
