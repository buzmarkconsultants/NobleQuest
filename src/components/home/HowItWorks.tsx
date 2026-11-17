import { CreditCard, MapPinned, Sunrise } from "lucide-react";

const steps = [
  { Icon: MapPinned, title: "Choose your trip", text: "Pick a safari or day trip or request a custom itinerary built around you." },
  {
    Icon: CreditCard,
    title: "Confirm & pay a deposit",
    text: "Secure safaris with a 30% deposit via M-Pesa or card. Day trips are paid in full instantly.",
  },
  { Icon: Sunrise, title: "Enjoy your adventure", text: "We pick you up from your hotel or the airport. All you need to do is look out for lions." },
];

export function HowItWorks() {
  return (
    <section className="bg-forest py-20 text-primary-foreground md:py-28">
      <div className="container-site">
        <div className="mb-12 text-center md:mb-16">
          <p className="eyebrow mb-3 text-gold">How it works</p>
          <h2 className="text-3xl font-semibold md:text-5xl">Booking in three easy steps</h2>
        </div>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map(({ Icon, title, text }, i) => (
            <li key={title} className="relative rounded-3xl bg-primary-foreground/5 p-8 ring-1 ring-primary-foreground/10">
              <span className="absolute right-6 top-4 font-display text-6xl font-semibold text-primary-foreground/10">
                0{i + 1}
              </span>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-sunset text-accent-foreground">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

