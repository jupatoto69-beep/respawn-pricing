import {
  getThreeDPrintingMaterialConfig,
  getThreeDPrintingModelingOption,
} from "./three-d-printing-catalog";
import {
  getThreeDPrintingColorMode,
  THREE_D_PRINTING_COLOR_MODE_IDS,
} from "./three-d-printing-color-mode";
import { getThreeDPrintingPrinter, THREE_D_PRINTING_PRINTER_IDS } from "./three-d-printing-printer";
import {
  THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION,
  type ResolvedThreeDPrintingQuickForm,
} from "./three-d-printing-quick-selection";
import type {
  QuotationLineDetail,
  QuotationLineDraft,
} from "./temporary-quotation";

export function createThreeDPrintingQuickQuotationLineDraft(
  resolvedForm: ResolvedThreeDPrintingQuickForm,
): QuotationLineDraft {
  const details: QuotationLineDetail[] = [
    { label: "Tipo", value: "Estimación preliminar" },
    { label: "Tamaño aproximado", value: resolvedForm.approximateSize },
    { label: "Descripción", value: resolvedForm.pieceDescription },
    {
      label: "Material",
      value: getThreeDPrintingMaterialConfig(resolvedForm.materialId).name,
    },
    {
      label: "Modelado",
      value: getThreeDPrintingModelingOption(resolvedForm.modelingId).name,
    },
    {
      label: "Tipo de impresión",
      value: getThreeDPrintingColorMode(resolvedForm.colorModeId).name,
    },
  ];

  if (
    resolvedForm.colorModeId === THREE_D_PRINTING_COLOR_MODE_IDS.multicolor
  ) {
    details.push({
      label: "Producción",
      value: getThreeDPrintingPrinter(THREE_D_PRINTING_PRINTER_IDS.hi).name,
    });
  }

  details.push({
    label: "Condición",
    value: THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION,
  });

  return Object.freeze({
    source: "service",
    title: "Impresión 3D — Estimación preliminar",
    quantity: resolvedForm.quantity,
    details: Object.freeze(
      details.map((detail) => Object.freeze({ ...detail })),
    ),
    // The employee-entered amount already covers every requested unit.
    lineTotal: resolvedForm.acceptedEstimatedTotal,
  });
}
