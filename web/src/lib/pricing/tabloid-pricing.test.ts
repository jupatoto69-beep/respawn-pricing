import { describe, expect, it } from "vitest";

import {
  TABLOID_ADHESIVE_FINISH_IDS,
  TABLOID_AUTOMATIC_TIER_IDS,
  TABLOID_TYPE_IDS,
  resolveTabloidAutomaticPricing,
} from "./tabloid-pricing";

const { standard, adhesive } = TABLOID_TYPE_IDS;
const { standard: standardAdhesive, preCut } =
  TABLOID_ADHESIVE_FINISH_IDS;
const {
  standardFromOne,
  standardFromFifteen,
  standardAdhesiveFromOne,
  standardAdhesiveFromFive,
  preCutAdhesiveFromOne,
  preCutAdhesiveFromFive,
} = TABLOID_AUTOMATIC_TIER_IDS;

describe("resolveTabloidAutomaticPricing", () => {
  it.each([
    [1, standardFromOne, 15_000, 10_000],
    [14, standardFromOne, 15_000, 10_000],
    [15, standardFromFifteen, 8_000, 8_000],
    [16, standardFromFifteen, 8_000, 8_000],
  ] as const)(
    "resolves standard quantity %i with its automatic tier and minimum",
    (quantity, automaticTierId, automaticBaseUnitPrice, minimum) => {
      expect(resolveTabloidAutomaticPricing(standard, null, quantity)).toEqual({
        tabloidType: standard,
        adhesiveFinish: null,
        quantity,
        automaticTierId,
        automaticBaseUnitPrice,
        applicableAuthorizedMinimum: minimum,
      });
    },
  );

  it.each([
    [1, standardAdhesiveFromOne, 20_000],
    [4, standardAdhesiveFromOne, 20_000],
    [5, standardAdhesiveFromFive, 15_000],
    [6, standardAdhesiveFromFive, 15_000],
  ] as const)(
    "resolves standard adhesive quantity %i with its inclusive tier",
    (quantity, automaticTierId, automaticBaseUnitPrice) => {
      expect(
        resolveTabloidAutomaticPricing(
          adhesive,
          standardAdhesive,
          quantity,
        ),
      ).toMatchObject({
        adhesiveFinish: standardAdhesive,
        automaticTierId,
        automaticBaseUnitPrice,
        applicableAuthorizedMinimum: 15_000,
      });
    },
  );

  it.each([
    [1, preCutAdhesiveFromOne, 25_000],
    [4, preCutAdhesiveFromOne, 25_000],
    [5, preCutAdhesiveFromFive, 20_000],
    [6, preCutAdhesiveFromFive, 20_000],
  ] as const)(
    "resolves pre-cut adhesive quantity %i with its inclusive tier",
    (quantity, automaticTierId, automaticBaseUnitPrice) => {
      expect(
        resolveTabloidAutomaticPricing(adhesive, preCut, quantity),
      ).toMatchObject({
        adhesiveFinish: preCut,
        automaticTierId,
        automaticBaseUnitPrice,
        applicableAuthorizedMinimum: 20_000,
      });
    },
  );

  it("requires an adhesive finish for adhesive tabloids", () => {
    expect(() =>
      resolveTabloidAutomaticPricing(adhesive, null, 1),
    ).toThrowError("Adhesive tabloid finish is required.");
  });

  it("rejects an adhesive finish for standard tabloids", () => {
    expect(() =>
      resolveTabloidAutomaticPricing(standard, standardAdhesive, 1),
    ).toThrowError("Standard tabloid must not include an adhesive finish.");
  });
});
