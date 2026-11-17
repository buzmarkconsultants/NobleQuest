import { Link } from "@tanstack/react-router";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label={`${site.name} home`}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-sunset text-accent-foreground shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M3 18h18v1.5H3zM12 5c-.6 0-1.7 1.8-1.7 3.1 0 .6.3 1.1.7 1.4C9.5 9.8 6.6 9 5 10c1 .2 2.4 1 3.6 1.9-1.7.1-3.4.8-4.1 1.6 1.7-.3 4.5.1 6.5.7V17h2v-2.8c2-.6 4.8-1 6.5-.7-.7-.8-2.4-1.5-4.1-1.6C16.6 11 18 10.2 19 10c-1.6-1-4.5-.2-6 .5.4-.3.7-.8.7-1.4C13.7 6.8 12.6 5 12 5z" />
        </svg>
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-lg font-semibold",
            tone === "light" ? "text-on-image" : "text-foreground",
          )}
        >
          {site.shortName}
        </span>
        <span
          className={cn(
            "block text-[0.62rem] font-semibold uppercase tracking-[0.25em]",
            tone === "light" ? "text-on-image-muted" : "text-accent",
          )}
        >
          {site.logoSubtitle}
        </span>
      </span>
    </Link>
  );
}
