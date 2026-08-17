import { describe, expect, it } from "vitest";

import { BUSINESS_CARD_TYPE_IDS } from "./business-card-pricing";
import { calculateBusinessCardPrice } from "./calculate-business-card-price";
import { calculateFixedPriceService } from "./calculate-fixed-price-service";
import { calculateSoftwareInstallationPrice } from "./calculate-software-installation-price";
import { calculateTabloidPrice } from "./calculate-tabloid-price";
import { calculateVideoEditingPrice } from "./calculate-video-editing-price";
import { calculateThreeDPrintingPrice } from "./calculate-three-d-printing-price";
import {
  COMPUTER_SERVICE_IDS,
  getComputerService,
} from "./computer-service-catalog";
import {
  BUSINESS_CARD_SERVICE,
  TABLOID_SERVICE,
} from "./printed-service-catalog";
import {
  calculateMaintenancePrice,
  COMPLETE_MAINTENANCE_UNIT_PRICE,
} from "./resolve-maintenance-price";
import {
  createServiceQuotationLineDraft,
  type ServiceCalculationResult,
} from "./service-quotation-line";
import {
  getServiceCategory,
  SERVICE_CATEGORY_IDS,
  SIMPLE_VIDEO_EDITING_SERVICE,
} from "./service-catalog";
import {
  TABLOID_ADHESIVE_FINISH_IDS,
  TABLOID_TYPE_IDS,
} from "./tabloid-pricing";
import { parseVideoDuration } from "./video-duration";
import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
} from "./three-d-printing-catalog";
import { THREE_D_PRINTING_COLOR_MODE_IDS } from "./three-d-printing-color-mode";
import { THREE_D_PRINTING_PRINTER_IDS } from "./three-d-printing-printer";
import { createThreeDPrintingQuotationLineDraft } from "./three-d-printing-quotation-line";
import {
  createInitialThreeDPrintingPricingFormValues,
  resolveThreeDPrintingPricingFormValues,
} from "./three-d-printing-selection";
import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
} from "./temporary-quotation";

const computers = getServiceCategory(SERVICE_CATEGORY_IDS.computers)!;
const audiovisual = getServiceCategory(SERVICE_CATEGORY_IDS.audiovisual)!;
const printed = getServiceCategory(SERVICE_CATEGORY_IDS.printedProducts)!;

function expectNoPrivateMinimum(line: ReturnType<typeof createServiceQuotationLineDraft>) {
  const serializedDetails = JSON.stringify(line.details).toLocaleLowerCase(
    "es-CO",
  );

  expect(serializedDetails).not.toContain("mínimo");
  expect(serializedDetails).not.toContain("minimum");
  expect(serializedDetails).not.toContain("authorizedminimum");
}

