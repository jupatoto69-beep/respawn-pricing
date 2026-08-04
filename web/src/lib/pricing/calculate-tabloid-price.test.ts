import { describe, expect, it } from "vitest";

import {
  TABLOID_CONFIRMATION_REQUIRED_ERROR,
  TABLOID_LAMINATION_UNIT_PRICE,
  calculateTabloidPrice,
  resolveTabloidPricingDecision,
} from "./calculate-tabloid-price";
import {
  TABLOID_ADHESIVE_FINISH_IDS,
  TABLOID_TYPE_IDS,
  type TabloidAdhesiveFinishId,
  type TabloidTypeId,
} from "./tabloid-pricing";

const { standard, adhesive } = TABLOID_TYPE_IDS;
const { standard: standardAdhesive, preCut } =
  TABLOID_ADHESIVE_FINISH_IDS;

describe("calculateTabloidPrice automatic pricing", () => {
  it.each([
    [standard, null, 1, 15_000, 10_000, 15_000],
    [standard, null, 14, 15_000, 10_000, 210_000],
    [standard, null, 15, 8_000, 8_000, 120_000],
    [standard, null, 16, 8_000, 8_000, 128_000],
    [adhesive, standardAdhesive, 1, 20_000, 15_000, 20_000],
    [adhesive, standardAdhesive, 4, 20_000, 15_000, 80_000],
    [adhesive, standardAdhesive, 5, 15_000, 15_000, 75_000],
    [adhesive, standardAdhesive, 6, 15_000, 15_000, 90_000],
    [adhesive, preCut, 1, 25_000, 20_000, 25_000],
    [adhesive, preCut, 4, 25_000, 20_000, 100_000],
    [adhesive, preCut, 5, 20_000, 20_000, 100_000],
    [adhesive, preCut, 6, 20_000, 20_000, 120_000],
  ] satisfies readonly [
    TabloidTypeId,
    TabloidAdhesiveFinishId | null,
    number,
    number,
    number,
    number,
  ][])(
    "calculates %s / %s quantity %i without commercial rounding",
    (
      tabloidType,
      adhesiveFinish,
      quantity,
      automaticBaseUnitPrice,
      applicableAuthorizedMinimum,
      totalPrice,
    ) => {
      expect(
        calculateTabloidPrice({
          tabloidType,
          adhesiveFinish,
          quantity,
          negotiatedBaseUnitPrice: null,
          belowMinimumConfirmed: false,
          isLaminated: false,
        }),
      ).toMatchObject({
        automaticBaseUnitPrice,
        applicableAuthorizedMinimum,
        negotiatedBaseUnitPrice: null,
        basePriceSource: "automatic",
        resolvedBaseUnitPrice: automaticBaseUnitPrice,
        isBelowAuthorizedMinimum: false,
        requiresConfirmation: false,
        confirmationStatus: "not-required",
        laminationUnitPrice: 0,
        resolvedFinalUnitPrice: automaticBaseUnitPrice,
        baseSubtotal: totalPrice,
        laminationSubtotal: 0,
        totalPrice,
      });
    },
  );

  it("never requires confirmation for automatic pricing", () => {
    expect(
      resolveTabloidPricingDecision(standard, null, 1, null, false),
    ).toMatchObject({
      basePriceSource: "automatic",
      isBelowAuthorizedMinimum: false,
      requiresConfirmation: false,
    });
  });
});

