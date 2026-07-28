import { describe, expect, it } from "vitest";

import { calculateAreaBasePrice } from "./calculate-area-base-price";

function expectRangeError(action: () => number, message: string): void {
  expect(action).toThrowError(RangeError);
  expect(action).toThrowError(message);
}

describe("calculateAreaBasePrice", () => {
  describe("valid inputs", () => {
    it.each([
      [100, 100, 20_000, 1, 20_000],
      [200, 50, 20_000, 1, 20_000],
      [50, 50, 20_000, 4, 20_000],
    ])(
      "calculates %s x %s cm at %s for quantity %s",
      (lengthCm, widthCm, ratePerSquareMeter, quantity, expected) => {
        expect(
          calculateAreaBasePrice(
            lengthCm,
            widthCm,
            ratePerSquareMeter,
            quantity,
          ),
        ).toBe(expected);
      },
    );

    it("accepts decimal dimensions and does not round the base price", () => {
      expect(calculateAreaBasePrice(12.5, 20, 12_345, 1)).toBeCloseTo(
        308.625,
      );
    });

    it("returns zero when the square-meter rate is zero", () => {
      expect(calculateAreaBasePrice(123.4, 56.7, 0, 10)).toBe(0);
    });
  });

  describe("invalid length", () => {
    it.each([
      [0, "Length must be greater than zero."],
      [-1, "Length must be greater than zero."],
      [Number.NaN, "Length must be finite."],
      [Number.POSITIVE_INFINITY, "Length must be finite."],
      [Number.NEGATIVE_INFINITY, "Length must be finite."],
    ])("rejects %s", (lengthCm, message) => {
      expectRangeError(
        () => calculateAreaBasePrice(lengthCm, 100, 20_000, 1),
        message,
      );
    });
  });

  describe("invalid width", () => {
    it.each([
      [0, "Width must be greater than zero."],
      [-1, "Width must be greater than zero."],
      [Number.NaN, "Width must be finite."],
      [Number.POSITIVE_INFINITY, "Width must be finite."],
      [Number.NEGATIVE_INFINITY, "Width must be finite."],
    ])("rejects %s", (widthCm, message) => {
      expectRangeError(
        () => calculateAreaBasePrice(100, widthCm, 20_000, 1),
        message,
      );
    });
  });

  describe("invalid square-meter rate", () => {
    it.each([
      [-1, "Rate per square meter must not be negative."],
      [Number.NaN, "Rate per square meter must be finite."],
      [Number.POSITIVE_INFINITY, "Rate per square meter must be finite."],
      [Number.NEGATIVE_INFINITY, "Rate per square meter must be finite."],
    ])("rejects %s", (ratePerSquareMeter, message) => {
      expectRangeError(
        () => calculateAreaBasePrice(100, 100, ratePerSquareMeter, 1),
        message,
      );
    });
  });

  describe("invalid quantity", () => {
    it.each([
      [0, "Quantity must be greater than zero."],
      [-1, "Quantity must be greater than zero."],
      [1.5, "Quantity must be an integer."],
      [Number.NaN, "Quantity must be finite."],
      [Number.POSITIVE_INFINITY, "Quantity must be finite."],
      [Number.NEGATIVE_INFINITY, "Quantity must be finite."],
    ])("rejects %s", (quantity, message) => {
      expectRangeError(
        () => calculateAreaBasePrice(100, 100, 20_000, quantity),
        message,
      );
    });
  });
});
