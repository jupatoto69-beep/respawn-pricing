import { describe, expect, it } from "vitest";

import {
  calculateIlluminatedPanaflexSignPrice,
  PANAFLEX_MEASURE_CLASSIFICATIONS,
} from "./calculate-illuminated-panaflex-sign-price";
import { PANAFLEX_PRICING_OPTION_IDS } from "./panaflex-pricing-options";

const { illuminatedSingleFace, illuminatedDoubleFace } =
  PANAFLEX_PRICING_OPTION_IDS;

describe("calculateIlluminatedPanaflexSignPrice", () => {
  it("applies the small-measure multiplier to a 50 x 50 cm one-face sign", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      50,
      50,
      1,
      illuminatedSingleFace,
    );

    expect(calculation).toEqual({
      areaCm2: 2_500,
      measureClassification: PANAFLEX_MEASURE_CLASSIFICATIONS.small,
      isSmallMeasure: true,
      structureRate: 45,
      smallMeasureMultiplier: 2,
      oneFaceComponent: 112_500,
      doubleFaceAdditionalComponent: 0,
      normalPriceBeforeSmallMeasureAdjustment: 112_500,
      priceAfterSmallMeasureAdjustment: 225_000,
      priceBeforeCommercialRounding: 225_000,
      commercialRoundedPrice: 225_000,
    });
  });

  it("applies the multiplier to the complete 50 x 50 cm double-face price", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      50,
      50,
      1,
      illuminatedDoubleFace,
    );

    expect(calculation).toEqual({
      areaCm2: 2_500,
      measureClassification: PANAFLEX_MEASURE_CLASSIFICATIONS.small,
      isSmallMeasure: true,
      structureRate: 45,
      smallMeasureMultiplier: 2,
      oneFaceComponent: 112_500,
      doubleFaceAdditionalComponent: 21_250,
      normalPriceBeforeSmallMeasureAdjustment: 133_750,
      priceAfterSmallMeasureAdjustment: 267_500,
      priceBeforeCommercialRounding: 267_500,
      commercialRoundedPrice: 267_500,
    });
  });

  it.each([
    [99, 101, 9_999, PANAFLEX_MEASURE_CLASSIFICATIONS.small, true, 45, 2],
    [
      100,
      100,
      10_000,
      PANAFLEX_MEASURE_CLASSIFICATIONS.standard,
      false,
      34,
      1,
    ],
    [
      101,
      100,
      10_100,
      PANAFLEX_MEASURE_CLASSIFICATIONS.standard,
      false,
      34,
      1,
    ],
  ] as const)(
    "classifies %s x %s cm at the 10,000 cm² boundary",
    (
      lengthCm,
      widthCm,
      areaCm2,
      measureClassification,
      isSmallMeasure,
      structureRate,
      smallMeasureMultiplier,
    ) => {
      const calculation = calculateIlluminatedPanaflexSignPrice(
        lengthCm,
        widthCm,
        1,
        illuminatedSingleFace,
      );

      expect(calculation).toMatchObject({
        areaCm2,
        measureClassification,
        isSmallMeasure,
        structureRate,
        smallMeasureMultiplier,
      });
    },
  );

  it("keeps the standard 100 x 100 cm one-face calculation unchanged", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      100,
      100,
      1,
      illuminatedSingleFace,
    );

    expect(calculation).toMatchObject({
      oneFaceComponent: 340_000,
      doubleFaceAdditionalComponent: 0,
      normalPriceBeforeSmallMeasureAdjustment: 340_000,
      priceAfterSmallMeasureAdjustment: 340_000,
      priceBeforeCommercialRounding: 340_000,
      commercialRoundedPrice: 340_000,
    });
  });

  it("keeps the standard 100 x 100 cm double-face calculation unchanged", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      100,
      100,
      1,
      illuminatedDoubleFace,
    );

    expect(calculation).toMatchObject({
      oneFaceComponent: 340_000,
      doubleFaceAdditionalComponent: 85_000,
      normalPriceBeforeSmallMeasureAdjustment: 425_000,
      smallMeasureMultiplier: 1,
      priceAfterSmallMeasureAdjustment: 425_000,
      commercialRoundedPrice: 425_000,
    });
  });

  it.each([
    [illuminatedSingleFace, 225_000, 450_000],
    [illuminatedDoubleFace, 267_500, 535_000],
  ] as const)(
    "includes quantity before the small-measure multiplier for %s",
    (
      optionId,
      normalPriceBeforeSmallMeasureAdjustment,
      priceAfterSmallMeasureAdjustment,
    ) => {
      const calculation = calculateIlluminatedPanaflexSignPrice(
        50,
        50,
        2,
        optionId,
      );

      expect(calculation).toMatchObject({
        normalPriceBeforeSmallMeasureAdjustment,
        smallMeasureMultiplier: 2,
        priceAfterSmallMeasureAdjustment,
        commercialRoundedPrice: priceAfterSmallMeasureAdjustment,
      });
    },
  );

  it("preserves quantity behavior for standard measures", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      100,
      100,
      2,
      illuminatedDoubleFace,
    );

    expect(calculation).toMatchObject({
      normalPriceBeforeSmallMeasureAdjustment: 850_000,
      smallMeasureMultiplier: 1,
      priceAfterSmallMeasureAdjustment: 850_000,
      commercialRoundedPrice: 850_000,
    });
  });

  it("multiplies the normal price before commercial rounding", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      51,
      51,
      1,
      illuminatedSingleFace,
    );

    expect(calculation.normalPriceBeforeSmallMeasureAdjustment).toBe(117_045);
    expect(calculation.priceAfterSmallMeasureAdjustment).toBe(234_090);
    expect(calculation.priceBeforeCommercialRounding).toBe(234_090);
    expect(calculation.commercialRoundedPrice).toBe(234_500);
    expect(calculation.commercialRoundedPrice).not.toBe(235_000);
  });

  it.each([
    [0, 50, 1, "Length must be greater than zero."],
    [50, 0, 1, "Width must be greater than zero."],
    [50, 50, 0, "Quantity must be greater than zero."],
    [50, 50, 1.5, "Quantity must be an integer."],
  ] as const)(
    "rejects invalid required values %s x %s with quantity %s",
    (lengthCm, widthCm, quantity, message) => {
      expect(() =>
        calculateIlluminatedPanaflexSignPrice(
          lengthCm,
          widthCm,
          quantity,
          illuminatedSingleFace,
        ),
      ).toThrowError(message);
    },
  );
});
