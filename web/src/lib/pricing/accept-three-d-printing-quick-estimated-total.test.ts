import { describe, expect, it } from "vitest";

import { acceptThreeDPrintingQuickEstimatedTotal } from "./accept-three-d-printing-quick-estimated-total";

describe("manual 3D quick estimated total", () => {
  it.each(["", "   "])("rejects a blank total", (value) => {
    expect(() => acceptThreeDPrintingQuickEstimatedTotal(value)).toThrow(
      "required",
    );
  });

  it.each(["not-a-number", "Infinity", "-Infinity"])(
    "rejects the non-finite or invalid value %s",
    (value) => {
      expect(() => acceptThreeDPrintingQuickEstimatedTotal(value)).toThrow(
        "finite number",
      );
    },
  );

  it.each(["0", "-1"])("rejects the non-positive value %s", (value) => {
    expect(() => acceptThreeDPrintingQuickEstimatedTotal(value)).toThrow(
      "positive",
    );
  });

  it("blocks a total below the COP 5,000 absolute floor", () => {
    expect(() => acceptThreeDPrintingQuickEstimatedTotal("4999")).toThrow(
      "at least COP 5,000",
    );
  });

  it.each([
    ["5000", 5_000],
    ["5020", 5_500],
    ["80000", 80_000],
    ["80250", 80_500],
  ])("accepts and rounds %s upward to COP %i", (value, expected) => {
    expect(acceptThreeDPrintingQuickEstimatedTotal(value)).toBe(expected);
  });
});
