import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Smartphone, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { images } from "@/data/images";
import { SmartImage } from "@/components/site/SmartImage";

const trust = [
  { Icon: ShieldCheck, label: "Licensed & Insured" },
  { Icon: UserCheck, label: "Local Expert Guides" },
  { Icon: Smartphone, label: "Pay with M-Pesa or Card" },
];

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-36 pt-28 md:items-center md:pb-40">
      <div className="absolute inset-0 -z-10">
        <SmartImage
          src={images.home.hero}
          alt="Safari vehicle on the Maasai Mara plains at sunset"
          width={2000}
          height={1333}
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-hero-overlay" />
      </div>
      <div className="container-site">
        <div className="max-w-3xl animate-fade-up">
          <p className="eyebrow mb-4 text-accent-soft">Safaris · Day Trips · Tailor-made</p>
          <h1 className="text-5xl font-semibold leading-[1.05] text-on-image sm:text-6xl lg:text-7xl">
            Experience the Wild Heart of Kenya
          </h1>
          <p className="mt-6 max-w-xl text-lg text-on-image-muted md:text-xl">
            Unforgettable game drives in the Maasai Mara, Amboseli and beyond guided by Kenyans who know
            every track, river and pride.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="hero" size="xl">
              <Link to="/safaris">
                Explore Safaris <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="heroOutline" size="xl">
              <Link to="/day-trips">Book a Day Trip</Link>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-on-image-muted">
            {trust.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gold" /> {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