function expectNoThreeDInternalPricing(
  value: ReturnType<typeof createServiceQuotationLineDraft> | object,
) {
  const serialized = JSON.stringify(value).toLocaleLowerCase("es-CO");

  for (const forbidden of [
    "basecost",
    "base cost",
    "costo base",
    "internal",
    "threshold",
    "umbral",
    "spool",
    "rollo",
    "margin",
    "margen",
    "electricity",
    "electricidad",
    "tarifa",
    "multiplier",
    "multiplicador",
    "+40%",
    "×3",
    "×4",
    "autorizado",
    "requiere autorización",
    "belowthresholdauthorized",
    "authorizationthresholdraw",
    "suggestedpriceraw",
    "dimensiones",
    "compatible",
    "división",
    "categoría",
    "impresos",
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
}

describe("quotation-line adapters", () => {
  it("preserves complete maintenance at COP 120,000", () => {
    const service = getComputerService(COMPUTER_SERVICE_IDS.maintenance)!;
    const calculation = calculateMaintenancePrice(
      { physical: true, system: true },
      1,
    )!;
    const line = createServiceQuotationLineDraft({
      pricingStrategy: "maintenance-selection",
      category: computers,
      service: service as Extract<
        typeof service,
        { pricingStrategy: "maintenance-selection" }
      >,
      calculation,
    });

    expect(calculation.unitPrice).toBe(COMPLETE_MAINTENANCE_UNIT_PRICE);
    expect(line.lineTotal).toBe(120_000);
    expect(line.details).toContainEqual({
      label: "Paquete",
      value: "Mantenimiento completo",
    });
  });

  it("preserves an exact fixed-price service total", () => {
    const service = getComputerService(
      COMPUTER_SERVICE_IDS.officeInstallation,
    )!;
    const line = createServiceQuotationLineDraft({
      pricingStrategy: "fixed-price",
      category: computers,
      service: service as Extract<
        typeof service,
        { pricingStrategy: "fixed-price" }
      >,
      calculation: calculateFixedPriceService(
        COMPUTER_SERVICE_IDS.officeInstallation,
        2,
      ),
    });

    expect(line.quantity).toBe(2);
    expect(line.lineTotal).toBe(100_000);
  });

  it("preserves the software-installation quantity tier total", () => {
    const service = getComputerService(
      COMPUTER_SERVICE_IDS.softwareInstallation,
    )!;
    const line = createServiceQuotationLineDraft({
      pricingStrategy: "quantity-tier",
      category: computers,
      service: service as Extract<
        typeof service,
        { pricingStrategy: "quantity-tier" }
      >,
      calculation: calculateSoftwareInstallationPrice(2),
    });

    expect(line.quantity).toBe(2);
    expect(line.lineTotal).toBe(100_000);
    expect(line.details).toContainEqual({
      label: "Nivel comercial",
      value: "Precio desde dos programas",
    });
  });

  it("preserves video 3:35 at COP 140,000", () => {
    const line = createServiceQuotationLineDraft({
      pricingStrategy: "duration",
      category: audiovisual,
      service: SIMPLE_VIDEO_EDITING_SERVICE,
      calculation: calculateVideoEditingPrice(
        parseVideoDuration({ minutes: "3", seconds: "35" }),
      ),
    });

    expect(line.quantity).toBe(1);
    expect(line.lineTotal).toBe(140_000);
    expect(line.details).toContainEqual({
      label: "Duración ingresada",
      value: "3:35",
    });
    expect(line.details).toContainEqual({
      label: "Minutos facturables",
      value: "4",
    });
  });

  it("adapts automatic business cards without exposing minimums", () => {
    const line = createServiceQuotationLineDraft({
      pricingStrategy: "business-card-pricing",
      category: printed,
      service: BUSINESS_CARD_SERVICE,
      calculation: calculateBusinessCardPrice({
        cardType: BUSINESS_CARD_TYPE_IDS.glossy,
        quantityInThousands: 2,
        negotiatedUnitPrice: null,
        belowMinimumConfirmed: false,
      }),
    });

    expect(line.quantity).toBe(2);
    expect(line.lineTotal).toBe(170_000);
    expect(line.details).toContainEqual({
      label: "Modalidad de precio",
      value: "Precio automático",
    });
    expectNoPrivateMinimum(line);
  });

  it("adapts confirmed negotiated business cards with a safe label", () => {
    const line = createServiceQuotationLineDraft({
      pricingStrategy: "business-card-pricing",
      category: printed,
      service: BUSINESS_CARD_SERVICE,
      calculation: calculateBusinessCardPrice({
        cardType: BUSINESS_CARD_TYPE_IDS.glossy,
        quantityInThousands: 1,
        negotiatedUnitPrice: 79_000,
        belowMinimumConfirmed: true,
      }),
    });

    expect(line.lineTotal).toBe(79_000);
    expect(line.details).toContainEqual({
      label: "Modalidad de precio",
      value: "Precio negociado autorizado",
    });
    expectNoPrivateMinimum(line);
  });

  it("adapts automatic laminated pre-cut Tabloids at COP 125,000", () => {
    const line = createServiceQuotationLineDraft({
      pricingStrategy: "tabloid-pricing",
      category: printed,
      service: TABLOID_SERVICE,
      calculation: calculateTabloidPrice({
        tabloidType: TABLOID_TYPE_IDS.adhesive,
        adhesiveFinish: TABLOID_ADHESIVE_FINISH_IDS.preCut,
        quantity: 5,
        negotiatedBaseUnitPrice: null,
        belowMinimumConfirmed: false,
        isLaminated: true,
      }),
    });

    expect(line.quantity).toBe(5);
    expect(line.lineTotal).toBe(125_000);
    expect(line.details).toContainEqual({
      label: "Acabado adhesivo",
      value: "Adhesivo precortado",
    });
    expect(line.details).toContainEqual({ label: "Laminado", value: "Sí" });
    expectNoPrivateMinimum(line);
  });

  it("adapts confirmed negotiated Tabloids without exposing minimums", () => {
    const result: ServiceCalculationResult = {
      pricingStrategy: "tabloid-pricing",
      category: printed,
      service: TABLOID_SERVICE,
      calculation: calculateTabloidPrice({
        tabloidType: TABLOID_TYPE_IDS.adhesive,
        adhesiveFinish: TABLOID_ADHESIVE_FINISH_IDS.preCut,
        quantity: 5,
        negotiatedBaseUnitPrice: 19_000,
        belowMinimumConfirmed: true,
        isLaminated: false,
      }),
    };
    const line = createServiceQuotationLineDraft(result);

    expect(line.lineTotal).toBe(95_000);
    expect(line.details).toContainEqual({
      label: "Modalidad de precio",
      value: "Precio negociado autorizado",
    });
    expectNoPrivateMinimum(line);
  });

  it("creates a customer-safe immutable 3D printing snapshot", () => {
    const resolvedForm = resolveThreeDPrintingPricingFormValues({
      ...createInitialThreeDPrintingPricingFormValues(),
      materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
      gramsPerUnit: "100",
      printingHoursPerUnit: "5",
      printingMinutesPerUnit: "30",
      printerId: THREE_D_PRINTING_PRINTER_IDS.hi,
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
    const stored = quotation.lines[0];

    expect(draft).toEqual({
      source: "service",
      title: "Impresión 3D",
      quantity: 3,
      details: [
        { label: "Material", value: "PLA" },
        { label: "Gramos por unidad", value: "100 g" },
        { label: "Tiempo de impresión por unidad", value: "5 h 30 min" },
        { label: "Modelado", value: "Diseño básico" },
        { label: "Tipo de impresión", value: "Un color" },
        { label: "Impresora", value: "HI" },
      ],
      lineTotal: calculation.totalPrice,
    });
    expect(stored.lineTotal).toBe(calculation.totalPrice);
    expect(stored.lineTotal).toBe(190_500);
    expect(calculateQuotationTotal(quotation)).toBe(stored.lineTotal);
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored.details)).toBe(true);
    expectNoThreeDInternalPricing(draft);
    expectNoThreeDInternalPricing(stored);
  });

  it("stores the selected HI production printer for multicolor", () => {
    const resolvedForm = resolveThreeDPrintingPricingFormValues({
      ...createInitialThreeDPrintingPricingFormValues(),
      colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
      printerId: THREE_D_PRINTING_PRINTER_IDS.hi,
      materialId: THREE_D_PRINTING_MATERIAL_IDS.petg,
      gramsPerUnit: "100",
      printingHoursPerUnit: "5",
      printingMinutesPerUnit: "0",
    });
    const calculation = calculateThreeDPrintingPrice(
      resolvedForm.pricingInput,
    );
    const draft = createThreeDPrintingQuotationLineDraft({
      calculation,
      resolvedForm,
    });
    const stored = addQuotationLine(createEmptyQuotation(), draft).lines[0];

    expect(stored.details).toEqual([
      { label: "Material", value: "PETG" },
      { label: "Gramos por unidad", value: "100 g" },
      { label: "Tiempo de impresión por unidad", value: "5 h" },
      { label: "Modelado", value: "Sin modelado" },
      { label: "Tipo de impresión", value: "Multicolor" },
      { label: "Impresora", value: "HI" },
    ]);
    expect(stored.lineTotal).toBe(168_000);
    expect(stored.lineTotal).toBe(calculation.totalPrice);
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored.details)).toBe(true);
    expectNoThreeDInternalPricing(stored);
  });

  it("keeps the accepted 3D line price after later inputs produce another result", () => {
    const firstResolvedForm = resolveThreeDPrintingPricingFormValues({
      ...createInitialThreeDPrintingPricingFormValues(),
      materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
      gramsPerUnit: "100",
      printingHoursPerUnit: "5",
      printingMinutesPerUnit: "0",
      quantity: "1",
      modelingId: THREE_D_PRINTING_MODELING_IDS.none,
    });
    const first = calculateThreeDPrintingPrice(
      firstResolvedForm.pricingInput,
    );
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createThreeDPrintingQuotationLineDraft({
        calculation: first,
        resolvedForm: firstResolvedForm,
      }),
    );
    const later = calculateThreeDPrintingPrice({
      materialId: THREE_D_PRINTING_MATERIAL_IDS.petg,
      colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
      gramsPerUnit: 500,
      printingHoursPerUnit: 20,
      printingMinutesPerUnit: 45,
      quantity: 4,
      modelingId: THREE_D_PRINTING_MODELING_IDS.complex,
      manualPrice: {
        enabled: false,
        amountCop: null,
        belowThresholdAuthorized: false,
      },
    });

    expect(first.totalPrice).not.toBe(later.totalPrice);
    expect(quotation.lines[0].lineTotal).toBe(first.totalPrice);
    expect(quotation.lines[0].details).toContainEqual({
      label: "Material",
      value: "PLA",
    });
  });
});
