import { describe, expect, it } from "vitest";

import { calculateAreaBasePrice } from "./calculate-area-base-price";
import {
  changeAreaProduct,
  CUSTOM_RATE_VARIANT_ID,
  getAreaProductVariants,
  getAreaProducts,
  resolveAreaProductRate,
} from "./resolve-area-product-rate";
import { roundUpToCop500 } from "./round-up-to-cop-500";

describe("area product catalog", () => {
  it("contains the four confirmed products", () => {
    expect(
      getAreaProducts().map((product) => [product.id, product.name]),
    ).toEqual([
      ["printed-vinyl", "Vinilo impreso"],
      ["cut-vinyl", "Vinilo de corte"],
      ["banner", "Banner"],
      ["panaflex", "Panaflex"],
    ]);
  });

  it("contains the documented products and rates", () => {
    expect(
      getAreaProducts().flatMap((product) =>
        product.variants.map((variant) => [
          product.id,
          variant.id,
          variant.ratePerSquareMeter,
        ]),
      ),
    ).toEqual([
      ["printed-vinyl", "standard-without-lamination", 80_000],
      ["printed-vinyl", "standard-lamination", 85_000],
      ["printed-vinyl", "floorgraphic-lamination", 95_000],
      ["cut-vinyl", "standard", 80_000],
      ["banner", "standard-without-lamination", 80_000],
      ["banner", "laminated", 85_000],
      ["panaflex", "standard-material", 85_000],
    ]);
  });

  it("returns only variants that belong to the selected product", () => {
    expect(
      Object.fromEntries(
        getAreaProducts().map((product) => [
          product.id,
          getAreaProductVariants(product.id).map((variant) => variant.id),
        ]),
      ),
    ).toEqual({
      "printed-vinyl": [
        "standard-without-lamination",
        "standard-lamination",
        "floorgraphic-lamination",
      ],
      "cut-vinyl": ["standard"],
      banner: ["standard-without-lamination", "laminated"],
      panaflex: ["standard-material"],
    });
    expect(getAreaProductVariants("unknown")).toEqual([]);
  });
});

describe("area product rate resolution", () => {
  it.each([
    ["printed-vinyl", "standard-without-lamination", 80_000],
    ["printed-vinyl", "standard-lamination", 85_000],
    ["printed-vinyl", "floorgraphic-lamination", 95_000],
    ["cut-vinyl", "standard", 80_000],
    ["banner", "standard-without-lamination", 80_000],
    ["banner", "laminated", 85_000],
    ["panaflex", "standard-material", 85_000],
  ] as const)(
    "resolves %s / %s to COP %i per square meter",
    (productId, variantId, expectedRate) => {
      expect(resolveAreaProductRate(productId, variantId)).toBe(expectedRate);
    },
  );

  it("does not resolve incomplete or incompatible selections", () => {
    expect(resolveAreaProductRate("", "")).toBeNull();
    expect(resolveAreaProductRate("cut-vinyl", "laminated")).toBeNull();
    expect(resolveAreaProductRate("unknown", "standard")).toBeNull();
  });

  it("resolves a valid explicitly selected custom rate", () => {
    expect(
      resolveAreaProductRate("banner", CUSTOM_RATE_VARIANT_ID, 72_345),
    ).toBe(72_345);
  });

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, 0, -1])(
    "rejects invalid custom rate %s",
    (rate) => {
      expect(
        resolveAreaProductRate("banner", CUSTOM_RATE_VARIANT_ID, rate),
      ).toBeNull();
    },
  );

  it("does not use a custom rate unless that option is selected", () => {
    expect(
      resolveAreaProductRate("banner", "laminated", 72_345),
    ).toBe(85_000);
  });
});

describe("area product selection changes", () => {
  it("clears the variant and custom rate when the product changes", () => {
    expect(
      changeAreaProduct(
        {
          productId: "printed-vinyl",
          variantId: "floorgraphic-lamination",
          customRate: "72345",
        },
        "cut-vinyl",
      ),
    ).toEqual({
      productId: "cut-vinyl",
      variantId: "",
      customRate: "",
    });
  });
});

describe("area calculation with a resolved rate", () => {
  it("uses the catalog rate with the existing calculation and rounding", () => {
    const rate = resolveAreaProductRate("banner", "laminated");

    expect(rate).not.toBeNull();

    const basePrice = calculateAreaBasePrice(125, 80, rate!, 2);

    expect(basePrice).toBe(170_000);
    expect(roundUpToCop500(basePrice)).toBe(170_000);
  });

  it.each([
    ["standard-material", undefined, 85_000],
    [CUSTOM_RATE_VARIANT_ID, 72_345, 72_345],
  ] as const)(
    "keeps Panaflex material-only pricing for %s",
    (variantId, customRate, expectedRate) => {
      const rate = resolveAreaProductRate("panaflex", variantId, customRate);

      expect(rate).toBe(expectedRate);
      expect(calculateAreaBasePrice(50, 50, rate!, 2)).toBe(
        expectedRate * 0.5,
      );
    },
  );
});

