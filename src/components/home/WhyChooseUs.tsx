import { BadgeDollarSign, Binoculars, CarFront, Route } from "lucide-react";
import { SectionHeading } from "@/components/site/SectionHeading";

const items = [
  {
    Icon: Binoculars,
    title: "Expert local guides",
    text: "KPSGA-certified Kenyan guides with 10+ years tracking wildlife in the parks they grew up beside.",
  },
  {
    Icon: CarFront,
    title: "4x4 pop-up roof vehicles",
    text: "Well-maintained Land Cruisers with pop-up roofs, window seats for all and charging ports.",
  },
  {
    Icon: Route,
    title: "Flexible custom itineraries",
    text: "Private or shared, budget or luxury  we design each trip around your dates and dreams.",
  },
  {
    Icon: BadgeDollarSign,
    title: "Transparent pricing",
    text: "Park fees, transport and meals clearly listed. No hidden fees, ever.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-site">
        <SectionHeading eyebrow="Why travel with us" title="Safari done the Kenyan way" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ Icon, title, text }) => (
            <div key={title} className="lift rounded-3xl border border-border bg-card p-7">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
