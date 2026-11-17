import { createFileRoute } from "@tanstack/react-router";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { PageHeader } from "@/components/site/PageHeader";
import { images } from "@/data/images";
import { site } from "@/data/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Local Kenyan Safari Experts | NobleQuest Safaris" },
      { name: "description", content: "A locally owned, licensed tour operator in Nairobi with expert guides, 4x4 safari vehicles and honest pricing." },
      { property: "og:title", content: "About Us — Local Kenyan Safari Experts | NobleQuest Safaris" },
      { property: "og:description", content: "A locally owned, licensed tour operator in Nairobi with expert guides, 4x4 safari vehicles and honest pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <PageHeader eyebrow="About us" title="Born in Kenya, built for explorers" image={images.pageHeaders.about} imageAlt="Elephant walking across the savanna" />
      <section className="container-site max-w-3xl py-16 text-lg leading-relaxed text-muted-foreground">
        <p>{site.name} is a locally owned tour operator based in Nairobi. Our guides grew up beside the parks they now share with travellers because they know every track, river and pride.</p>
        <p className="mt-5">We're licensed by the Tourism Regulatory Authority (Licence No. {site.licenseNo}), fully insured and committed to responsible tourism that supports local communities and conservation.</p>
      </section>
      <WhyChooseUs />
    </>
  ),
});
