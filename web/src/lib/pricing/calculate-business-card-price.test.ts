import { describe, expect, it } from "vitest";

import { BUSINESS_CARD_TYPE_IDS } from "./business-card-pricing";
import {
  BUSINESS_CARD_CONFIRMATION_REQUIRED_ERROR,
  calculateBusinessCardPrice,
  resolveBusinessCardPricingDecision,
} from "./calculate-business-card-price";

const { glossy, matteUv } = BUSINESS_CARD_TYPE_IDS;

describe("calculateBusinessCardPrice automatic pricing", () => {
  it.each([
    [glossy, 1, 85_000, 80_000, 85_000],
    [glossy, 2, 85_000, 80_000, 170_000],
    [glossy, 3, 75_000, 75_000, 225_000],
    [glossy, 4, 75_000, 75_000, 300_000],
    [matteUv, 1, 120_000, 115_000, 120_000],
    [matteUv, 2, 120_000, 115_000, 240_000],
    [matteUv, 3, 100_000, 100_000, 300_000],
    [matteUv, 4, 100_000, 100_000, 400_000],
  ] as const)(
    "calculates %s quantity %i without commercial rounding",
    (
      cardType,
      quantityInThousands,
      automaticUnitPrice,
      applicableAuthorizedMinimum,
      totalPrice,
    ) => {
      expect(
        calculateBusinessCardPrice({
          cardType,
          quantityInThousands,
          negotiatedUnitPrice: null,
          belowMinimumConfirmed: false,
        }),
      ).toMatchObject({
        cardType,
        quantityInThousands,
        equivalentCardQuantity: quantityInThousands * 1_000,
        automaticUnitPrice,
        applicableAuthorizedMinimum,
        negotiatedUnitPrice: null,
        priceSource: "automatic",
        resolvedUnitPrice: automaticUnitPrice,
        isBelowAuthorizedMinimum: false,
        requiresConfirmation: false,
        confirmationStatus: "not-required",
        totalPrice,
      });
    },
  );
});

describe("business-card negotiated pricing", () => {
  it.each([
    [glossy, 2, 82_000, 80_000, false, 164_000],
    [glossy, 2, 80_000, 80_000, false, 160_000],
    [glossy, 2, 75_000, 80_000, true, 150_000],
    [glossy, 3, 75_000, 75_000, false, 225_000],
    [glossy, 3, 70_000, 75_000, true, 210_000],
    [matteUv, 2, 117_000, 115_000, false, 234_000],
    [matteUv, 2, 110_000, 115_000, true, 220_000],
    [matteUv, 3, 100_000, 100_000, false, 300_000],
    [matteUv, 3, 95_000, 100_000, true, 285_000],
  ] as const)(
    "resolves %s quantity %i negotiated at COP %i",
    (
      cardType,
      quantityInThousands,
      negotiatedUnitPrice,
      minimum,
      isBelowAuthorizedMinimum,
      totalPrice,
    ) => {
      const decision = resolveBusinessCardPricingDecision(
        cardType,
        quantityInThousands,
        negotiatedUnitPrice,
      );

      expect(decision).toMatchObject({
        negotiatedUnitPrice,
        priceSource: "negotiated",
        resolvedUnitPrice: negotiatedUnitPrice,
        applicableAuthorizedMinimum: minimum,
        isBelowAuthorizedMinimum,
        requiresConfirmation: isBelowAuthorizedMinimum,
      });

      if (isBelowAuthorizedMinimum) {
        expect(() =>
          calculateBusinessCardPrice({
            cardType,
            quantityInThousands,
            negotiatedUnitPrice,
            belowMinimumConfirmed: false,
          }),
        ).toThrowError(BUSINESS_CARD_CONFIRMATION_REQUIRED_ERROR);
      }

      expect(
        calculateBusinessCardPrice({
          cardType,
          quantityInThousands,
          negotiatedUnitPrice,
          belowMinimumConfirmed: isBelowAuthorizedMinimum,
        }),
      ).toMatchObject({
        confirmationStatus: isBelowAuthorizedMinimum
          ? "confirmed"
          : "not-required",
        totalPrice,
      });
    },
  );

  it("does not produce a valid below-minimum result without confirmation", () => {
    expect(() =>
      calculateBusinessCardPrice({
        cardType: glossy,
        quantityInThousands: 2,
        negotiatedUnitPrice: 75_000,
        belowMinimumConfirmed: false,
      }),
    ).toThrowError(BUSINESS_CARD_CONFIRMATION_REQUIRED_ERROR);
  });

  it("preserves the below-minimum status after conscious confirmation", () => {
    expect(
      calculateBusinessCardPrice({
        cardType: matteUv,
        quantityInThousands: 3,
        negotiatedUnitPrice: 95_000,
        belowMinimumConfirmed: true,
      }),
    ).toMatchObject({
      isBelowAuthorizedMinimum: true,
      requiresConfirmation: true,
      confirmationStatus: "confirmed",
      totalPrice: 285_000,
    });
  });
});
