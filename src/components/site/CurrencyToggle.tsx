import { useCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const opts: Currency[] = ["USD", "KES"];
  return (
    <div
      role="radiogroup"
      aria-label="Display currency"
      className={cn("inline-flex rounded-full border border-border bg-card p-0.5 text-xs font-semibold", className)}
    >
      {opts.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={currency === c}
          onClick={() => setCurrency(c)}
          className={cn(
            "rounded-full px-3 py-1.5 transition-colors",
            currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
