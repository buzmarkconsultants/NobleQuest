import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { QuoteForm } from "@/components/site/QuoteForm";
import { images } from "@/data/images";
import { site, whatsappLink } from "@/data/site";
import { loadTrips } from "@/lib/content";

export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>): { tour?: string | undefined } => ({
    tour: typeof s["tour"] === "string" && /^[a-z0-9-]{1,120}$/.test(s["tour"]) ? s["tour"] : undefined,
  }),
  loaderDeps: ({ search }) => ({ tour: search.tour }),
  loader: async ({ deps }) => {
    if (!deps.tour) return { trip: null };
    const t = (await loadTrips()).find((x) => x.slug === deps.tour);
    return { trip: t ? { slug: t.slug, title: t.title, type: t.type } : null };
  },
  head: () => ({
    meta: [
      { title: "Contact Us & Request a Free Safari Quote | NobleQuest Safaris" },
      { name: "description", content: "Call, WhatsApp or send us your dates for a free tailor-made Kenya safari quote within 24 hours." },
      { property: "og:title", content: "Contact Us & Request a Free Safari Quote | NobleQuest Safaris" },
      { property: "og:description", content: "Call, WhatsApp or send us your dates for a free tailor-made Kenya safari quote within 24 hours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { trip: t } = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Contact" title="Let's plan your trip" description="Free quotes within 24 hours." image={images.pageHeaders.contact} imageAlt="Acacia tree at sunset" />
      <section className="container-site grid gap-10 py-16 lg:grid-cols-[1fr_1.4fr]">
        <ul className="space-y-5 text-muted-foreground">
          <li className="flex gap-3"><MapPin className="h-5 w-5 text-accent" />{site.address}</li>
          <li><a className="flex gap-3 hover:text-foreground" href={`tel:${site.phone.replace(/\s/g, "")}`}><Phone className="h-5 w-5 text-accent" />{site.phone}</a></li>
          <li><a className="flex gap-3 hover:text-foreground" href={`mailto:${site.email}`}><Mail className="h-5 w-5 text-accent" />{site.email}</a></li>
          <li><a className="font-semibold text-primary hover:underline" href={whatsappLink()} target="_blank" rel="noopener noreferrer">Chat on WhatsApp →</a></li>
          <li className="text-sm">{site.hours}</li>
        </ul>
        <QuoteForm
          kind={t?.type === "corporate" ? "corporate" : "custom"}
          tripSlug={t?.slug}
          defaultMessage={t ? `I'm interested in the ${t.title}.` : ""}
        />
      </section>
    </>
  );
}
