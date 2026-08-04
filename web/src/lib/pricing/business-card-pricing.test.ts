import { describe, expect, it } from "vitest";

import {
  BUSINESS_CARD_AUTOMATIC_TIER_IDS,
  BUSINESS_CARD_TYPE_IDS,
  resolveBusinessCardAutomaticPricing,
} from "./business-card-pricing";

const { standard, volumeFromThree } = BUSINESS_CARD_AUTOMATIC_TIER_IDS;
const { glossy, matteUv } = BUSINESS_CARD_TYPE_IDS;

describe("resolveBusinessCardAutomaticPricing", () => {
  it.each([
    [1, standard, 85_000, 80_000],
    [2, standard, 85_000, 80_000],
    [3, volumeFromThree, 75_000, 75_000],
    [4, volumeFromThree, 75_000, 75_000],
  ] as const)(
    "resolves glossy quantity %i with its automatic tier and minimum",
    (quantityInThousands, automaticTierId, automaticUnitPrice, minimum) => {
      expect(
        resolveBusinessCardAutomaticPricing(glossy, quantityInThousands),
      ).toEqual({
        cardType: glossy,
        quantityInThousands,
        equivalentCardQuantity: quantityInThousands * 1_000,
        automaticTierId,
        automaticUnitPrice,
        applicableAuthorizedMinimum: minimum,
      });
    },
  );

  it.each([
    [1, standard, 120_000, 115_000],
    [2, standard, 120_000, 115_000],
    [3, volumeFromThree, 100_000, 100_000],
    [4, volumeFromThree, 100_000, 100_000],
  ] as const)(
    "resolves matte UV quantity %i with its automatic tier and minimum",
    (quantityInThousands, automaticTierId, automaticUnitPrice, minimum) => {
      expect(
        resolveBusinessCardAutomaticPricing(matteUv, quantityInThousands),
      ).toEqual({
        cardType: matteUv,
        quantityInThousands,
        equivalentCardQuantity: quantityInThousands * 1_000,
        automaticTierId,
        automaticUnitPrice,
        applicableAuthorizedMinimum: minimum,
      });
    },
  );

  it("activates the volume tier at exactly three thousands", () => {
    expect(resolveBusinessCardAutomaticPricing(glossy, 3).automaticTierId).toBe(
      volumeFromThree,
    );
    expect(
      resolveBusinessCardAutomaticPricing(matteUv, 3).automaticTierId,
    ).toBe(volumeFromThree);
  });
});
