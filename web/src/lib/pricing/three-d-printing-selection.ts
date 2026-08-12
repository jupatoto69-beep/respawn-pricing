import type { ThreeDPrintingPricingInput } from "./calculate-three-d-printing-price";
import {
  isThreeDPrintingMaterialId,
  isThreeDPrintingModelingId,
  THREE_D_PRINTING_MODELING_IDS,
  type ThreeDPrintingMaterialId,
  type ThreeDPrintingModelingId,
} from "./three-d-printing-catalog";

export type ThreeDPrintingPricingFormValues = Readonly<{
  pricingStrategy: "three-d-printing";
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

export function createInitialThreeDPrintingPricingFormValues(): ThreeDPrintingPricingFormValues {
  return Object.freeze({
    pricingStrategy: "three-d-printing",
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

export function parseThreeDPrintingPricingFormValues(
  values: ThreeDPrintingPricingFormValues,
): ThreeDPrintingPricingInput {
  if (!isThreeDPrintingMaterialId(values.materialId)) {
    throw new RangeError("3D printing material must be valid.");
  }

  if (!isThreeDPrintingModelingId(values.modelingId)) {
    throw new RangeError("3D printing modeling option must be valid.");
  }

  return Object.freeze({
    materialId: values.materialId,
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
  });
}
