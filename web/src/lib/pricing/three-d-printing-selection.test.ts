import { describe, expect, it } from "vitest";

import {
  changeThreeDPrintingBelowThresholdAuthorization,
  changeThreeDPrintingManualPriceEnabled,
  changeThreeDPrintingMaterial,
  changeThreeDPrintingModeling,
  changeThreeDPrintingTextField,
  createInitialThreeDPrintingPricingFormValues,
  parseThreeDPrintingPricingFormValues,
} from "./three-d-printing-selection";
import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
} from "./three-d-printing-catalog";

describe("3D printing form selection", () => {
  it("starts with explicit precise inputs and suggested pricing enabled", () => {
    expect(createInitialThreeDPrintingPricingFormValues()).toEqual({
      pricingStrategy: "three-d-printing",
      materialId: "",
      gramsPerUnit: "",
      printingHoursPerUnit: "",
      printingMinutesPerUnit: "",
      quantity: "1",
      modelingId: THREE_D_PRINTING_MODELING_IDS.none,
      manualPriceEnabled: false,
      manualPriceCop: "",
      belowThresholdAuthorized: false,
    });
  });

  it("parses precise form values into estimator-independent pricing input", () => {
    let values = createInitialThreeDPrintingPricingFormValues();
    values = changeThreeDPrintingMaterial(
      values,
      THREE_D_PRINTING_MATERIAL_IDS.petg,
    );
    values = changeThreeDPrintingTextField(values, "gramsPerUnit", "100.5");
    values = changeThreeDPrintingTextField(
      values,
      "printingHoursPerUnit",
      "1",
    );
    values = changeThreeDPrintingTextField(
      values,
      "printingMinutesPerUnit",
      "30",
    );
    values = changeThreeDPrintingTextField(values, "quantity", "3");

    expect(parseThreeDPrintingPricingFormValues(values)).toEqual({
      materialId: THREE_D_PRINTING_MATERIAL_IDS.petg,
      gramsPerUnit: 100.5,
      printingHoursPerUnit: 1,
      printingMinutesPerUnit: 30,
      quantity: 3,
      modelingId: THREE_D_PRINTING_MODELING_IDS.none,
      manualPrice: {
        enabled: false,
        amountCop: null,
        belowThresholdAuthorized: false,
      },
    });
  });

  it("clears a stale manual price when modification is disabled", () => {
    let values = createInitialThreeDPrintingPricingFormValues();
    values = changeThreeDPrintingManualPriceEnabled(values, true);
    values = changeThreeDPrintingTextField(
      values,
      "manualPriceCop",
      "60000",
    );

    expect(changeThreeDPrintingManualPriceEnabled(values, false)).toMatchObject({
      manualPriceEnabled: false,
      manualPriceCop: "",
      belowThresholdAuthorized: false,
    });
  });

  it("does not parse a disabled stale manual value", () => {
    const values = {
      ...createInitialThreeDPrintingPricingFormValues(),
      materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
      gramsPerUnit: "1",
      printingHoursPerUnit: "0",
      printingMinutesPerUnit: "0",
      manualPriceCop: "Infinity",
    };

    expect(parseThreeDPrintingPricingFormValues(values).manualPrice).toEqual({
      enabled: false,
      amountCop: null,
      belowThresholdAuthorized: false,
    });
  });

  it.each([
    ["manualPriceCop", "190100"],
    ["gramsPerUnit", "101"],
    ["printingHoursPerUnit", "2"],
    ["printingMinutesPerUnit", "31"],
    ["quantity", "4"],
  ] as const)("changing %s clears exceptional authorization", (field, value) => {
    const authorized = {
      ...createInitialThreeDPrintingPricingFormValues(),
      belowThresholdAuthorized: true,
    };

    expect(
      changeThreeDPrintingTextField(authorized, field, value)
        .belowThresholdAuthorized,
    ).toBe(false);
  });

  it("changing material or modeling clears exceptional authorization", () => {
    const authorized = changeThreeDPrintingBelowThresholdAuthorization(
      createInitialThreeDPrintingPricingFormValues(),
      true,
    );

    expect(
      changeThreeDPrintingMaterial(
        authorized,
        THREE_D_PRINTING_MATERIAL_IDS.petg,
      ).belowThresholdAuthorized,
    ).toBe(false);
    expect(
      changeThreeDPrintingModeling(
        authorized,
        THREE_D_PRINTING_MODELING_IDS.basic,
      ).belowThresholdAuthorized,
    ).toBe(false);
  });

  it("rejects missing material and non-finite required values", () => {
    const initial = createInitialThreeDPrintingPricingFormValues();
    expect(() => parseThreeDPrintingPricingFormValues(initial)).toThrow(
      "material must be valid",
    );

    const invalid = {
      ...initial,
      materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
      gramsPerUnit: "Infinity",
      printingHoursPerUnit: "0",
      printingMinutesPerUnit: "0",
    };
    expect(() => parseThreeDPrintingPricingFormValues(invalid)).toThrow(
      "must be a finite number",
    );
  });
});
