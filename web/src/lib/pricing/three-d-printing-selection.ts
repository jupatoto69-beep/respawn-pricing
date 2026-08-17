import type { ThreeDPrintingPricingInput } from "./calculate-three-d-printing-price";
import {
  isThreeDPrintingMaterialId,
  isThreeDPrintingModelingId,
  THREE_D_PRINTING_MODELING_IDS,
  type ThreeDPrintingMaterialId,
  type ThreeDPrintingModelingId,
} from "./three-d-printing-catalog";
import {
  isThreeDPrintingColorModeId,
  THREE_D_PRINTING_COLOR_MODE_IDS,
  type ThreeDPrintingColorModeId,
} from "./three-d-printing-color-mode";
import {
  getThreeDPrintingPrinter,
  isThreeDPrintingPrinterAllowed,
  isThreeDPrintingPrinterId,
  resolveThreeDPrintingProductionPrinter,
  THREE_D_PRINTING_PRINTER_IDS,
  type ThreeDPrintingPrinterId,
} from "./three-d-printing-printer";

export type ThreeDPrintingPricingFormValues = Readonly<{
  pricingStrategy: "three-d-printing";
  colorModeId: ThreeDPrintingColorModeId;
  printerId: ThreeDPrintingPrinterId;
  materialId: ThreeDPrintingMaterialId | "";
  gramsPerUnit: string;
  printingHoursPerUnit: string;
  printingMinutesPerUnit: string;
  quantity: string;
  modelingId: ThreeDPrintingModelingId;
  manualPriceEnabled: boolean;
  manualPriceCop: string;
  belowThresholdAuthorized: boolean;
}>;

export type ThreeDPrintingTextField =
  | "gramsPerUnit"
  | "printingHoursPerUnit"
  | "printingMinutesPerUnit"
  | "quantity"
  | "manualPriceCop";

export type ResolvedThreeDPrintingForm = Readonly<{
  pricingInput: ThreeDPrintingPricingInput;
  printerId: ThreeDPrintingPrinterId;
}>;

export function createInitialThreeDPrintingPricingFormValues(): ThreeDPrintingPricingFormValues {
  return Object.freeze({
    pricingStrategy: "three-d-printing",
    colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
    printerId: THREE_D_PRINTING_PRINTER_IDS.ke,
    materialId: "",
    gramsPerUnit: "",
    printingHoursPerUnit: "",
    printingMinutesPerUnit: "",
    quantity: "1",
    modelingId: THREE_D_PRINTING_MODELING_IDS.none,
    manualPriceEnabled: false,
    manualPriceCop: "",
    belowThresholdAuthorized: false,
  });
}

export function changeThreeDPrintingTextField(
  values: ThreeDPrintingPricingFormValues,
  field: ThreeDPrintingTextField,
  value: string,
): ThreeDPrintingPricingFormValues {
  return Object.freeze({
    ...values,
    [field]: value,
    belowThresholdAuthorized: false,
  });
}

export function changeThreeDPrintingColorMode(
  values: ThreeDPrintingPricingFormValues,
  colorModeId: ThreeDPrintingColorModeId,
): ThreeDPrintingPricingFormValues {
  return Object.freeze({
    ...values,
    colorModeId,
    printerId: resolveThreeDPrintingProductionPrinter(
      colorModeId,
      values.printerId,
    ),
    belowThresholdAuthorized: false,
  });
}

export function changeThreeDPrintingPrinter(
  values: ThreeDPrintingPricingFormValues,
  printerId: ThreeDPrintingPrinterId,
): ThreeDPrintingPricingFormValues {
  if (!isThreeDPrintingPrinterAllowed(values.colorModeId, printerId)) {
    return values;
  }

  return Object.freeze({ ...values, printerId });
}

