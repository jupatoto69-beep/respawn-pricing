import { describe, expect, it } from "vitest";

import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
  removeQuotationLine,
  updateQuotationDetails,
  type QuotationLineDraft,
  type TemporaryQuotationState,
} from "@/lib/pricing/temporary-quotation";
import { calculateThreeDPrintingPrice } from "@/lib/pricing/calculate-three-d-printing-price";
import {
  calculateCutVinylColorGroupPrice,
  createCutVinylColorGroupPricing,
} from "@/lib/pricing/cut-vinyl-color-group";
import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
} from "@/lib/pricing/three-d-printing-catalog";
import { THREE_D_PRINTING_COLOR_MODE_IDS } from "@/lib/pricing/three-d-printing-color-mode";
import { THREE_D_PRINTING_PRINTER_IDS } from "@/lib/pricing/three-d-printing-printer";
import { createThreeDPrintingQuickQuotationLineDraft } from "@/lib/pricing/three-d-printing-quick-quotation-line";
import {
  createInitialThreeDPrintingQuickFormValues,
  resolveThreeDPrintingQuickFormValues,
  THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION,
} from "@/lib/pricing/three-d-printing-quick-selection";
import { createThreeDPrintingQuotationLineDraft } from "@/lib/pricing/three-d-printing-quotation-line";
import {
  createInitialThreeDPrintingPricingFormValues,
  resolveThreeDPrintingPricingFormValues,
} from "@/lib/pricing/three-d-printing-selection";

import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "./business-profile";
import {
  createQuotationPreviewViewModel,
  formatQuotationCop,
} from "./quotation-preview-view-model";

function createDraft(
  overrides: Partial<QuotationLineDraft> = {},
): QuotationLineDraft {
  return {
    source: "area-product",
    title: "Banner",
    quantity: 1,
    details: [
      { label: "Producto", value: "Banner" },
      { label: "Dimensiones", value: "80 × 300 cm" },
    ],
    lineTotal: 768_000,
    ...overrides,
  };
}

function createCutVinylDraft(
  subtotalBeforeMinimumAndRounding: number,
): QuotationLineDraft {
  const commercialGroup = createCutVinylColorGroupPricing(
    "cut-vinyl",
    "Rojo",
    subtotalBeforeMinimumAndRounding,
  );

  if (commercialGroup === null) {
    throw new Error("Expected Cut vinyl group pricing.");
  }

  return {
    source: "area-product",
    title: "Vinilo de corte",
    quantity: 1,
    details: [
      { label: "Producto", value: "Vinilo de corte" },
      { label: "Color", value: "Rojo" },
    ],
    lineTotal: calculateCutVinylColorGroupPrice([
      subtotalBeforeMinimumAndRounding,
    ]).roundedTotal,
    commercialGroup,
  };
}

function createPreview(quotation: TemporaryQuotationState) {
  return createQuotationPreviewViewModel({
    quotation,
    total: calculateQuotationTotal(quotation),
    businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
  });
}

