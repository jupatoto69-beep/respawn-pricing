import {
  formatThreeDPrintingDuration,
  type ThreeDPrintingPriceCalculation,
} from "./calculate-three-d-printing-price";
import {
  getThreeDPrintingMaterialConfig,
  getThreeDPrintingModelingOption,
} from "./three-d-printing-catalog";
import type { QuotationLineDraft } from "./temporary-quotation";

export function createThreeDPrintingQuotationLineDraft(
  calculation: ThreeDPrintingPriceCalculation,
): QuotationLineDraft {
  return {
    source: "service",
    title: "Impresión 3D",
    quantity: calculation.quantity,
    details: [
      {
        label: "Material",
        value: getThreeDPrintingMaterialConfig(calculation.materialId).name,
      },
      {
        label: "Gramos por unidad",
        value: `${calculation.gramsPerUnit} g`,
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
    ],
    lineTotal: calculation.totalPrice,
  };
}
