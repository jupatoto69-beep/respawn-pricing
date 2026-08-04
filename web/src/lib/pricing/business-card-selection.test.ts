import { describe, expect, it } from "vitest";

import { BUSINESS_CARD_TYPE_IDS } from "./business-card-pricing";
import { resolveBusinessCardPricingDecision } from "./calculate-business-card-price";
import { parseOptionalNegotiatedCopUnitPrice } from "./negotiated-cop-price";
import { parsePositiveIntegerQuantity } from "./service-quantity";
import {
  changeBusinessCardBelowMinimumConfirmation,
  changeBusinessCardNegotiatedUnitPrice,
  changeBusinessCardQuantity,
  changeBusinessCardTypeSelection,
  createInitialBusinessCardPricingFormValues,
  type BusinessCardPricingFormValues,
} from "./business-card-selection";

const { glossy, matteUv } = BUSINESS_CARD_TYPE_IDS;

const confirmedValues: BusinessCardPricingFormValues = {
  pricingStrategy: "business-card-pricing",
  cardType: glossy,
  quantityInThousands: "2",
  negotiatedUnitPrice: "75000",
  belowMinimumConfirmed: true,
};

describe("business-card selection transitions", () => {
  it("starts with one thousand and no commercial override", () => {
    expect(createInitialBusinessCardPricingFormValues()).toEqual({
      pricingStrategy: "business-card-pricing",
      cardType: "",
      quantityInThousands: "1",
      negotiatedUnitPrice: "",
      belowMinimumConfirmed: false,
    });
  });

  it("changing negotiated price keeps quantity and clears confirmation", () => {
    expect(
      changeBusinessCardNegotiatedUnitPrice(confirmedValues, "80000"),
    ).toEqual({
      ...confirmedValues,
      negotiatedUnitPrice: "80000",
      belowMinimumConfirmed: false,
    });
  });

  it("changing quantity keeps negotiated price and clears confirmation", () => {
    expect(changeBusinessCardQuantity(confirmedValues, "3")).toEqual({
      ...confirmedValues,
      quantityInThousands: "3",
      belowMinimumConfirmed: false,
    });
  });

  it("changing card type keeps a valid quantity and clears override data", () => {
    expect(changeBusinessCardTypeSelection(confirmedValues, matteUv)).toEqual({
      ...confirmedValues,
      cardType: matteUv,
      quantityInThousands: "2",
      negotiatedUnitPrice: "",
      belowMinimumConfirmed: false,
    });
  });

  it("changing card type resets an invalid quantity to one", () => {
    expect(
      changeBusinessCardTypeSelection(
        { ...confirmedValues, quantityInThousands: "1.5" },
        matteUv,
      ).quantityInThousands,
    ).toBe("1");
  });

  it("allows confirmation to be recorded only as current form state", () => {
    expect(
      changeBusinessCardBelowMinimumConfirmation(
        { ...confirmedValues, belowMinimumConfirmed: false },
        true,
      ).belowMinimumConfirmed,
    ).toBe(true);
  });

  it("moving the negotiated price to the minimum hides the warning state", () => {
    const updatedValues = changeBusinessCardNegotiatedUnitPrice(
      confirmedValues,
      "80000",
    );

    if (updatedValues.cardType === "") {
      throw new Error("The test requires a selected business-card type.");
    }

    const decision = resolveBusinessCardPricingDecision(
      updatedValues.cardType,
      parsePositiveIntegerQuantity(updatedValues.quantityInThousands),
      parseOptionalNegotiatedCopUnitPrice(updatedValues.negotiatedUnitPrice),
    );

    expect(updatedValues.belowMinimumConfirmed).toBe(false);
    expect(decision.isBelowAuthorizedMinimum).toBe(false);
    expect(decision.requiresConfirmation).toBe(false);
  });
});
