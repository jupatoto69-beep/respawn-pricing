import { describe, expect, it } from "vitest";

import { calculateThreeDPrintingPrice } from "./calculate-three-d-printing-price";
import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
} from "./three-d-printing-catalog";
import { THREE_D_PRINTING_COLOR_MODE_IDS } from "./three-d-printing-color-mode";
import { THREE_D_PRINTING_PRINTER_IDS } from "./three-d-printing-printer";
import {
  changeThreeDPrintingBelowThresholdAuthorization,
  changeThreeDPrintingColorMode,
  changeThreeDPrintingManualPriceEnabled,
  changeThreeDPrintingMaterial,
  changeThreeDPrintingModeling,
  changeThreeDPrintingPrinter,
  changeThreeDPrintingTextField,
  clearThreeDPrintingBelowThresholdAuthorization,
  createInitialThreeDPrintingPricingFormValues,
  parseThreeDPrintingPricingFormValues,
  resolveThreeDPrintingPricingFormValues,
  type ThreeDPrintingPricingFormValues,
} from "./three-d-printing-selection";

function createCompleteValues(
  overrides: Partial<ThreeDPrintingPricingFormValues> = {},
): ThreeDPrintingPricingFormValues {
  return {
    ...createInitialThreeDPrintingPricingFormValues(),
    materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
    gramsPerUnit: "100",
    printingHoursPerUnit: "5",
    printingMinutesPerUnit: "0",
    quantity: "1",
    ...overrides,
  };
}

describe("3D printing precise form selection", () => {
  it("starts with one color and KE without dimension fields", () => {
    const initial = createInitialThreeDPrintingPricingFormValues();

    expect(initial).toEqual({
      pricingStrategy: "three-d-printing",
      colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
      printerId: THREE_D_PRINTING_PRINTER_IDS.ke,
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
    expect(JSON.stringify(initial)).not.toMatch(
      /widthCm|depthCm|heightCm|compatibility/i,
    );
  });

  it("parses precise pricing input and resolves the production printer", () => {
    const values = createCompleteValues({
      printerId: THREE_D_PRINTING_PRINTER_IDS.hi,
      printingMinutesPerUnit: "30",
      quantity: "3",
      modelingId: THREE_D_PRINTING_MODELING_IDS.basic,
    });
    const resolved = resolveThreeDPrintingPricingFormValues(values);

    expect(resolved.printerId).toBe(THREE_D_PRINTING_PRINTER_IDS.hi);
    expect(resolved.pricingInput).toEqual({
      materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
      colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
      gramsPerUnit: 100,
      printingHoursPerUnit: 5,
      printingMinutesPerUnit: 30,
      quantity: 3,
      modelingId: THREE_D_PRINTING_MODELING_IDS.basic,
      manualPrice: {
        enabled: false,
        amountCop: null,
        belowThresholdAuthorized: false,
      },
    });
  });

  it.each([
    THREE_D_PRINTING_PRINTER_IDS.ke,
    THREE_D_PRINTING_PRINTER_IDS.hi,
  ])("allows one-color production on %s", (printerId) => {
    expect(
      resolveThreeDPrintingPricingFormValues(
        createCompleteValues({ printerId }),
      ).printerId,
    ).toBe(printerId);
  });

  it("resolves multicolor to HI and clears exceptional authorization", () => {
    const multicolor = changeThreeDPrintingColorMode(
      {
        ...createCompleteValues(),
        belowThresholdAuthorized: true,
      },
      THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
    );

    expect(multicolor).toMatchObject({
      colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
      printerId: THREE_D_PRINTING_PRINTER_IDS.hi,
      belowThresholdAuthorized: false,
    });
    expect(resolveThreeDPrintingPricingFormValues(multicolor).printerId).toBe(
      THREE_D_PRINTING_PRINTER_IDS.hi,
    );
  });

  it("does not permit KE to remain a multicolor production choice", () => {
    const multicolor = changeThreeDPrintingColorMode(
      createCompleteValues(),
      THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
    );

    expect(
      changeThreeDPrintingPrinter(
        multicolor,
        THREE_D_PRINTING_PRINTER_IDS.ke,
      ),
    ).toBe(multicolor);
    expect(() =>
      resolveThreeDPrintingPricingFormValues({
        ...multicolor,
        printerId: THREE_D_PRINTING_PRINTER_IDS.ke,
      }),
    ).toThrow("multicolor production requires HI");
  });

  it("keeps HI valid when changing from multicolor back to one color", () => {
    const multicolor = changeThreeDPrintingColorMode(
      createCompleteValues(),
      THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
    );
    const oneColor = changeThreeDPrintingColorMode(
      multicolor,
      THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
    );

    expect(oneColor.printerId).toBe(THREE_D_PRINTING_PRINTER_IDS.hi);
    expect(resolveThreeDPrintingPricingFormValues(oneColor).printerId).toBe(
      THREE_D_PRINTING_PRINTER_IDS.hi,
    );
  });

  it("keeps price and authorization unchanged when only the printer changes", () => {
    const authorized = {
      ...createCompleteValues(),
      belowThresholdAuthorized: true,
    };
    const onHi = changeThreeDPrintingPrinter(
      authorized,
      THREE_D_PRINTING_PRINTER_IDS.hi,
    );
    const keCalculation = calculateThreeDPrintingPrice(
      parseThreeDPrintingPricingFormValues(authorized),
    );
    const hiCalculation = calculateThreeDPrintingPrice(
      parseThreeDPrintingPricingFormValues(onHi),
    );

    expect(onHi.belowThresholdAuthorized).toBe(true);
    expect(hiCalculation.totalPrice).toBe(keCalculation.totalPrice);
    expect(hiCalculation.internal).toEqual(keCalculation.internal);
  });

  it.each([
    ["gramsPerUnit", "101"],
    ["printingHoursPerUnit", "2"],
    ["printingMinutesPerUnit", "31"],
    ["quantity", "4"],
    ["manualPriceCop", "50000"],
  ] as const)("changing %s clears exceptional authorization", (field, value) => {
    const authorized = {
      ...createCompleteValues(),
      belowThresholdAuthorized: true,
    };

    expect(
      changeThreeDPrintingTextField(authorized, field, value)
        .belowThresholdAuthorized,
    ).toBe(false);
  });

  it("clears authorization for other pricing-affecting transitions", () => {
    const authorized = changeThreeDPrintingBelowThresholdAuthorization(
      createCompleteValues(),
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
    expect(
      changeThreeDPrintingColorMode(
        authorized,
        THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
      ).belowThresholdAuthorized,
    ).toBe(false);
    expect(
      changeThreeDPrintingManualPriceEnabled(authorized, true)
        .belowThresholdAuthorized,
    ).toBe(false);
    expect(
      clearThreeDPrintingBelowThresholdAuthorization(authorized)
        .belowThresholdAuthorized,
    ).toBe(false);
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
    const values = createCompleteValues({ manualPriceCop: "Infinity" });

    expect(parseThreeDPrintingPricingFormValues(values).manualPrice).toEqual({
      enabled: false,
      amountCop: null,
      belowThresholdAuthorized: false,
    });
  });

  it("rejects missing material and non-finite required values", () => {
    expect(() =>
      parseThreeDPrintingPricingFormValues(
        createInitialThreeDPrintingPricingFormValues(),
      ),
    ).toThrow("material must be valid");
    expect(() =>
      parseThreeDPrintingPricingFormValues(
        createCompleteValues({ gramsPerUnit: "Infinity" }),
      ),
    ).toThrow("must be a finite number");
  });
});
