import { describe, expect, it } from "vitest";

import { roundUpSecuritySystemTotal } from "./round-up-security-system-total";

describe("roundUpSecuritySystemTotal", () => {
  it.each([
    [0, 0],
    [100_000, 100_000],
    [100_001, 101_000],
    [100_500, 101_000],
    [100_999, 101_000],
    [101_000, 101_000],
  ])("rounds %s upward to %s", (amount, expected) => {
    expect(roundUpSecuritySystemTotal(amount)).toBe(expected);
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    "100000" as unknown as number,
  ])("rejects invalid runtime amount %s", (amount) => {
    expect(() => roundUpSecuritySystemTotal(amount)).toThrow(RangeError);
  });

  it("rejects negative totals", () => {
    expect(() => roundUpSecuritySystemTotal(-1)).toThrow(
      "Security system total must not be negative.",
    );
  });

  it("rejects totals whose rounded result is not a safe integer", () => {
    expect(() => roundUpSecuritySystemTotal(Number.MAX_SAFE_INTEGER)).toThrow(
      "Security system total must round to a safe integer.",
    );
  });
});
