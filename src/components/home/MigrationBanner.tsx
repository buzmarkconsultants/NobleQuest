import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/site/SmartImage";
import { images } from "@/data/images";

const months = [
  { m: "Jul", note: "Herds arrive" },
  { m: "Aug", note: "River crossings" },
  { m: "Sep", note: "Peak crossings" },
  { m: "Oct", note: "Herds depart" },
];

export function MigrationBanner() {
  return (
    <section className="container-site py-20 md:py-28">
      <div className="relative isolate overflow-hidden rounded-[2rem] px-6 py-16 md:px-14 md:py-24">
        <SmartImage
          src={images.home.migrationBanner}
          alt="Herd crossing the savanna at sunset during the migration"
          width={1600}
          sizes="100vw"
          className="absolute inset-0 -z-10"
        />
        <div className="absolute inset-0 -z-10 bg-primary-deep/65" />
        <div className="max-w-2xl">
          <p className="eyebrow text-gold">The Great Migration · 2027</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight text-on-image md:text-6xl">
            Witness 1.5 million wildebeest cross the Mara River
          </h2>
          <p className="mt-5 text-on-image-muted md:text-lg">
            The best months to see the migration in Kenya are July to October. Prime camps sell out a year
            ahead — reserve now with a 30% deposit.
          </p>
          <ul className="mt-8 grid max-w-lg grid-cols-4 gap-2">
            {months.map(({ m, note }) => (
              <li key={m} className="rounded-2xl bg-on-image/10 p-3 text-center backdrop-blur-sm ring-1 ring-on-image/20">
                <span className="block font-display text-2xl text-on-image">{m}</span>
                <span className="mt-1 block text-[0.65rem] leading-tight text-on-image-muted">{note}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="hero" size="xl" className="mt-9">
            <Link to="/tours/$slug" params={{ slug: "3-day-maasai-mara-classic" }}>
              Plan my migration safari <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
