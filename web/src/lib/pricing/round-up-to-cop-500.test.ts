import { describe, expect, it } from "vitest";

import { roundUpToCop500 } from "./round-up-to-cop-500";

describe("roundUpToCop500", () => {
  describe("valid amounts", () => {
    it.each([
      [0, 0],
      [25_000, 25_000],
      [25_001, 25_500],
      [25_499, 25_500],
      [25_500, 25_500],
      [25_501, 26_000],
    ])("rounds %i up to %i", (amount, expected) => {
      expect(roundUpToCop500(amount)).toBe(expected);
    });
  });

  describe("negative amounts", () => {
    it.each([-1, -500])("rejects %i", (amount) => {
      expect(() => roundUpToCop500(amount)).toThrow(RangeError);
    });
  });

  describe("non-finite amounts", () => {
    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      "rejects %s",
      (amount) => {
        expect(() => roundUpToCop500(amount)).toThrow(RangeError);
      },
    );
  });
});
