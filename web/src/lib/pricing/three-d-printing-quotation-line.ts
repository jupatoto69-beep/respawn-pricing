import {
  formatThreeDPrintingDuration,
  type ThreeDPrintingPriceCalculation,
} from "./calculate-three-d-printing-price";
import {
  getThreeDPrintingMaterialConfig,
  getThreeDPrintingModelingOption,
} from "./three-d-printing-catalog";
import { getThreeDPrintingColorMode } from "./three-d-printing-color-mode";
import { getThreeDPrintingPrinter } from "./three-d-printing-printer";
import type { ResolvedThreeDPrintingForm } from "./three-d-printing-selection";
import type {
  QuotationLineDetail,
  StandardQuotationLineDraft,
} from "./temporary-quotation";

export type ThreeDPrintingQuotationLineInput = Readonly<{
  calculation: ThreeDPrintingPriceCalculation;
  resolvedForm: ResolvedThreeDPrintingForm;
}>;

const measurementFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 3,
});

function createDetails(
  calculation: ThreeDPrintingPriceCalculation,
  resolvedForm: ResolvedThreeDPrintingForm,
): readonly QuotationLineDetail[] {
  return [
    {
      label: "Material",
      value: getThreeDPrintingMaterialConfig(calculation.materialId).name,
    },
    {
      label: "Gramos por unidad",
      value: `${measurementFormatter.format(calculation.gramsPerUnit)} g`,
    },
    {
      label: "Tiempo de impresión por unidad",
      value: formatThreeDPrintingDuration(
        calculation.printingHoursPerUnit,
        calculation.printingMinutesPerUnit,
      ),
    },
    {
      label: "Modelado",
      value: getThreeDPrintingModelingOption(calculation.modelingId).name,
    },
    {
      label: "Tipo de impresión",
      value: getThreeDPrintingColorMode(calculation.colorModeId).name,
    },
    {
      label: "Impresora",
      value: getThreeDPrintingPrinter(resolvedForm.printerId).name,
    },
  ];
}

export function createThreeDPrintingQuotationLineDraft({
  calculation,
  resolvedForm,
}: ThreeDPrintingQuotationLineInput): StandardQuotationLineDraft {
  const details = createDetails(calculation, resolvedForm);

  return Object.freeze({
    source: "service",
    title: "Impresión 3D",
    quantity: calculation.quantity,
    details: Object.freeze(
      details.map((detail) => Object.freeze({ ...detail })),
    ),
    lineTotal: calculation.totalPrice,
  });
}
