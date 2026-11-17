import { describe, expect, it } from "vitest";
import type { TripType } from "@/data/tours";
import { destinationsForTours } from "@/lib/listing";

describe("destination search options", () => {
  it("only offers destinations with trips of the selected type", () => {
    const tours: { type: TripType; destination: string }[] = [
      { type: "safari", destination: "maasai-mara" },
      { type: "day-trip", destination: "nairobi" },
      { type: "beach", destination: "diani" },
    ];

    expect(destinationsForTours(tours, "day-trip").map((destination) => destination.slug)).toEqual([
      "nairobi",
    ]);
    expect(destinationsForTours(tours, "beach").map((destination) => destination.slug)).toEqual([
      "diani",
    ]);
  });
});
