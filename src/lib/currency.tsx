import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { formatPrice, type Currency } from "./pricing";

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (usd: number) => string;
}

const Ctx = createContext<CurrencyCtx | null>(null);
const STORAGE_KEY = "nq-currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "USD" || saved === "KES") setCurrencyState(saved);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    window.localStorage.setItem(STORAGE_KEY, c);
  };

  return (
    <Ctx.Provider value={{ currency, setCurrency, format: (usd) => formatPrice(usd, currency) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
