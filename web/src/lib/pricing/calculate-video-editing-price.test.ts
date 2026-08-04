import { describe, expect, it } from "vitest";

import { calculateVideoEditingPrice } from "./calculate-video-editing-price";
import type { ParsedVideoDuration } from "./video-duration";

function duration(
  enteredMinutes: number,
  enteredSeconds: number,
): ParsedVideoDuration {
  return {
    enteredMinutes,
    enteredSeconds,
    totalSeconds: enteredMinutes * 60 + enteredSeconds,
  };
}

describe("calculateVideoEditingPrice", () => {
  it.each([
    [0, 20, 1, 0, 50_000],
    [1, 0, 1, 0, 50_000],
    [1, 1, 2, 1, 80_000],
    [2, 0, 2, 1, 80_000],
    [2, 1, 3, 2, 110_000],
    [3, 35, 4, 3, 140_000],
  ] as const)(
    "calculates %i:%i with upward billable minutes",
    (
      enteredMinutes,
      enteredSeconds,
      billableMinutes,
      additionalBillableMinutes,
      totalPrice,
    ) => {
      expect(
        calculateVideoEditingPrice(duration(enteredMinutes, enteredSeconds)),
      ).toEqual({
        enteredMinutes,
        enteredSeconds,
        totalSeconds: enteredMinutes * 60 + enteredSeconds,
        billableMinutes,
        additionalBillableMinutes,
        basePrice: 50_000,
        additionalSubtotal: additionalBillableMinutes * 30_000,
        totalPrice,
      });
    },
  );

  it.each([
    [1, 1, 2],
    [2, 1, 3],
    [3, 59, 4],
  ] as const)(
    "rounds every started minute upward for %i:%i",
    (minutes, seconds, expectedBillableMinutes) => {
      expect(
        calculateVideoEditingPrice(duration(minutes, seconds)).billableMinutes,
      ).toBe(expectedBillableMinutes);
    },
  );

  it("keeps one billable minute as the commercial minimum", () => {
    expect(calculateVideoEditingPrice(duration(0, 0))).toMatchObject({
      billableMinutes: 1,
      totalPrice: 50_000,
    });
  });
});
