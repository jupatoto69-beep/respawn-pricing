import { acceptThreeDPrintingQuickEstimatedTotal } from "./accept-three-d-printing-quick-estimated-total";
import {
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MODELING_IDS,
  isThreeDPrintingMaterialId,
  isThreeDPrintingModelingId,
  type ThreeDPrintingMaterialId,
  type ThreeDPrintingModelingId,
} from "./three-d-printing-catalog";
import {
  THREE_D_PRINTING_COLOR_MODE_IDS,
  isThreeDPrintingColorModeId,
  type ThreeDPrintingColorModeId,
} from "./three-d-printing-color-mode";

export const THREE_D_PRINTING_PRELIMINARY_NOTICE =
  "Estimación preliminar. Para determinar el precio definitivo se requiere recibir y laminar el archivo 3D.";
export const THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION =
  "Valor estimado. El precio definitivo puede cambiar después de recibir y laminar el archivo 3D.";

export type ThreeDPrintingQuickFormValues = Readonly<{
  approximateSize: string;
  pieceDescription: string;
  materialId: ThreeDPrintingMaterialId;
  quantity: string;
  modelingId: ThreeDPrintingModelingId;
  colorModeId: ThreeDPrintingColorModeId;
  estimatedTotalCop: string;
}>;

export type ResolvedThreeDPrintingQuickForm = Readonly<{
  approximateSize: string;
  pieceDescription: string;
  materialId: ThreeDPrintingMaterialId;
  quantity: number;
  modelingId: ThreeDPrintingModelingId;
  colorModeId: ThreeDPrintingColorModeId;
  acceptedEstimatedTotal: number;
}>;

export type ThreeDPrintingQuickTextField =
  | "approximateSize"
  | "pieceDescription"
  | "quantity"
  | "estimatedTotalCop";

export function createInitialThreeDPrintingQuickFormValues(): ThreeDPrintingQuickFormValues {
  return Object.freeze({
    approximateSize: "",
    pieceDescription: "",
    materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
    quantity: "1",
    modelingId: THREE_D_PRINTING_MODELING_IDS.none,
    colorModeId: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
    estimatedTotalCop: "",
  });
}

function parseRequiredQuickText(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError(`3D printing quick ${fieldName} is required.`);
  }

  return normalized;
}

function parseQuickQuantity(value: string): number {
  if (value.trim().length === 0) {
    throw new RangeError("3D printing quick quantity is required.");
  }

  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    throw new RangeError(
      "3D printing quick quantity must be a finite number.",
    );
  }

  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new RangeError(
      "3D printing quick quantity must be a positive integer.",
    );
  }

  return quantity;
}

export function resolveThreeDPrintingQuickFormValues(
  values: ThreeDPrintingQuickFormValues,
): ResolvedThreeDPrintingQuickForm {
  const approximateSize = parseRequiredQuickText(
    values.approximateSize,
    "approximate size",
  );
  const pieceDescription = parseRequiredQuickText(
    values.pieceDescription,
    "piece description",
  );

  if (!isThreeDPrintingMaterialId(values.materialId)) {
    throw new RangeError("3D printing quick material must be valid.");
  }

  if (!isThreeDPrintingModelingId(values.modelingId)) {
    throw new RangeError("3D printing quick modeling option must be valid.");
  }

  if (!isThreeDPrintingColorModeId(values.colorModeId)) {
    throw new RangeError("3D printing quick color mode must be valid.");
  }

  return Object.freeze({
    approximateSize,
    pieceDescription,
    materialId: values.materialId,
    quantity: parseQuickQuantity(values.quantity),
    modelingId: values.modelingId,
    colorModeId: values.colorModeId,
    acceptedEstimatedTotal: acceptThreeDPrintingQuickEstimatedTotal(
      values.estimatedTotalCop,
    ),
  });
}

export function changeThreeDPrintingQuickTextField(
  values: ThreeDPrintingQuickFormValues,
  field: ThreeDPrintingQuickTextField,
  value: string,
): ThreeDPrintingQuickFormValues {
  return Object.freeze({ ...values, [field]: value });
}

export function changeThreeDPrintingQuickMaterial(
  values: ThreeDPrintingQuickFormValues,
  materialId: ThreeDPrintingMaterialId,
): ThreeDPrintingQuickFormValues {
  return Object.freeze({ ...values, materialId });
}

export function changeThreeDPrintingQuickModeling(
  values: ThreeDPrintingQuickFormValues,
  modelingId: ThreeDPrintingModelingId,
): ThreeDPrintingQuickFormValues {
  return Object.freeze({ ...values, modelingId });
}

export function changeThreeDPrintingQuickColorMode(
  values: ThreeDPrintingQuickFormValues,
  colorModeId: ThreeDPrintingColorModeId,
): ThreeDPrintingQuickFormValues {
  return Object.freeze({ ...values, colorModeId });
}
