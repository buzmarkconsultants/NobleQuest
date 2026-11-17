import { describe, expect, it } from "vitest";
import { normalizeMpesaPhone } from "@/lib/mpesa.server";

describe("M-Pesa phone normalization", () => {
  it.each([
    ["0712345678", "254712345678"],
    ["+254 712 345 678", "254712345678"],
    ["0112345678", "254112345678"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeMpesaPhone(input)).toBe(expected);
  });

  it("rejects numbers outside Kenyan mobile formats", () => {
    expect(() => normalizeMpesaPhone("12345")).toThrow("valid Kenyan Safaricom number");
    expect(() => normalizeMpesaPhone("254201234567")).toThrow("valid Kenyan Safaricom number");
  });
});