export function changeThreeDPrintingMaterial(
  values: ThreeDPrintingPricingFormValues,
  materialId: ThreeDPrintingMaterialId | "",
): ThreeDPrintingPricingFormValues {
  return Object.freeze({
    ...values,
    materialId,
    belowThresholdAuthorized: false,
  });
}

export function changeThreeDPrintingModeling(
  values: ThreeDPrintingPricingFormValues,
  modelingId: ThreeDPrintingModelingId,
): ThreeDPrintingPricingFormValues {
  return Object.freeze({
    ...values,
    modelingId,
    belowThresholdAuthorized: false,
  });
}

export function changeThreeDPrintingManualPriceEnabled(
  values: ThreeDPrintingPricingFormValues,
  enabled: boolean,
): ThreeDPrintingPricingFormValues {
  return Object.freeze({
    ...values,
    manualPriceEnabled: enabled,
    manualPriceCop: enabled ? values.manualPriceCop : "",
    belowThresholdAuthorized: false,
  });
}

export function changeThreeDPrintingBelowThresholdAuthorization(
  values: ThreeDPrintingPricingFormValues,
  belowThresholdAuthorized: boolean,
): ThreeDPrintingPricingFormValues {
  return Object.freeze({ ...values, belowThresholdAuthorized });
}

export function clearThreeDPrintingBelowThresholdAuthorization(
  values: ThreeDPrintingPricingFormValues,
): ThreeDPrintingPricingFormValues {
  return values.belowThresholdAuthorized
    ? Object.freeze({ ...values, belowThresholdAuthorized: false })
    : values;
}

function parseRequiredNumber(value: string, fieldName: string): number {
  if (value.trim() === "") {
    throw new RangeError(`${fieldName} is required.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new RangeError(`${fieldName} must be a finite number.`);
  }

  return parsed;
}

export function resolveThreeDPrintingPricingFormValues(
  values: ThreeDPrintingPricingFormValues,
): ResolvedThreeDPrintingForm {
  if (!isThreeDPrintingMaterialId(values.materialId)) {
    throw new RangeError("3D printing material must be valid.");
  }

  if (!isThreeDPrintingColorModeId(values.colorModeId)) {
    throw new RangeError("3D printing color mode must be valid.");
  }

  if (!isThreeDPrintingPrinterId(values.printerId)) {
    throw new RangeError("3D printing production printer must be valid.");
  }

  if (!isThreeDPrintingPrinterAllowed(values.colorModeId, values.printerId)) {
    throw new RangeError("3D printing multicolor production requires HI.");
  }

  if (!isThreeDPrintingModelingId(values.modelingId)) {
    throw new RangeError("3D printing modeling option must be valid.");
  }

  const printer = getThreeDPrintingPrinter(values.printerId);

  return Object.freeze({
    pricingInput: Object.freeze({
      materialId: values.materialId,
      colorModeId: values.colorModeId,
      gramsPerUnit: parseRequiredNumber(
        values.gramsPerUnit,
        "3D printing grams per unit",
      ),
      printingHoursPerUnit: parseRequiredNumber(
        values.printingHoursPerUnit,
        "3D printing hours",
      ),
      printingMinutesPerUnit: parseRequiredNumber(
        values.printingMinutesPerUnit,
        "3D printing minutes",
      ),
      quantity: parseRequiredNumber(values.quantity, "3D printing quantity"),
      modelingId: values.modelingId,
      manualPrice: Object.freeze({
        enabled: values.manualPriceEnabled,
        amountCop: values.manualPriceEnabled
          ? parseRequiredNumber(
              values.manualPriceCop,
              "3D printing manual price",
            )
          : null,
        belowThresholdAuthorized:
          values.manualPriceEnabled && values.belowThresholdAuthorized,
      }),
    }),
    printerId: printer.id,
  });
}

export function parseThreeDPrintingPricingFormValues(
  values: ThreeDPrintingPricingFormValues,
): ThreeDPrintingPricingInput {
  return resolveThreeDPrintingPricingFormValues(values).pricingInput;
}
