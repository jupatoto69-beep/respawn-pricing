import { describe, expect, it } from "vitest";

import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
} from "./three-d-printing-catalog";
import { THREE_D_PRINTING_COLOR_MODE_IDS } from "./three-d-printing-color-mode";
import {
  changeThreeDPrintingQuickColorMode,
  changeThreeDPrintingQuickTextField,
  createInitialThreeDPrintingQuickFormValues,
  resolveThreeDPrintingQuickFormValues,
  THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION,
  THREE_D_PRINTING_PRELIMINARY_NOTICE,
} from "./three-d-printing-quick-selection";

describe("3D printing preliminary quick intake", () => {
  it("collects reference fields and a manual total without slicer metrics", () => {
    const initial = createInitialThreeDPrintingQuickFormValues();
    const serialized = JSON.stringify(initial);

    expect(initial.materialId).toBe(THREE_D_PRINTING_MATERIAL_IDS.pla);
    expect(initial.estimatedTotalCop).toBe("");
    expect(serialized).not.toMatch(/grams|printingHours|printingMinutes/i);
  });

  it("keeps approximate size as text without deriving compatibility", () => {
    const withSize = changeThreeDPrintingQuickTextField(
      createInitialThreeDPrintingQuickFormValues(),
      "approximateSize",
      "aprox. 30 cm de alto",
    );

    expect(withSize.approximateSize).toBe("aprox. 30 cm de alto");
    expect(JSON.stringify(withSize)).not.toMatch(/compatib|printer/i);
  });

  it("may record multicolor only as a known operational selection", () => {
    const multicolor = changeThreeDPrintingQuickColorMode(
      createInitialThreeDPrintingQuickFormValues(),
      THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
    );

    expect(multicolor.colorModeId).toBe(
      THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
    );
  });

  it("uses the authoritative preliminary notice", () => {
    expect(THREE_D_PRINTING_PRELIMINARY_NOTICE).toBe(
      "Estimación preliminar. Para determinar el precio definitivo se requiere recibir y laminar el archivo 3D.",
    );
    expect(THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION).toBe(
      "Valor estimado. El precio definitivo puede cambiar después de recibir y laminar el archivo 3D.",
    );
  });

  it("requires the approximate size and description before accepting a result", () => {
    const initial = createInitialThreeDPrintingQuickFormValues();

    expect(() =>
      resolveThreeDPrintingQuickFormValues({
        ...initial,
        estimatedTotalCop: "80000",
      }),
    ).toThrow("approximate size is required");
    expect(() =>
      resolveThreeDPrintingQuickFormValues({
        ...initial,
        approximateSize: "15 cm",
        estimatedTotalCop: "80000",
      }),
    ).toThrow("piece description is required");
  });

  it("requires a positive integer quantity", () => {
    const values = {
      ...createInitialThreeDPrintingQuickFormValues(),
      approximateSize: "15 cm",
      pieceDescription: "Figura decorativa",
      estimatedTotalCop: "80000",
    };

    expect(() =>
      resolveThreeDPrintingQuickFormValues({ ...values, quantity: "" }),
    ).toThrow("quantity is required");
    expect(() =>
      resolveThreeDPrintingQuickFormValues({ ...values, quantity: "3.5" }),
    ).toThrow("positive integer");
  });

  it("resolves safe selections and keeps quantity separate from the total", () => {
    const resolved = resolveThreeDPrintingQuickFormValues({
      ...createInitialThreeDPrintingQuickFormValues(),
      approximateSize: " 15 cm ",
      pieceDescription: " Figura decorativa ",
      quantity: "3",
      modelingId: THREE_D_PRINTING_MODELING_IDS.aiAssisted,
      estimatedTotalCop: "80250",
    });

    expect(resolved).toEqual({
      approximateSize: "15 cm",
      pieceDescription: "Figura decorativa",
      materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
      quantity: 3,
      modelingId: THREE_D_PRINTING_MODELING_IDS.aiAssisted,
      colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
      acceptedEstimatedTotal: 80_500,
    });
    expect(resolved.acceptedEstimatedTotal).not.toBe(241_500);
    expect(Object.isFrozen(resolved)).toBe(true);
  });
});
