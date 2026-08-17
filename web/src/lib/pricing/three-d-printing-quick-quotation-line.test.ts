import { describe, expect, it } from "vitest";

import { calculateThreeDPrintingPrice } from "./calculate-three-d-printing-price";
import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
} from "./temporary-quotation";
import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
} from "./three-d-printing-catalog";
import { THREE_D_PRINTING_COLOR_MODE_IDS } from "./three-d-printing-color-mode";
import { THREE_D_PRINTING_PRINTER_IDS } from "./three-d-printing-printer";
import { createThreeDPrintingQuickQuotationLineDraft } from "./three-d-printing-quick-quotation-line";
import { createThreeDPrintingQuotationLineDraft } from "./three-d-printing-quotation-line";
import {
  createInitialThreeDPrintingQuickFormValues,
  resolveThreeDPrintingQuickFormValues,
  THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION,
  type ThreeDPrintingQuickFormValues,
} from "./three-d-printing-quick-selection";
import {
  createInitialThreeDPrintingPricingFormValues,
  resolveThreeDPrintingPricingFormValues,
} from "./three-d-printing-selection";

function createCompleteQuickValues(
  overrides: Partial<ThreeDPrintingQuickFormValues> = {},
): ThreeDPrintingQuickFormValues {
  return {
    ...createInitialThreeDPrintingQuickFormValues(),
    approximateSize: "15 cm",
    pieceDescription: "Figura decorativa",
    materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
    quantity: "3",
    modelingId: THREE_D_PRINTING_MODELING_IDS.aiAssisted,
    colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
    estimatedTotalCop: "80000",
    ...overrides,
  };
}

function expectNoQuickInternalPricing(value: unknown): void {
  const serialized = JSON.stringify(value).toLocaleLowerCase("es-CO");

  for (const forbidden of [
    "grams",
    "gramos",
    "printinghours",
    "printingminutes",
    "tiempo de impresión",
    "basecost",
    "electricity",
    "threshold",
    "authorization",
    "calibration",
    "interpolation",
    "multiplier",
    "×3",
    "×4",
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
}

describe("3D quick-estimate quotation line", () => {
  it("stores the requested quantity without multiplying the whole-job total", () => {
    const draft = createThreeDPrintingQuickQuotationLineDraft(
      resolveThreeDPrintingQuickFormValues(createCompleteQuickValues()),
    );

    expect(draft.quantity).toBe(3);
    expect(draft.lineTotal).toBe(80_000);
    expect(draft.lineTotal).not.toBe(240_000);
  });

  it("creates the complete immutable customer-safe preliminary snapshot", () => {
    const draft = createThreeDPrintingQuickQuotationLineDraft(
      resolveThreeDPrintingQuickFormValues(createCompleteQuickValues()),
    );
    const quotation = addQuotationLine(createEmptyQuotation(), draft);
    const stored = quotation.lines[0];

    expect(stored).toEqual({
      id: "quotation-line-1",
      source: "service",
      title: "Impresión 3D — Estimación preliminar",
      quantity: 3,
      details: [
        { label: "Tipo", value: "Estimación preliminar" },
        { label: "Tamaño aproximado", value: "15 cm" },
        { label: "Descripción", value: "Figura decorativa" },
        { label: "Material", value: "PLA" },
        { label: "Modelado", value: "Modelo con IA / asistido por IA" },
        { label: "Tipo de impresión", value: "Un color" },
        { label: "Condición", value: THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION },
      ],
      lineTotal: 80_000,
    });
    expect(Object.isFrozen(draft)).toBe(true);
    expect(Object.isFrozen(draft.details)).toBe(true);
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored.details)).toBe(true);
    expectNoQuickInternalPricing(draft);
    expectNoQuickInternalPricing(stored);
  });

  it("keeps multicolor at the manual total and stores only the HI operation fact", () => {
    const draft = createThreeDPrintingQuickQuotationLineDraft(
      resolveThreeDPrintingQuickFormValues(
        createCompleteQuickValues({
          colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
        }),
      ),
    );

    expect(draft.lineTotal).toBe(80_000);
    expect(draft.lineTotal).not.toBe(240_000);
    expect(draft.details).toContainEqual({
      label: "Tipo de impresión",
      value: "Multicolor",
    });
    expect(draft.details).toContainEqual({ label: "Producción", value: "HI" });
    expectNoQuickInternalPricing(draft);
  });

  it("does not reprice a stored estimate when later quick values change", () => {
    const initialValues = createCompleteQuickValues();
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createThreeDPrintingQuickQuotationLineDraft(
        resolveThreeDPrintingQuickFormValues(initialValues),
      ),
    );
    const laterDraft = createThreeDPrintingQuickQuotationLineDraft(
      resolveThreeDPrintingQuickFormValues({
        ...initialValues,
        estimatedTotalCop: "120000",
      }),
    );

    expect(quotation.lines[0].lineTotal).toBe(80_000);
    expect(calculateQuotationTotal(quotation)).toBe(80_000);
    expect(laterDraft.lineTotal).toBe(120_000);
  });

  it("combines product, service, precise 3D and quick stored totals only", () => {
    const preciseResolved = resolveThreeDPrintingPricingFormValues({
      ...createInitialThreeDPrintingPricingFormValues(),
      materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
      gramsPerUnit: "100",
      printingHoursPerUnit: "5",
      printingMinutesPerUnit: "0",
      quantity: "1",
      printerId: THREE_D_PRINTING_PRINTER_IDS.ke,
    });
    const preciseDraft = createThreeDPrintingQuotationLineDraft({
      calculation: calculateThreeDPrintingPrice(preciseResolved.pricingInput),
      resolvedForm: preciseResolved,
    });
    const quickDraft = createThreeDPrintingQuickQuotationLineDraft(
      resolveThreeDPrintingQuickFormValues(createCompleteQuickValues()),
    );
    const withProduct = addQuotationLine(createEmptyQuotation(), {
      source: "area-product",
      title: "Banner",
      quantity: 1,
      details: [{ label: "Producto", value: "Banner" }],
      lineTotal: 768_000,
    });
    const withService = addQuotationLine(withProduct, {
      source: "service",
      title: "Instalación de Office únicamente",
      quantity: 1,
      details: [{ label: "Servicio", value: "Instalación de Office" }],
      lineTotal: 50_000,
    });
    const withPrecise = addQuotationLine(withService, preciseDraft);
    const quotation = addQuotationLine(withPrecise, quickDraft);

    expect(quotation.lines.map((line) => line.lineTotal)).toEqual([
      768_000,
      50_000,
      56_000,
      80_000,
    ]);
    expect(quotation.lines[3].quantity).toBe(3);
    expect(calculateQuotationTotal(quotation)).toBe(954_000);
  });
});
