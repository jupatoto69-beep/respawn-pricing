import { describe, expect, it } from "vitest";

import { BUSINESS_CARD_TYPE_IDS } from "./business-card-pricing";
import { calculateBusinessCardPrice } from "./calculate-business-card-price";
import { calculateFixedPriceService } from "./calculate-fixed-price-service";
import { calculateSoftwareInstallationPrice } from "./calculate-software-installation-price";
import { calculateTabloidPrice } from "./calculate-tabloid-price";
import { calculateVideoEditingPrice } from "./calculate-video-editing-price";
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

describe("service quotation-line adapter", () => {
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
});
