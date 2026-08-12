import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SERVICE_CATEGORY_IDS } from "@/lib/pricing/service-catalog";
import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
} from "@/lib/pricing/three-d-printing-catalog";
import type { ThreeDPrintingPricingFormValues } from "@/lib/pricing/three-d-printing-selection";

import { ServicesPricingCalculator } from "./services-pricing-calculator";
import { ThreeDPrintingPricingCalculator } from "./three-d-printing-pricing-calculator";

const BELOW_THRESHOLD_VALUES: ThreeDPrintingPricingFormValues = {
  pricingStrategy: "three-d-printing",
  materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
  gramsPerUnit: "100",
  printingHoursPerUnit: "1",
  printingMinutesPerUnit: "30",
  quantity: "3",
  modelingId: THREE_D_PRINTING_MODELING_IDS.basic,
  manualPriceEnabled: true,
  manualPriceCop: "190000",
  belowThresholdAuthorized: false,
};

describe("top-level precise 3D printing form", () => {
  it("integrates every precise input and the explicit manual-price control", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator onAddQuotationLine={() => undefined} />,
    );

    for (const visibleText of [
      "Impresión 3D",
      "Material",
      "PLA",
      "PETG",
      "Gramos por unidad",
      "Horas de impresión por unidad",
      "Minutos de impresión por unidad",
      "Cantidad",
      "Modelado",
      "Sin modelado",
      "Modelo con IA / asistido por IA",
      "Diseño básico",
      "Diseño complejo",
      "Modificar precio",
    ]) {
      expect(markup).toContain(visibleText);
    }

    expect(markup).toContain('name="gramsPerUnit"');
    expect(markup).toContain('name="printingHoursPerUnit"');
    expect(markup).toContain('name="printingMinutesPerUnit"');
    expect(markup).toContain('name="manualPriceEnabled"');
    expect(markup).not.toContain('name="manualPriceCop"');
  });

  it("does not render quick-estimation dimensions or internal pricing data", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator />,
    ).toLocaleLowerCase("es-CO");

    for (const forbidden of [
      "largo",
      "ancho",
      "alto",
      "volumen",
      "densidad",
      "95.000",
      "150 w",
      "900/kwh",
      "costo base",
      "costo de material",
      "costo eléctrico",
      "precio del rollo",
      "margen",
      "umbral",
      "+40%",
      "×3",
      "×4",
    ]) {
      expect(markup).not.toContain(forbidden);
    }
  });

  it("is absent from Services -> Impresos", () => {
    const markup = renderToStaticMarkup(
      <ServicesPricingCalculator
        initialCategoryId={SERVICE_CATEGORY_IDS.printedProducts}
      />,
    );

    expect(markup).toContain("Tarjetas de presentación");
    expect(markup).toContain("Tabloides");
    expect(markup).not.toContain("Impresión 3D");
    expect(markup).not.toContain('value="three-d-printing"');
  });

  it("shows only the safe authorization warning for a valid sub-threshold price", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator initialValues={BELOW_THRESHOLD_VALUES} />,
    );

    expect(markup).toContain("Este precio requiere autorización.");
    expect(markup).toContain("Confirmo que este precio está autorizado");
    expect(markup).toContain('name="belowThresholdAuthorized"');
  });

  it("does not offer authorization for the absolute minimum violation", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator
        initialValues={{ ...BELOW_THRESHOLD_VALUES, manualPriceCop: "4999" }}
      />,
    );

    expect(markup).not.toContain("Este precio requiere autorización.");
    expect(markup).not.toContain("Confirmo que este precio está autorizado");
  });

  it("does not ask for authorization at or above the raw threshold", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator
        initialValues={{ ...BELOW_THRESHOLD_VALUES, manualPriceCop: "200000" }}
      />,
    );

    expect(markup).not.toContain("Este precio requiere autorización.");
    expect(markup).not.toContain("Confirmo que este precio está autorizado");
  });
});
