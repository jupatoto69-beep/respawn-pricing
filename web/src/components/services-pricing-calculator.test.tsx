import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SERVICE_CATEGORY_IDS } from "@/lib/pricing/service-catalog";
import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
} from "@/lib/pricing/three-d-printing-catalog";
import { THREE_D_PRINTING_COLOR_MODE_IDS } from "@/lib/pricing/three-d-printing-color-mode";
import { THREE_D_PRINTING_PRINTER_IDS } from "@/lib/pricing/three-d-printing-printer";
import type { ThreeDPrintingPricingFormValues } from "@/lib/pricing/three-d-printing-selection";
import { THREE_D_PRINTING_SUBMODE_IDS } from "@/lib/pricing/three-d-printing-submode";

import { ServicesPricingCalculator } from "./services-pricing-calculator";
import { ThreeDPrintingPricingCalculator } from "./three-d-printing-pricing-calculator";

const BELOW_THRESHOLD_VALUES: ThreeDPrintingPricingFormValues = {
  pricingStrategy: "three-d-printing",
  colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
  printerId: THREE_D_PRINTING_PRINTER_IDS.ke,
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

describe("top-level 3D printing workflows", () => {
  it("integrates the final precise inputs and manual-price control", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator onAddQuotationLine={() => undefined} />,
    );

    for (const visibleText of [
      "Impresión 3D",
      "Cotización precisa",
      "Estimación rápida",
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
      "Tipo de impresión",
      "Un color",
      "Multicolor",
      "Impresora",
      "KE",
      "HI",
      "Modificar precio",
    ]) {
      expect(markup).toContain(visibleText);
    }

    expect(markup).toContain('name="gramsPerUnit"');
    expect(markup).toContain('name="printingHoursPerUnit"');
    expect(markup).toContain('name="printingMinutesPerUnit"');
    expect(markup).toContain('name="printerId"');
    expect(markup).toContain('name="manualPriceEnabled"');
    expect(markup).not.toContain('name="manualPriceCop"');
    expect(markup).not.toContain('name="widthCm"');
    expect(markup).not.toContain('name="depthCm"');
    expect(markup).not.toContain('name="heightCm"');
    expect(markup).not.toContain("Dimensiones físicas");
    expect(markup).not.toContain("Impresora compatible");
    expect(markup).not.toContain("división en varias partes");
    expect(markup).not.toContain("Ligera");
    expect(markup).not.toContain("Densa");
  });

  it("renders the manual quick-total workflow without slicer or calibration controls", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator
        initialSubmodeId={THREE_D_PRINTING_SUBMODE_IDS.quick}
        onAddQuotationLine={() => undefined}
      />,
    );

    for (const visibleText of [
      "Estimación preliminar. Para determinar el precio definitivo se requiere recibir y laminar el archivo 3D.",
      "Tamaño aproximado",
      "Tipo de pieza / descripción breve",
      "Material",
      "Cantidad",
      "Modelado",
      "Tipo de impresión",
      "Un color",
      "Multicolor",
      "Precio estimado total",
      "Ingresa un valor preliminar para el trabajo completo. La cantidad ya debe estar contemplada en este total.",
      "Aceptar estimación",
      "Agregar estimación a la cotización",
    ]) {
      expect(markup).toContain(visibleText);
    }

    expect(markup).toContain('name="approximateSize"');
    expect(markup).toContain('name="pieceDescription"');
    expect(markup).toContain('name="estimatedTotalCop"');
    expect(markup).not.toContain('name="gramsPerUnit"');
    expect(markup).not.toContain('name="printingHoursPerUnit"');
    expect(markup).not.toContain('name="printingMinutesPerUnit"');
    expect(markup).not.toContain("Calcular precio");
    expect(markup).toMatch(
      /<button[^>]*disabled=""[^>]*>Agregar estimación a la cotización<\/button>/,
    );
    expect(markup).not.toContain("Ligera");
    expect(markup).not.toContain("Densa");
    expect(markup).not.toContain("calibración");
    expect(markup).not.toContain("interpolación");
  });

  it("does not render internal pricing data", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator />,
    ).toLocaleLowerCase("es-CO");

    for (const forbidden of [
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

  it("shows HI-only production and disables KE for multicolor", () => {
    const markup = renderToStaticMarkup(
      <ThreeDPrintingPricingCalculator
        initialValues={{
          ...BELOW_THRESHOLD_VALUES,
          colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
          printerId: THREE_D_PRINTING_PRINTER_IDS.hi,
          manualPriceEnabled: false,
          manualPriceCop: "",
        }}
      />,
    );

    expect(markup).toContain("Multicolor se produce únicamente en HI.");
    expect(markup).toMatch(/value="ke" disabled=""/);
    expect(markup).toContain('value="hi" selected=""');
    expect(markup).not.toContain("límite Z");
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

  it("shows only the safe authorization warning for a sub-threshold price", () => {
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
