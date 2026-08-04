import { describe, expect, it } from "vitest";

import { parseOptionalNegotiatedCopUnitPrice } from "./negotiated-cop-price";

describe("parseOptionalNegotiatedCopUnitPrice", () => {
  it.each(["", "   "])(
    "interprets an empty optional value %j as no negotiated price",
    (value) => {
      expect(parseOptionalNegotiatedCopUnitPrice(value)).toBeNull();
    },
  );

  it.each([
    ["0", "Negotiated unit price must be greater than zero."],
    ["-1", "Negotiated unit price must be greater than zero."],
    ["80000.5", "Negotiated unit price must be an integer."],
    ["80000.0", "Negotiated unit price must be an integer."],
    ["not-a-number", "Negotiated unit price must be a valid number."],
  ])("rejects invalid negotiated price %j", (value, message) => {
    expect(() => parseOptionalNegotiatedCopUnitPrice(value)).toThrowError(
      message,
    );
  });

  it.each([
    ["1", 1],
    ["75000", 75_000],
    [" 117000 ", 117_000],
  ])("accepts positive whole-number COP value %j", (value, expected) => {
    expect(parseOptionalNegotiatedCopUnitPrice(value)).toBe(expected);
  });
});
