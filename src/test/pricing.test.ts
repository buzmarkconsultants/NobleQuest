import { describe, expect, it } from "vitest";
import { depositUSD, formatPrice, toKES, tripTotalUSD } from "@/lib/pricing";

describe("pricing rules", () => {
  it("converts USD to KES at 129 and rounds to the nearest KES 100", () => {
    expect(toKES(95)).toBe(12300); // 95 * 129 = 12,255
    expect(formatPrice(650, "KES")).toBe("KES 83,900");
  });

  it("charges price per person times number of travelers", () => {
    expect(tripTotalUSD(650, 3)).toBe(1950);
  });

  it("lets safaris be secured with a 30% deposit", () => {
    expect(depositUSD(1950, "safari")).toBe(585);
  });

  it("lets beach holidays and corporate trips be secured with a 30% deposit", () => {
    expect(depositUSD(1080, "beach")).toBe(324);
    expect(depositUSD(950, "corporate")).toBe(285);
  });

  it("requires day trips to be paid in full", () => {
    expect(depositUSD(285, "day-trip")).toBe(285);
  });
});
