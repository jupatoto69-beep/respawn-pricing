export const THREE_D_PRINTING_MATERIAL_IDS = {
  pla: "pla",
  petg: "petg",
} as const;

export type ThreeDPrintingMaterialId =
  (typeof THREE_D_PRINTING_MATERIAL_IDS)[keyof typeof THREE_D_PRINTING_MATERIAL_IDS];

export type ThreeDPrintingMaterialConfig = Readonly<{
  id: ThreeDPrintingMaterialId;
  name: "PLA" | "PETG";
  spoolPriceCop: number;
  spoolWeightGrams: number;
  materialIncreaseRate: number;
}>;

const SHARED_FILAMENT_CONFIGURATION = Object.freeze({
  spoolPriceCop: 95_000,
  spoolWeightGrams: 1_000,
  materialIncreaseRate: 0.4,
});

export const THREE_D_PRINTING_MATERIALS: Readonly<
  Record<ThreeDPrintingMaterialId, ThreeDPrintingMaterialConfig>
> = Object.freeze({
  [THREE_D_PRINTING_MATERIAL_IDS.pla]: Object.freeze({
    id: THREE_D_PRINTING_MATERIAL_IDS.pla,
    name: "PLA",
    ...SHARED_FILAMENT_CONFIGURATION,
  }),
  [THREE_D_PRINTING_MATERIAL_IDS.petg]: Object.freeze({
    id: THREE_D_PRINTING_MATERIAL_IDS.petg,
    name: "PETG",
    ...SHARED_FILAMENT_CONFIGURATION,
  }),
});

export const THREE_D_PRINTING_MATERIAL_OPTIONS = Object.freeze(
  Object.values(THREE_D_PRINTING_MATERIALS),
);

export const THREE_D_PRINTING_MODELING_IDS = {
  none: "none",
  aiAssisted: "ai-assisted",
  basic: "basic",
  complex: "complex",
} as const;

export type ThreeDPrintingModelingId =
  (typeof THREE_D_PRINTING_MODELING_IDS)[keyof typeof THREE_D_PRINTING_MODELING_IDS];

export type ThreeDPrintingModelingOption = Readonly<{
  id: ThreeDPrintingModelingId;
  name:
    | "Sin modelado"
    | "Modelo con IA / asistido por IA"
    | "Diseño básico"
    | "Diseño complejo";
  priceCop: number;
}>;

export const THREE_D_PRINTING_MODELING_OPTIONS: readonly ThreeDPrintingModelingOption[] =
  Object.freeze([
    Object.freeze({
      id: THREE_D_PRINTING_MODELING_IDS.none,
      name: "Sin modelado",
      priceCop: 0,
    }),
    Object.freeze({
      id: THREE_D_PRINTING_MODELING_IDS.aiAssisted,
      name: "Modelo con IA / asistido por IA",
      priceCop: 15_000,
    }),
    Object.freeze({
      id: THREE_D_PRINTING_MODELING_IDS.basic,
      name: "Diseño básico",
      priceCop: 25_000,
    }),
    Object.freeze({
      id: THREE_D_PRINTING_MODELING_IDS.complex,
      name: "Diseño complejo",
      priceCop: 50_000,
    }),
  ]);

export const THREE_D_PRINTING_MACHINE_CONFIG = Object.freeze({
  printerPowerWatts: 150,
  electricityPricePerKwhCop: 900,
});

export const THREE_D_PRINTING_COMMERCIAL_CONFIG = Object.freeze({
  suggestedPriceMultiplier: 4,
  authorizationThresholdMultiplier: 3,
  absoluteMinimumPriceCop: 5_000,
});

export function isThreeDPrintingMaterialId(
  value: string,
): value is ThreeDPrintingMaterialId {
  return Object.hasOwn(THREE_D_PRINTING_MATERIALS, value);
}

export function getThreeDPrintingMaterialConfig(
  materialId: string,
): ThreeDPrintingMaterialConfig {
  if (!isThreeDPrintingMaterialId(materialId)) {
    throw new RangeError("3D printing material must be valid.");
  }

  return THREE_D_PRINTING_MATERIALS[materialId];
}

export function isThreeDPrintingModelingId(
  value: string,
): value is ThreeDPrintingModelingId {
  return THREE_D_PRINTING_MODELING_OPTIONS.some(
    (option) => option.id === value,
  );
}

export function getThreeDPrintingModelingOption(
  modelingId: string,
): ThreeDPrintingModelingOption {
  const option = THREE_D_PRINTING_MODELING_OPTIONS.find(
    (candidate) => candidate.id === modelingId,
  );

  if (option === undefined) {
    throw new RangeError("3D printing modeling option must be valid.");
  }

  return option;
}
