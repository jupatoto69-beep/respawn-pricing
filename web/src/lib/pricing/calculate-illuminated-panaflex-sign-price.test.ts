import { describe, expect, it } from "vitest";

import { calculateIlluminatedPanaflexSignPrice } from "./calculate-illuminated-panaflex-sign-price";
import { PANAFLEX_PRICING_OPTION_IDS } from "./panaflex-pricing-options";
import { roundUpToCop500 } from "./round-up-to-cop-500";

const { illuminatedSingleFace, illuminatedDoubleFace } =
  PANAFLEX_PRICING_OPTION_IDS;

describe("calculateIlluminatedPanaflexSignPrice", () => {
  it("uses COP 45/cm² below 10,000 cm²", () => {
    expect(
      calculateIlluminatedPanaflexSignPrice(
        50,
        50,
        1,
        illuminatedSingleFace,
      ),
    ).toBe(112_500);
  });

  it("uses COP 34/cm² at exactly 10,000 cm²", () => {
    expect(
      calculateIlluminatedPanaflexSignPrice(
        100,
        100,
        1,
        illuminatedSingleFace,
      ),
    ).toBe(340_000);
  });

  it("uses COP 34/cm² above 10,000 cm²", () => {
    expect(
      calculateIlluminatedPanaflexSignPrice(
        101,
        100,
        1,
        illuminatedSingleFace,
      ),
    ).toBe(343_400);
  });

  it("adds COP 8.5/cm² for the additional face", () => {
    expect(
      calculateIlluminatedPanaflexSignPrice(
        50,
        50,
        1,
        illuminatedDoubleFace,
      ),
    ).toBe(133_750);
  });

  it("applies quantity after calculating the complete unit sign", () => {
    expect(
      calculateIlluminatedPanaflexSignPrice(
        50,
        50,
        3,
        illuminatedDoubleFace,
      ),
    ).toBe(401_250);
  });

  it("leaves rounding until after the complete price and quantity", () => {
    const priceBeforeRounding = calculateIlluminatedPanaflexSignPrice(
      51,
      51,
      2,
      illuminatedDoubleFace,
    );

    expect(priceBeforeRounding).toBe(278_307);
    expect(roundUpToCop500(priceBeforeRounding)).toBe(278_500);
  });

  it.each([
    [50, 50, illuminatedSingleFace, 112_500, 112_500],
    [50, 50, illuminatedDoubleFace, 133_750, 134_000],
    [100, 100, illuminatedSingleFace, 340_000, 340_000],
  ] as const)(
    "matches the required %s x %s cm example for %s",
    (lengthCm, widthCm, optionId, expectedBeforeRounding, expectedRounded) => {
      const priceBeforeRounding = calculateIlluminatedPanaflexSignPrice(
        lengthCm,
        widthCm,
        1,
        optionId,
      );

      expect(priceBeforeRounding).toBe(expectedBeforeRounding);
      expect(roundUpToCop500(priceBeforeRounding)).toBe(expectedRounded);
    },
  );

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