describe("tabloid lamination", () => {
  it.each([
    [standard, null, 15, 120_000, 75_000, 195_000],
    [adhesive, standardAdhesive, 5, 75_000, 25_000, 100_000],
    [adhesive, preCut, 5, 100_000, 25_000, 125_000],
  ] satisfies readonly [
    TabloidTypeId,
    TabloidAdhesiveFinishId | null,
    number,
    number,
    number,
    number,
  ][])(
    "adds lamination after the base for %s / %s quantity %i",
    (
      tabloidType,
      adhesiveFinish,
      quantity,
      baseSubtotal,
      laminationSubtotal,
      totalPrice,
    ) => {
      expect(
        calculateTabloidPrice({
          tabloidType,
          adhesiveFinish,
          quantity,
          negotiatedBaseUnitPrice: null,
          belowMinimumConfirmed: false,
          isLaminated: true,
        }),
      ).toMatchObject({
        isLaminated: true,
        laminationUnitPrice: TABLOID_LAMINATION_UNIT_PRICE,
        baseSubtotal,
        laminationSubtotal,
        totalPrice,
      });
    },
  );

  it("does not change the applicable minimum or below-minimum detection", () => {
    const withoutLamination = resolveTabloidPricingDecision(
      standard,
      null,
      10,
      9_000,
      false,
    );
    const withLamination = resolveTabloidPricingDecision(
      standard,
      null,
      10,
      9_000,
      true,
    );

    expect(withLamination).toMatchObject({
      applicableAuthorizedMinimum:
        withoutLamination.applicableAuthorizedMinimum,
      isBelowAuthorizedMinimum: withoutLamination.isBelowAuthorizedMinimum,
      requiresConfirmation: withoutLamination.requiresConfirmation,
      resolvedBaseUnitPrice: withoutLamination.resolvedBaseUnitPrice,
      laminationUnitPrice: 5_000,
      resolvedFinalUnitPrice: 14_000,
    });
  });
});

describe("tabloid negotiated pricing", () => {
  it.each([
    [standard, null, 10, 12_000, 10_000, false, false, 120_000],
    [standard, null, 10, 10_000, 10_000, false, false, 100_000],
    [standard, null, 10, 9_000, 10_000, true, false, 90_000],
    [standard, null, 10, 9_000, 10_000, true, true, 140_000],
    [adhesive, standardAdhesive, 5, 15_000, 15_000, false, false, 75_000],
    [adhesive, standardAdhesive, 5, 12_000, 15_000, true, false, 60_000],
    [adhesive, standardAdhesive, 5, 12_000, 15_000, true, true, 85_000],
    [adhesive, preCut, 5, 20_000, 20_000, false, false, 100_000],
    [adhesive, preCut, 5, 18_000, 20_000, true, false, 90_000],
    [adhesive, preCut, 5, 18_000, 20_000, true, true, 115_000],
  ] satisfies readonly [
    TabloidTypeId,
    TabloidAdhesiveFinishId | null,
    number,
    number,
    number,
    boolean,
    boolean,
    number,
  ][])(
    "resolves %s / %s quantity %i negotiated at COP %i",
    (
      tabloidType,
      adhesiveFinish,
      quantity,
      negotiatedBaseUnitPrice,
      minimum,
      isBelowAuthorizedMinimum,
      isLaminated,
      totalPrice,
    ) => {
      const decision = resolveTabloidPricingDecision(
        tabloidType,
        adhesiveFinish,
        quantity,
        negotiatedBaseUnitPrice,
        isLaminated,
      );

      expect(decision).toMatchObject({
        negotiatedBaseUnitPrice,
        basePriceSource: "negotiated",
        resolvedBaseUnitPrice: negotiatedBaseUnitPrice,
        applicableAuthorizedMinimum: minimum,
        isBelowAuthorizedMinimum,
        requiresConfirmation: isBelowAuthorizedMinimum,
      });

      expect(
        calculateTabloidPrice({
          tabloidType,
          adhesiveFinish,
          quantity,
          negotiatedBaseUnitPrice,
          belowMinimumConfirmed: isBelowAuthorizedMinimum,
          isLaminated,
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
      calculateTabloidPrice({
        tabloidType: standard,
        adhesiveFinish: null,
        quantity: 10,
        negotiatedBaseUnitPrice: 9_000,
        belowMinimumConfirmed: false,
        isLaminated: false,
      }),
    ).toThrowError(TABLOID_CONFIRMATION_REQUIRED_ERROR);
  });

  it("preserves the below-minimum status after confirmation", () => {
    expect(
      calculateTabloidPrice({
        tabloidType: adhesive,
        adhesiveFinish: preCut,
        quantity: 5,
        negotiatedBaseUnitPrice: 18_000,
        belowMinimumConfirmed: true,
        isLaminated: true,
      }),
    ).toMatchObject({
      isBelowAuthorizedMinimum: true,
      requiresConfirmation: true,
      confirmationStatus: "confirmed",
      baseSubtotal: 90_000,
      laminationSubtotal: 25_000,
      totalPrice: 115_000,
    });
  });
});