describe("quotation preview view-model", () => {
  it("selects both official logo variants without mutating the profile", () => {
    const before = JSON.stringify(DIGITAL_RESPAWN_BUSINESS_PROFILE);
    const preview = createPreview(createEmptyQuotation());

    expect(preview.logoOnDarkPath).toBe(
      "/brand/digital-respawn-logo-white.png",
    );
    expect(preview.logoOnLightPath).toBe(
      "/brand/digital-respawn-logo-black.png",
    );
    expect(JSON.stringify(DIGITAL_RESPAWN_BUSINESS_PROFILE)).toBe(before);
  });

  it("preserves stored line order and duplicate lines", () => {
    const first = addQuotationLine(createEmptyQuotation(), createDraft());
    const second = addQuotationLine(
      first,
      createDraft({ source: "service", title: "Servicio", lineTotal: 70_000 }),
    );
    const quotation = addQuotationLine(second, createDraft());

    expect(createPreview(quotation).lines.map((line) => line.title)).toEqual([
      "Banner",
      "Servicio",
      "Banner",
    ]);
  });

  it("excludes removed lines and keeps remaining stored totals", () => {
    const first = addQuotationLine(createEmptyQuotation(), createDraft());
    const second = addQuotationLine(
      first,
      createDraft({ title: "Mantenimiento", lineTotal: 120_000 }),
    );
    const quotation = removeQuotationLine(second, "quotation-line-1");
    const preview = createPreview(quotation);

    expect(preview.lines).toHaveLength(1);
    expect(preview.lines[0].title).toBe("Mantenimiento");
    expect(preview.lines[0].lineTotal).toBe(120_000);
  });

  it("uses exact stored line totals and the exact existing quotation total", () => {
    const first = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ quantity: 9, lineTotal: 100_001 }),
    );
    const quotation = addQuotationLine(
      first,
      createDraft({
        source: "service",
        title: "Servicio",
        quantity: 4,
        lineTotal: 267_500,
      }),
    );
    const preview = createPreview(quotation);

    expect(preview.lines.map((line) => line.lineTotal)).toEqual([
      100_001,
      267_500,
    ]);
    expect(preview.total).toBe(367_501);
    expect(preview.total).toBe(calculateQuotationTotal(quotation));
  });

  it("formats line and grand totals as COP consistently", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ lineTotal: 768_000 }),
    );
    const preview = createPreview(quotation);

    expect(formatQuotationCop(768_000)).toBe("COP 768.000");
    expect(preview.lines[0].formattedLineTotal).toBe("COP 768.000");
    expect(preview.formattedTotal).toBe("COP 768.000");
  });

  it("presents the frozen Fecha and configured Vigencia without replacing the date", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createDraft(),
      new Date(2026, 7, 9, 23, 59, 59),
    );
    const frozenDate = quotation.quotationDate;
    const before = JSON.stringify(quotation);
    const firstPreview = createPreview(quotation);
    const secondPreview = createPreview(quotation);

    expect(firstPreview.quotationFields).toEqual([
      { label: "Fecha", value: "09/08/2026" },
      { label: "Vigencia", value: "15 días" },
    ]);
    expect(secondPreview.quotationFields).toEqual(
      firstPreview.quotationFields,
    );
    expect(quotation.quotationDate).toBe(frozenDate);
    expect(JSON.stringify(quotation)).toBe(before);
  });

  it("formats a stored Colombian phone and omits it when the number is empty", () => {
    const withPhone = updateQuotationDetails(createEmptyQuotation(), {
      customerPhoneCountryIso2: "CO",
      customerPhoneNumber: "3229699093",
    });
    const withoutPhone = updateQuotationDetails(createEmptyQuotation(), {
      customerPhoneCountryIso2: "ES",
      customerPhoneNumber: "",
    });

    expect(createPreview(withPhone).customerFields).toContainEqual({
      label: "Teléfono",
      value: "+57 3229699093",
    });
    expect(
      createPreview(withoutPhone).customerFields.some(
        (field) => field.label === "Teléfono",
      ),
    ).toBe(false);
  });

  it("omits the whole customer block model when every field is empty", () => {
    expect(createPreview(createEmptyQuotation()).customerFields).toEqual([]);
  });

  it("omits empty customer fields individually and preserves document formatting", () => {
    const quotation = updateQuotationDetails(createEmptyQuotation(), {
      customerName: "Empresa Ejemplo SAS",
      customerDocument: "0900123456-7",
      customerEmail: "",
      customerCity: "   ",
    });

    expect(createPreview(quotation).customerFields).toEqual([
      { label: "Nombre o empresa", value: "Empresa Ejemplo SAS" },
      { label: "Documento o NIT", value: "0900123456-7" },
    ]);
  });

  it("preserves multiline notes and omits whitespace-only notes", () => {
    const multiline = updateQuotationDetails(createEmptyQuotation(), {
      notes: "Primera línea\n\nÚltima línea",
    });
    const whitespace = updateQuotationDetails(createEmptyQuotation(), {
      notes: " \n\t ",
    });

    expect(createPreview(multiline).notes).toBe(
      "Primera línea\n\nÚltima línea",
    );
    expect(createPreview(whitespace).notes).toBeNull();
  });

  it("does not expose line IDs or internal commercial fields", () => {
    const internalLine = {
      id: "quotation-line-77",
      source: "service" as const,
      title: "Servicio de ejemplo",
      quantity: 1,
      details: [
        { label: "Servicio", value: "Servicio de ejemplo" },
        { label: "Costo interno", value: "COP 1" },
        { label: "Margen", value: "99%" },
        { label: "Proveedor", value: "Proveedor interno" },
        { label: "Mínimo autorizado", value: "COP 2" },
        { label: "Descuento máximo", value: "50%" },
        { label: "Modalidad de precio", value: "Precio negociado autorizado" },
      ],
      lineTotal: 70_000,
      internalCost: 1,
      margin: 0.99,
      supplier: "Proveedor interno",
      authorizedMinimum: 2,
      maximumDiscount: 0.5,
    };
    const quotation: TemporaryQuotationState = {
      ...createEmptyQuotation(),
      lines: [internalLine],
      nextLineSequence: 78,
    };
    const serialized = JSON.stringify(createPreview(quotation));

    expect(serialized).toContain("Servicio de ejemplo");
    expect(serialized).not.toContain("quotation-line-77");
    expect(serialized).not.toContain("internalCost");
    expect(serialized).not.toContain("Costo interno");
    expect(serialized).not.toContain("Margen");
    expect(serialized).not.toContain("Proveedor");
    expect(serialized).not.toContain("Mínimo autorizado");
    expect(serialized).not.toContain("Descuento máximo");
    expect(serialized).not.toContain("Precio negociado autorizado");
  });

  it("shows the Cut vinyl color but not its technical grouping metadata", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft(4_000),
    );
    const preview = createPreview(quotation);
    const serialized = JSON.stringify(preview);

    expect(preview.lines[0].details).toContainEqual({
      label: "Color",
      value: "Rojo",
    });
    expect(serialized).not.toContain("cut-vinyl:rojo");
    expect(serialized).not.toContain("subtotalBeforeMinimumAndRounding");
    expect(preview.total).toBe(15_000);
  });

  it("preserves exact non-COP-500 Cut vinyl contributions in preview data", () => {
    const first = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft(4_000),
    );
    const second = addQuotationLine(first, createCutVinylDraft(6_000));
    const quotation = addQuotationLine(second, createCutVinylDraft(3_000));
    const preview = createPreview(quotation);

    expect(preview.lines.map((line) => line.lineTotal)).toEqual([
      4_615, 6_923, 3_462,
    ]);
    expect(preview.lines.map((line) => line.formattedLineTotal)).toEqual([
      "COP 4.615",
      "COP 6.923",
      "COP 3.462",
    ]);
    expect(preview.total).toBe(15_000);
    expect(preview.formattedTotal).toBe("COP 15.000");
  });

  it("projects the immutable precise printer snapshot without internal pricing", () => {
    const resolvedForm = resolveThreeDPrintingPricingFormValues({
      ...createInitialThreeDPrintingPricingFormValues(),
      colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
      printerId: THREE_D_PRINTING_PRINTER_IDS.hi,
      materialId: THREE_D_PRINTING_MATERIAL_IDS.petg,
      gramsPerUnit: "100",
      printingHoursPerUnit: "1",
      printingMinutesPerUnit: "30",
      quantity: "3",
      modelingId: THREE_D_PRINTING_MODELING_IDS.basic,
      manualPriceEnabled: true,
      manualPriceCop: "190100",
      belowThresholdAuthorized: true,
    });
    const calculation = calculateThreeDPrintingPrice(
      resolvedForm.pricingInput,
    );
    const draft = createThreeDPrintingQuotationLineDraft({
      calculation,
      resolvedForm,
    });
    const quotation = addQuotationLine(createEmptyQuotation(), draft);
    const preview = createPreview(quotation);
    const serialized = JSON.stringify(preview).toLocaleLowerCase("es-CO");

    expect(preview.lines).toEqual([
      {
        title: "Impresión 3D",
        details: [
          { label: "Material", value: "PETG" },
          { label: "Gramos por unidad", value: "100 g" },
          { label: "Tiempo de impresión por unidad", value: "1 h 30 min" },
          { label: "Modelado", value: "Diseño básico" },
          { label: "Tipo de impresión", value: "Multicolor" },
          { label: "Impresora", value: "HI" },
        ],
        quantity: 3,
        lineTotal: calculation.totalPrice,
        formattedLineTotal: formatQuotationCop(calculation.totalPrice),
      },
    ]);
    expect(calculation.totalPrice).toBe(190_500);

    for (const forbidden of [
      "basecost",
      "internal",
      "threshold",
      "spool",
      "materialincreaserate",
      "electricity",
      "multiplier",
      "belowthresholdauthorized",
      "authorizationthresholdraw",
      "suggestedpriceraw",
      "dimensiones",
      "compatible",
      "división",
      "estimación preliminar",
      "costo base",
      "margen",
      "umbral",
      "precio del rollo",
      "tarifa eléctrica",
      "+40%",
      "×3",
      "×4",
      "autorizado",
      "requiere autorización",
      "categoría",
      "impresos",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("projects a distinct immutable quick estimate with its line warning", () => {
    const draft = createThreeDPrintingQuickQuotationLineDraft(
      resolveThreeDPrintingQuickFormValues({
        ...createInitialThreeDPrintingQuickFormValues(),
        approximateSize: "15 cm",
        pieceDescription: "Figura decorativa",
        quantity: "3",
        modelingId: THREE_D_PRINTING_MODELING_IDS.aiAssisted,
        colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
        estimatedTotalCop: "80000",
      }),
    );
    const quotation = addQuotationLine(createEmptyQuotation(), draft);
    const preview = createPreview(quotation);
    const serialized = JSON.stringify(preview).toLocaleLowerCase("es-CO");

    expect(preview.lines).toEqual([
      {
        title: "Impresión 3D — Estimación preliminar",
        details: [
          { label: "Tipo", value: "Estimación preliminar" },
          { label: "Tamaño aproximado", value: "15 cm" },
          { label: "Descripción", value: "Figura decorativa" },
          { label: "Material", value: "PLA" },
          { label: "Modelado", value: "Modelo con IA / asistido por IA" },
          { label: "Tipo de impresión", value: "Multicolor" },
          { label: "Producción", value: "HI" },
          { label: "Condición", value: THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION },
        ],
        quantity: 3,
        lineTotal: 80_000,
        formattedLineTotal: formatQuotationCop(80_000),
      },
    ]);

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
  });

  it("creates a deeply immutable presentation model without mutating the quotation", () => {
    const quotation = addQuotationLine(
      updateQuotationDetails(createEmptyQuotation(), {
        customerName: "Empresa Ejemplo SAS",
        notes: "Entregar la próxima semana.",
      }),
      createDraft(),
    );
    const before = JSON.stringify(quotation);
    const preview = createPreview(quotation);

    expect(JSON.stringify(quotation)).toBe(before);
    expect(Object.isFrozen(preview)).toBe(true);
    expect(Object.isFrozen(preview.quotationFields)).toBe(true);
    expect(Object.isFrozen(preview.quotationFields[0])).toBe(true);
    expect(Object.isFrozen(preview.customerFields)).toBe(true);
    expect(Object.isFrozen(preview.customerFields[0])).toBe(true);
    expect(Object.isFrozen(preview.lines)).toBe(true);
    expect(Object.isFrozen(preview.lines[0])).toBe(true);
    expect(Object.isFrozen(preview.lines[0].details)).toBe(true);
    expect(quotation.lines[0].id).toBe("quotation-line-1");
    expect(quotation.nextLineSequence).toBe(2);
  });

  it("keeps a product and a service at their exact combined stored total", () => {
    const banner = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ lineTotal: 768_000 }),
    );
    const quotation = addQuotationLine(
      banner,
      createDraft({
        source: "service",
        title: "Mantenimiento completo",
        details: [{ label: "Paquete", value: "Mantenimiento completo" }],
        lineTotal: 120_000,
      }),
    );

    expect(createPreview(quotation).total).toBe(888_000);
  });

  it("keeps Banner 80 × 300 plus Office-only installation at COP 818,000", () => {
    const banner = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ lineTotal: 768_000 }),
    );
    const quotation = addQuotationLine(
      banner,
      createDraft({
        source: "service",
        title: "Instalación de Office únicamente",
        details: [
          { label: "Servicio", value: "Instalación de Office únicamente" },
        ],
        lineTotal: 50_000,
      }),
    );
    const preview = createPreview(quotation);

    expect(preview.lines.map((line) => line.lineTotal)).toEqual([
      768_000,
      50_000,
    ]);
    expect(preview.total).toBe(818_000);
    expect(preview.formattedTotal).toBe("COP 818.000");
  });
});
