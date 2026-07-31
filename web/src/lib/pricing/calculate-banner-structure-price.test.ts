import { describe, expect, it } from "vitest";

import {
  BANNER_LAMINATED_VARIANT_ID,
  BANNER_STANDARD_VARIANT_ID,
} from "./area-product-catalog";
import {
  BANNER_STRUCTURE_OPTION_IDS,
  type BannerStructureOptionId,
} from "./banner-structure-options";
import {
  applyBannerStructurePrice,
  calculateBannerStructurePrice,
} from "./calculate-banner-structure-price";
import { calculateAreaBasePrice } from "./calculate-area-base-price";
import {
  CUSTOM_RATE_VARIANT_ID,
  resolveAreaProductRate,
} from "./resolve-area-product-rate";
import { roundUpToCop500 } from "./round-up-to-cop-500";

describe("calculateBannerStructurePrice", () => {
  it.each([
    [
      BANNER_STANDARD_VARIANT_ID,
      BANNER_STRUCTURE_OPTION_IDS.materialOnly,
      80_000,
    ],
    [
      BANNER_LAMINATED_VARIANT_ID,
      BANNER_STRUCTURE_OPTION_IDS.materialOnly,
      85_000,
    ],
    [
      BANNER_STANDARD_VARIANT_ID,
      BANNER_STRUCTURE_OPTION_IDS.singleFace,
      320_000,
    ],
    [
      BANNER_LAMINATED_VARIANT_ID,
      BANNER_STRUCTURE_OPTION_IDS.singleFace,
      325_000,
    ],
    [
      BANNER_STANDARD_VARIANT_ID,
      BANNER_STRUCTURE_OPTION_IDS.doubleFace,
      400_000,
    ],
    [
      BANNER_LAMINATED_VARIANT_ID,
      BANNER_STRUCTURE_OPTION_IDS.doubleFace,
      410_000,
    ],
  ] satisfies readonly [string, BannerStructureOptionId, number][])(
    "calculates 1 m² of %s with %s",
    (variantId, optionId, expected) => {
      const selectedRate = resolveAreaProductRate("banner", variantId);
      expect(selectedRate).not.toBeNull();
      expect(
        calculateBannerStructurePrice(1, variantId, selectedRate!, optionId),
      ).toBe(expected);
    },
  );

  it("rounds only after applying the structure formula", () => {
    const structuredPrice = calculateBannerStructurePrice(
      0.12345,
      BANNER_LAMINATED_VARIANT_ID,
      85_000,
      BANNER_STRUCTURE_OPTION_IDS.singleFace,
    );

    expect(structuredPrice).toBe(40_121.25);
    expect(roundUpToCop500(structuredPrice)).toBe(40_500);
  });

  it("keeps the exact commercial multiple for an 80 x 300 cm single-face Banner", () => {
    const areaM2 = calculateAreaBasePrice(80, 300, 1, 1);
    const structuredPrice = calculateBannerStructurePrice(
      areaM2,
      BANNER_STANDARD_VARIANT_ID,
      80_000,
      BANNER_STRUCTURE_OPTION_IDS.singleFace,
    );

    expect(areaM2).toBe(2.4);
    expect(structuredPrice).toBe(768_000);
    expect(roundUpToCop500(structuredPrice)).toBe(768_000);
  });

  it.each([
    [BANNER_STRUCTURE_OPTION_IDS.materialOnly, 18_086.25, 18_500],
    [BANNER_STRUCTURE_OPTION_IDS.singleFace, 72_345, 72_500],
    [BANNER_STRUCTURE_OPTION_IDS.doubleFace, 90_431.25, 90_500],
  ] satisfies readonly [BannerStructureOptionId, number, number][])(
    "combines a custom banner rate with %s",
    (optionId, expectedBeforeRounding, expectedRounded) => {
      const customRate = resolveAreaProductRate(
        "banner",
        CUSTOM_RATE_VARIANT_ID,
        72_345,
      );
      expect(customRate).not.toBeNull();

      const structuredPrice = calculateBannerStructurePrice(
        0.25,
        CUSTOM_RATE_VARIANT_ID,
        customRate!,
        optionId,
      );

      expect(structuredPrice).toBe(expectedBeforeRounding);
      expect(roundUpToCop500(structuredPrice)).toBe(expectedRounded);
    },
  );

  it("does not affect products other than Banner", () => {
    expect(
      applyBannerStructurePrice(
        "printed-vinyl",
        "standard-lamination",
        1,
        12_345,
        85_000,
        BANNER_STRUCTURE_OPTION_IDS.doubleFace,
      ),
    ).toBe(12_345);
  });
});
