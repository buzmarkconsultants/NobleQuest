import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import { CurrencyToggle } from "./CurrencyToggle";
import { Logo } from "./Logo";

const links = [
  { to: "/safaris", label: "Safaris" },
  { to: "/day-trips", label: "Day Trips" },
  { to: "/beach-holidays", label: "Beach" },
  { to: "/corporate", label: "Corporate" },
  { to: "/destinations", label: "Destinations" },
  { to: "/about", label: "About" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const transparent = overHero && !scrolled;

  return (
    <header
      className={cn(
        "top-0 z-40 w-full transition-colors duration-300",
        overHero ? "fixed" : "sticky",
        transparent
          ? "bg-transparent"
          : "border-b border-border/70 bg-background/90 shadow-card backdrop-blur-md",
      )}
    >
      <nav
        className="container-site flex h-16 items-center justify-between gap-4 md:h-20"
        aria-label="Main"
      >
        <Logo tone={transparent ? "light" : "dark"} />

        <ul className="hidden items-center gap-0.5 xl:flex">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  transparent
                    ? "text-on-image/90 hover:bg-on-image/10 hover:text-on-image"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                )}
                activeProps={{ className: transparent ? "text-on-image" : "text-primary" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <CurrencyToggle className="hidden sm:inline-flex" />
          <Button asChild variant="hero" size="lg" className="hidden sm:inline-flex">
            <Link to="/book">Book Now</Link>
          </Button>
          <Button
            asChild
            variant={transparent ? "heroOutline" : "outline"}
            size="lg"
            className="hidden lg:inline-flex"
          >
            <Link to="/auth">Staff Sign-in</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "xl:hidden",
                  transparent && "text-on-image hover:bg-on-image/10 hover:text-on-image",
                )}
                aria-label="Open menu"
              >
                <Menu className="!size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[85vw] max-w-sm flex-col bg-background">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo className="mb-6" />
              <ul className="flex flex-col gap-1">
                {links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="block rounded-xl px-3 py-3 font-display text-xl text-foreground hover:bg-secondary"
                      activeProps={{ className: "bg-secondary text-primary" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-4 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <CurrencyToggle />
                </div>
                <Button asChild variant="hero" size="xl">
                  <Link to="/book">Book Now</Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link to="/auth">Staff Sign-in</Link>
                </Button>
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-primary"
                >
                  <Phone className="h-4 w-4" /> {site.phone}
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
