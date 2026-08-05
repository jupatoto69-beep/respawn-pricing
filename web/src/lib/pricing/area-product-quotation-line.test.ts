import { describe, expect, it } from "vitest";

import { BANNER_STANDARD_VARIANT_ID } from "./area-product-catalog";
import {
  createAreaProductQuotationLineDraft,
  type AreaProductQuotationLineInput,
} from "./area-product-quotation-line";
import { BANNER_STRUCTURE_OPTION_IDS } from "./banner-structure-options";
import { calculateAreaBasePrice } from "./calculate-area-base-price";
import { calculateBannerStructurePrice } from "./calculate-banner-structure-price";
import { calculateIlluminatedPanaflexSignPrice } from "./calculate-illuminated-panaflex-sign-price";
import { PANAFLEX_PRICING_OPTION_IDS } from "./panaflex-pricing-options";
import { roundUpToCop500 } from "./round-up-to-cop-500";

function createInput(
  overrides: Partial<AreaProductQuotationLineInput> = {},
): AreaProductQuotationLineInput {
  return {
    productName: "Vinilo impreso",
    variantName: "Estándar sin laminado",
    lengthCm: 100,
    widthCm: 100,
    areaM2: 1,
    quantity: 1,
    customerFacingRatePerM2: 80_000,
    usesCustomRate: false,
    bannerStructureName: null,
    panaflexPricingOptionName: null,
    panaflexMeasureClassification: null,
    panaflexStructureRatePerCm2: null,
    finalPrice: 80_000,
    ...overrides,
  };
}

describe("area-product quotation-line adapter", () => {
  it("preserves Banner 80 × 300 one-face at COP 768,000", () => {
    const areaM2 = calculateAreaBasePrice(80, 300, 1, 1);
    const finalPrice = roundUpToCop500(
      calculateBannerStructurePrice(
        areaM2,
        BANNER_STANDARD_VARIANT_ID,
        80_000,
        BANNER_STRUCTURE_OPTION_IDS.singleFace,
      ),
    );
    const line = createAreaProductQuotationLineDraft(
      createInput({
        productName: "Banner",
        lengthCm: 80,
        widthCm: 300,
        areaM2,
        bannerStructureName: "Estructura una cara",
        finalPrice,
      }),
    );

    expect(line.lineTotal).toBe(768_000);
    expect(line.quantity).toBe(1);
    expect(line.details).toContainEqual({
      label: "Estructura",
      value: "Estructura una cara",
    });
    expect(line.details).toContainEqual({
      label: "Dimensiones",
      value: "80 × 300 cm",
    });
  });

  it("preserves small double-face Panaflex at COP 267,500", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      50,
      50,
      1,
      PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace,
    );
    const line = createAreaProductQuotationLineDraft(
      createInput({
        productName: "Panaflex",
        variantName: null,
        lengthCm: 50,
        widthCm: 50,
        areaM2: calculation.areaCm2 / 10_000,
        customerFacingRatePerM2: null,
        panaflexPricingOptionName: "Aviso luminoso doble cara",
        panaflexMeasureClassification: calculation.measureClassification,
        panaflexStructureRatePerCm2: calculation.structureRate,
        finalPrice: calculation.commercialRoundedPrice,
      }),
    );

    expect(line.lineTotal).toBe(267_500);
    expect(line.details).toContainEqual({
      label: "Clasificación de medida",
      value: "Medida pequeña",
    });
    expect(line.details).toContainEqual({
      label: "Opción de Panaflex",
      value: "Aviso luminoso doble cara",
    });
  });

  it("records standard-size Panaflex without a small-measure label", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      100,
      100,
      1,
      PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace,
    );
    const line = createAreaProductQuotationLineDraft(
      createInput({
        productName: "Panaflex",
        variantName: null,
        panaflexPricingOptionName: "Aviso luminoso una cara",
        panaflexMeasureClassification: calculation.measureClassification,
        panaflexStructureRatePerCm2: calculation.structureRate,
        finalPrice: calculation.commercialRoundedPrice,
      }),
    );

    expect(line.lineTotal).toBe(340_000);
    expect(line.details).toContainEqual({
      label: "Clasificación de medida",
      value: "Medida estándar",
    });
  });

  it("uses the already rounded total for a normal area product", () => {
    const price = calculateAreaBasePrice(75, 120, 80_000, 2);
    const line = createAreaProductQuotationLineDraft(
      createInput({
        lengthCm: 75,
        widthCm: 120,
        areaM2: 0.9,
        quantity: 2,
        finalPrice: roundUpToCop500(price),
      }),
    );

    expect(line.lineTotal).toBe(144_000);
    expect(line.quantity).toBe(2);
  });

  it("identifies and preserves a customer-facing custom rate", () => {
    const line = createAreaProductQuotationLineDraft(
      createInput({
        variantName: "Tarifa personalizada (excepcional)",
        customerFacingRatePerM2: 82_345,
        usesCustomRate: true,
        finalPrice: 82_500,
      }),
    );

    expect(line.lineTotal).toBe(82_500);
    expect(line.details).toContainEqual({
      label: "Modalidad de tarifa",
      value: "Tarifa personalizada",
    });
    expect(
      line.details.find((detail) => detail.label === "Tarifa visible")?.value,
    ).toContain("82.345");
  });
});
