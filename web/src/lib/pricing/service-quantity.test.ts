import { describe, expect, it } from "vitest";

import { parsePositiveIntegerQuantity } from "./service-quantity";

describe("parsePositiveIntegerQuantity", () => {
  it.each([
    ["0", "Quantity must be greater than zero."],
    ["-2", "Quantity must be greater than zero."],
    ["1.5", "Quantity must be an integer."],
    ["", "Quantity is required."],
    ["   ", "Quantity is required."],
    ["not-a-number", "Quantity must be a valid number."],
  ])("rejects invalid quantity %j", (value, message) => {
    expect(() => parsePositiveIntegerQuantity(value)).toThrowError(message);
  });

  it.each([
    ["1", 1],
    ["2", 2],
    [" 15 ", 15],
  ])("accepts positive integer %j", (value, expected) => {
    expect(parsePositiveIntegerQuantity(value)).toBe(expected);
  });
});
