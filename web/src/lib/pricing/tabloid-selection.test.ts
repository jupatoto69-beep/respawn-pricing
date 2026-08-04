import { describe, expect, it } from "vitest";

import {
  resolveTabloidPricingDecision,
} from "./calculate-tabloid-price";
import { parseOptionalNegotiatedCopUnitPrice } from "./negotiated-cop-price";
import { parsePositiveIntegerQuantity } from "./service-quantity";
import {
  changeTabloidAdhesiveFinishSelection,
  changeTabloidBelowMinimumConfirmation,
  changeTabloidLaminationSelection,
  changeTabloidNegotiatedBaseUnitPrice,
  changeTabloidQuantity,
  changeTabloidTypeSelection,
  createInitialTabloidPricingFormValues,
  type TabloidPricingFormValues,
} from "./tabloid-selection";
import {
  TABLOID_ADHESIVE_FINISH_IDS,
  TABLOID_TYPE_IDS,
} from "./tabloid-pricing";

const { standard, adhesive } = TABLOID_TYPE_IDS;
const { standard: standardAdhesive, preCut } =
  TABLOID_ADHESIVE_FINISH_IDS;

const confirmedValues: TabloidPricingFormValues = {
  pricingStrategy: "tabloid-pricing",
  tabloidType: adhesive,
  adhesiveFinish: standardAdhesive,
  quantity: "5",
  negotiatedBaseUnitPrice: "12000",
  belowMinimumConfirmed: true,
  isLaminated: true,
};

describe("tabloid selection transitions", () => {
  it("starts at one unit with no negotiated price or lamination", () => {
    expect(createInitialTabloidPricingFormValues()).toEqual({
      pricingStrategy: "tabloid-pricing",
      tabloidType: "",
      adhesiveFinish: "",
      quantity: "1",
      negotiatedBaseUnitPrice: "",
      belowMinimumConfirmed: false,
      isLaminated: false,
    });
  });

  it("changing negotiated price keeps quantity and clears confirmation", () => {
    expect(
      changeTabloidNegotiatedBaseUnitPrice(confirmedValues, "15000"),
    ).toEqual({
      ...confirmedValues,
      negotiatedBaseUnitPrice: "15000",
      belowMinimumConfirmed: false,
    });
  });

  it("changing quantity keeps negotiated price and clears confirmation", () => {
    expect(changeTabloidQuantity(confirmedValues, "6")).toEqual({
      ...confirmedValues,
      quantity: "6",
      belowMinimumConfirmed: false,
    });
  });

  it("changing type keeps a valid quantity and clears finish and override", () => {
    expect(changeTabloidTypeSelection(confirmedValues, standard)).toEqual({
      ...confirmedValues,
      tabloidType: standard,
      adhesiveFinish: "",
      quantity: "5",
      negotiatedBaseUnitPrice: "",
      belowMinimumConfirmed: false,
    });
  });

  it("changing type resets an invalid quantity to one", () => {
    expect(
      changeTabloidTypeSelection(
        { ...confirmedValues, quantity: "1.0" },
        standard,
      ).quantity,
    ).toBe("1");
  });

  it("changing adhesive finish clears negotiated price and confirmation", () => {
    expect(
      changeTabloidAdhesiveFinishSelection(confirmedValues, preCut),
    ).toEqual({
      ...confirmedValues,
      adhesiveFinish: preCut,
      negotiatedBaseUnitPrice: "",
      belowMinimumConfirmed: false,
    });
  });

  it("does not retain an adhesive finish for a standard tabloid", () => {
    const standardValues = changeTabloidTypeSelection(
      confirmedValues,
      standard,
    );

    expect(
      changeTabloidAdhesiveFinishSelection(standardValues, preCut)
        .adhesiveFinish,
    ).toBe("");
  });

  it("changing lamination clears confirmation", () => {
    expect(changeTabloidLaminationSelection(confirmedValues, false)).toEqual({
      ...confirmedValues,
      isLaminated: false,
      belowMinimumConfirmed: false,
    });
  });

  it("records confirmation only in the current form state", () => {
    expect(
      changeTabloidBelowMinimumConfirmation(
        { ...confirmedValues, belowMinimumConfirmed: false },
        true,
      ).belowMinimumConfirmed,
    ).toBe(true);
  });

  it("raising the negotiated base price to the minimum hides the warning", () => {
    const updatedValues = changeTabloidNegotiatedBaseUnitPrice(
      confirmedValues,
      "15000",
    );

    if (
      updatedValues.tabloidType !== adhesive ||
      updatedValues.adhesiveFinish === ""
    ) {
      throw new Error("The test requires a selected adhesive tabloid.");
    }

    const decision = resolveTabloidPricingDecision(
      updatedValues.tabloidType,
      updatedValues.adhesiveFinish,
      parsePositiveIntegerQuantity(updatedValues.quantity),
      parseOptionalNegotiatedCopUnitPrice(
        updatedValues.negotiatedBaseUnitPrice,
      ),
      updatedValues.isLaminated,
    );

    expect(updatedValues.belowMinimumConfirmed).toBe(false);
    expect(decision.isBelowAuthorizedMinimum).toBe(false);
    expect(decision.requiresConfirmation).toBe(false);
  });
});
