import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/site/SmartImage";
import { destinations } from "@/data/tours";
import { cn } from "@/lib/utils";

export function DestinationsGrid({ showAll = false }: { showAll?: boolean }) {
  const list = showAll ? destinations : destinations.filter((d) => d.showInGrid);
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
      {list.map((d, i) => (
        <Link
          key={d.slug}
          to="/safaris"
          search={{ destination: d.slug }}
          className={cn(
            "zoom-img group relative isolate block overflow-hidden rounded-3xl",
            !showAll && i === 0 ? "col-span-2 aspect-[16/10] lg:col-span-1 lg:row-span-2 lg:aspect-auto" : "aspect-[4/5] md:aspect-[4/3]",
          )}
        >
          <SmartImage src={d.image} alt={d.imageAlt} width={720} className="absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-card-overlay transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute inset-0 -z-10 bg-primary-deep/0 transition-colors duration-500 group-hover:bg-primary-deep/45" />
          <div className="flex h-full flex-col justify-end p-4 md:p-6">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-on-image-muted">{d.region}</p>
            <h3 className="mt-1 flex items-center gap-2 text-xl font-semibold text-on-image md:text-2xl">
              {d.name}
              <ArrowUpRight className="h-5 w-5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
            </h3>
            <p className="mt-2 hidden max-h-0 overflow-hidden text-sm text-on-image-muted opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100 md:block">
              {d.blurb}
              <span className="mt-1 block text-xs text-gold">Best time: {d.bestTime}</span>
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
