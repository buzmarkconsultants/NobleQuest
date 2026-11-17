/** Pricing rules — pure functions so they can be tested. */
export type Currency = "USD" | "KES";

/** Placeholder exchange rate: 1 USD = KES_PER_USD. Update as needed. */
export const KES_PER_USD = 129;

/** Safaris, beach holidays and corporate trips can be secured with a deposit of this share of the total. Day trips are paid in full. */
export const SAFARI_DEPOSIT_RATE = 0.3;

/** Every trip type except day trips can be secured with a deposit. */
export function allowsDeposit(type: string) {
  return type !== "day-trip";
}

export function toKES(usd: number) {
  // Round to the nearest KES 100 for clean local pricing
  return Math.round((usd * KES_PER_USD) / 100) * 100;
}

export function convert(usd: number, currency: Currency) {
  return currency === "USD" ? usd : toKES(usd);
}

export function formatMoney(amount: number, currency: Currency) {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `KES ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatPrice(usd: number, currency: Currency) {
  return formatMoney(convert(usd, currency), currency);
}

export function tripTotalUSD(pricePerPersonUSD: number, travelers: number) {
  return pricePerPersonUSD * Math.max(1, Math.floor(travelers));
}

export function depositUSD(totalUSD: number, type: string) {
  if (!allowsDeposit(type)) return totalUSD;
  return Math.round(totalUSD * SAFARI_DEPOSIT_RATE);
}
