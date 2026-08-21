import { describe, expect, it } from "vitest";

import {
  CUT_VINYL_PRODUCT_ID,
  CUT_VINYL_STANDARD_RATE_PER_M2,
} from "./area-product-catalog";
import { calculateAreaBasePrice } from "./calculate-area-base-price";
import {
  allocateCutVinylColorGroupLineTotals,
  calculateCutVinylColorGroupPrice,
  createCutVinylColorGroupPricing,
  CUT_VINYL_COLOR_GROUP_MINIMUM_COP,
  normalizeCutVinylColor,
  type CutVinylColorGroupPricing,
} from "./cut-vinyl-color-group";

function createItem(lineId: string, color: string, subtotal: number) {
  return {
    lineId,
    pricing: createCutVinylColorGroupPricing(
      CUT_VINYL_PRODUCT_ID,
      color,
      subtotal,
    ) as CutVinylColorGroupPricing,
  };
}

function totalAllocations(
  items: readonly ReturnType<typeof createItem>[],
): number {
  return allocateCutVinylColorGroupLineTotals(items).reduce(
    (total, allocation) => total + allocation.lineTotal,
    0,
  );
}

describe("Cut vinyl color-group pricing", () => {
  it("keeps the confirmed COP 15,000 minimum", () => {
    expect(CUT_VINYL_COLOR_GROUP_MINIMUM_COP).toBe(15_000);
    expect(calculateCutVinylColorGroupPrice([4_000])).toEqual({
      subtotalBeforeMinimumAndRounding: 4_000,
      protectedSubtotal: 15_000,
      roundedTotal: 15_000,
    });
  });

  it("uses the confirmed COP 80,000/m² area subtotal before the minimum", () => {
    const subtotal = calculateAreaBasePrice(
      25,
      20,
      CUT_VINYL_STANDARD_RATE_PER_M2,
      1,
    );

    expect(CUT_VINYL_STANDARD_RATE_PER_M2).toBe(80_000);
    expect(subtotal).toBe(4_000);
    expect(calculateCutVinylColorGroupPrice([subtotal]).roundedTotal).toBe(
      15_000,
    );
  });

  it("groups same-color pieces before evaluating the minimum", () => {
    const items = [
      createItem("a", "Rojo", 4_000),
      createItem("b", "Rojo", 6_000),
      createItem("c", "Rojo", 6_000),
    ];

    expect(totalAllocations(items)).toBe(16_000);
    expect(
      allocateCutVinylColorGroupLineTotals(items).map(
        (allocation) => allocation.lineTotal,
      ),
    ).toEqual([4_000, 6_000, 6_000]);
  });

  it("applies the minimum once when the same-color subtotal stays below it", () => {
    const items = [
      createItem("a", "Rojo", 4_000),
      createItem("b", "Rojo", 6_000),
      createItem("c", "Rojo", 3_000),
    ];
    const allocations = allocateCutVinylColorGroupLineTotals(items);

    expect(allocations).toEqual([
      { lineId: "a", lineTotal: 4_615 },
      { lineId: "b", lineTotal: 6_923 },
      { lineId: "c", lineTotal: 3_462 },
    ]);
    expect(
      allocations.some((allocation) => allocation.lineTotal % 500 !== 0),
    ).toBe(true);
    expect(totalAllocations(items)).toBe(15_000);
  });

  it("evaluates different colors as independent minimum groups", () => {
    const allocations = allocateCutVinylColorGroupLineTotals([
      createItem("red", "Rojo", 10_000),
      createItem("blue", "Azul", 8_000),
    ]);

    expect(allocations).toEqual([
      { lineId: "red", lineTotal: 15_000 },
      { lineId: "blue", lineTotal: 15_000 },
    ]);
    expect(
      allocations.reduce(
        (total, allocation) => total + allocation.lineTotal,
        0,
      ),
    ).toBe(30_000);
  });

  it("does not reduce a group already above the minimum", () => {
    expect(calculateCutVinylColorGroupPrice([20_000])).toEqual({
      subtotalBeforeMinimumAndRounding: 20_000,
      protectedSubtotal: 20_000,
      roundedTotal: 20_000,
    });
  });

  it("rounds upward only after combining the complete group", () => {
    const calculation = calculateCutVinylColorGroupPrice([7_501, 7_501]);

    expect(calculation).toEqual({
      subtotalBeforeMinimumAndRounding: 15_002,
      protectedSubtotal: 15_002,
      roundedTotal: 15_500,
    });
    expect(
      totalAllocations([
        createItem("a", "Rojo", 7_501),
        createItem("b", "Rojo", 7_501),
      ]),
    ).toBe(15_500);
  });

  it("normalizes accidental whitespace and casing without removing accents", () => {
    expect(normalizeCutVinylColor("  RoJO   claro  ")).toEqual({
      displayValue: "RoJO claro",
      comparisonKey: "rojo claro",
    });
    expect(
      createCutVinylColorGroupPricing(
        CUT_VINYL_PRODUCT_ID,
        " ROJO ",
        4_000,
      )?.groupKey,
    ).toBe(
      createCutVinylColorGroupPricing(
        CUT_VINYL_PRODUCT_ID,
        "rojo",
        6_000,
      )?.groupKey,
    );
    expect(normalizeCutVinylColor("Rojo").comparisonKey).not.toBe(
      normalizeCutVinylColor("Rójo").comparisonKey,
    );
  });

  it("does not create this pricing rule for other area products", () => {
    expect(
      createCutVinylColorGroupPricing("printed-vinyl", "Rojo", 4_000),
    ).toBeNull();
    expect(
      createCutVinylColorGroupPricing("banner", "Rojo", 4_000),
    ).toBeNull();
    expect(
      createCutVinylColorGroupPricing("panaflex", "Rojo", 4_000),
    ).toBeNull();
  });

  it("rejects an empty color and invalid commercial subtotals", () => {
    expect(() => normalizeCutVinylColor(" \t ")).toThrowError(
      "Cut vinyl color is required.",
    );
    expect(() => calculateCutVinylColorGroupPrice([])).toThrowError(
      "must contain at least one item",
    );
    expect(() => calculateCutVinylColorGroupPrice([Number.NaN])).toThrowError(
      "must be finite",
    );
    expect(() => calculateCutVinylColorGroupPrice([-1])).toThrowError(
      "must not be negative",
    );
  });
});
