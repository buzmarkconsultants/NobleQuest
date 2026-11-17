import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { site } from "@/data/site";
import { subscribeNewsletter } from "@/lib/content.functions";
import { PaymentBadges } from "./BrandBadges";
import { Logo } from "./Logo";

const emailSchema = z.string().trim().email().max(255);

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const save = useServerFn(subscribeNewsletter);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSchema.safeParse(email).success) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const res = await save({ data: { email } });
      if (!res.ok) throw new Error("subscribe failed");
      toast.success("You're subscribed! Expect safari deals and travel tips soon.");
      setEmail("");
    } catch {
      toast.error("We couldn't sign you up just now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const socials = [
    { href: site.socials.facebook, label: "Facebook", Icon: Facebook },
    { href: site.socials.instagram, label: "Instagram", Icon: Instagram },
    { href: site.socials.youtube, label: "YouTube", Icon: Youtube },
    { href: site.socials.twitter, label: "X (Twitter)", Icon: Twitter },
  ];

  return (
    <footer className="bg-primary-deep text-primary-foreground">
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/75">
            Locally owned safari and day-trip specialists, showing travellers the wild heart of Kenya since 2012.
          </p>
          <div className="mt-6 flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-accent"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="font-display text-lg">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/75">
            <li><Link to="/safaris" className="hover:text-accent-soft">Safaris</Link></li>
            <li><Link to="/day-trips" className="hover:text-accent-soft">Day Trips</Link></li>
            <li><Link to="/beach-holidays" className="hover:text-accent-soft">Beach Holidays</Link></li>
            <li><Link to="/corporate" className="hover:text-accent-soft">Corporate Trips</Link></li>
            <li><Link to="/destinations" className="hover:text-accent-soft">Destinations</Link></li>
            <li><Link to="/blog" className="hover:text-accent-soft">Travel Tips</Link></li>
            <li><Link to="/reviews" className="hover:text-accent-soft">Reviews</Link></li>
            <li><Link to="/about" className="hover:text-accent-soft">About Us</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h3 className="font-display text-lg">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{site.address}</li>
            <li>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex gap-2.5 hover:text-accent-soft">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex gap-2.5 hover:text-accent-soft">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{site.email}
              </a>
            </li>
            <li className="pt-2 text-xs text-primary-foreground/60">
              Tourism Regulatory Authority Licence No. {site.licenseNo}
              <br />
              {site.kato}
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h3 className="font-display text-lg">Safari deals in your inbox</h3>
          <p className="mt-2 text-sm text-primary-foreground/75">Seasonal offers and migration updates. No spam.</p>
          <form onSubmit={subscribe} className="mt-4 flex gap-2">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <Input
              id="newsletter-email"
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-11 rounded-full border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button type="submit" variant="accent" className="h-11 rounded-full px-5" disabled={busy}>{busy ? "…" : "Join"}</Button>
          </form>
          <p className="mt-6 text-xs uppercase tracking-widest text-primary-foreground/60">We accept</p>
          <PaymentBadges className="mt-2" />
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-primary-foreground/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>
            Prices are per person and subject to availability. Exchange rate is indicative. ·{" "}
            <Link to="/auth" className="underline-offset-2 hover:underline">Staff sign-in</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
