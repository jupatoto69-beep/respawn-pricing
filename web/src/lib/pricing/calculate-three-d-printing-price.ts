import { roundUpToCop500 } from "./round-up-to-cop-500";
import {
  getThreeDPrintingMaterialConfig,
  getThreeDPrintingModelingOption,
  THREE_D_PRINTING_COMMERCIAL_CONFIG,
  THREE_D_PRINTING_MACHINE_CONFIG,
  type ThreeDPrintingMaterialId,
  type ThreeDPrintingModelingId,
} from "./three-d-printing-catalog";

export type ThreeDPrintingMetrics = Readonly<{
  gramsPerUnit: number;
  printingHoursPerUnit: number;
  printingMinutesPerUnit: number;
}>;

export type ThreeDPrintingManualPrice = Readonly<{
  enabled: boolean;
  amountCop: number | null;
  belowThresholdAuthorized: boolean;
}>;

export const THREE_D_PRINTING_AUTHORIZATION_REQUIRED_ERROR =
  "3D printing manual price requires authorization.";
export const THREE_D_PRINTING_ABSOLUTE_MINIMUM_ERROR =
  "3D printing manual price is below the absolute commercial minimum.";

export type ThreeDPrintingPricingInput = ThreeDPrintingMetrics &
  Readonly<{
    materialId: ThreeDPrintingMaterialId;
    quantity: number;
    modelingId: ThreeDPrintingModelingId;
    manualPrice: ThreeDPrintingManualPrice;
  }>;

export type ThreeDPrintingCostBreakdown = Readonly<{
  rawMaterialCostPerUnit: number;
  adjustedMaterialCostPerUnit: number;
  printingTimeHoursPerUnit: number;
  printerPowerKilowatts: number;
  electricityCostPerUnit: number;
  variableCost: number;
  modelingCost: number;
  baseCost: number;
  suggestedPriceRaw: number;
  authorizationThresholdRaw: number;
}>;

export type ThreeDPrintingPriceCalculation = Readonly<{
  materialId: ThreeDPrintingMaterialId;
  gramsPerUnit: number;
  printingHoursPerUnit: number;
  printingMinutesPerUnit: number;
  quantity: number;
  modelingId: ThreeDPrintingModelingId;
  priceSource: "suggested" | "manual";
  suggestedPrice: number;
  enteredManualPrice: number | null;
  totalPrice: number;
  internal: ThreeDPrintingCostBreakdown;
}>;

function assertFiniteNonNegative(value: number, message: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(message);
  }

  if (value < 0) {
    throw new RangeError(message);
  }
}

function assertSafeNonNegativeInteger(value: number, message: string): void {
  assertFiniteNonNegative(value, message);

  if (!Number.isSafeInteger(value)) {
    throw new RangeError(message);
  }
}

function assertFiniteCalculation(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("3D printing calculation is outside the supported range.");
  }

  return value;
}

function assertSafeFinalPrice(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("3D printing final price is outside the supported range.");
  }

  return value;
}

export function calculateThreeDPrintingMaterialCost(
  materialId: ThreeDPrintingMaterialId,
  gramsPerUnit: number,
): Readonly<{
  rawMaterialCostPerUnit: number;
  adjustedMaterialCostPerUnit: number;
}> {
  assertFiniteNonNegative(
    gramsPerUnit,
    "3D printing grams per unit must be a finite non-negative number.",
  );

  const material = getThreeDPrintingMaterialConfig(materialId);
  const rawMaterialCostPerUnit = assertFiniteCalculation(
    (gramsPerUnit * material.spoolPriceCop) / material.spoolWeightGrams,
  );
  const adjustedMaterialCostPerUnit = assertFiniteCalculation(
    rawMaterialCostPerUnit * (1 + material.materialIncreaseRate),
  );

  return Object.freeze({
    rawMaterialCostPerUnit,
    adjustedMaterialCostPerUnit,
  });
}

export function calculateThreeDPrintingHours(
  hours: number,
  minutes: number,
): number {
  assertSafeNonNegativeInteger(
    hours,
    "3D printing hours must be a non-negative integer.",
  );
  assertSafeNonNegativeInteger(
    minutes,
    "3D printing minutes must be an integer from 0 to 59.",
  );

  if (minutes > 59) {
    throw new RangeError("3D printing minutes must be an integer from 0 to 59.");
  }

  return assertFiniteCalculation(hours + minutes / 60);
}

export function calculateThreeDPrintingElectricityCost(
  hours: number,
  minutes: number,
): Readonly<{
  printingTimeHoursPerUnit: number;
  printerPowerKilowatts: number;
  electricityCostPerUnit: number;
}> {
  const printingTimeHoursPerUnit = calculateThreeDPrintingHours(hours, minutes);
  const printerPowerKilowatts =
    THREE_D_PRINTING_MACHINE_CONFIG.printerPowerWatts / 1_000;
  const electricityCostPerHour =
    (THREE_D_PRINTING_MACHINE_CONFIG.printerPowerWatts *
      THREE_D_PRINTING_MACHINE_CONFIG.electricityPricePerKwhCop) /
    1_000;
  const electricityCostPerUnit = assertFiniteCalculation(
    printingTimeHoursPerUnit * electricityCostPerHour,
  );

  return Object.freeze({
    printingTimeHoursPerUnit,
    printerPowerKilowatts,
    electricityCostPerUnit,
  });
}

function resolveManualPrice(
  manualPrice: ThreeDPrintingManualPrice,
  authorizationThresholdRaw: number,
): Readonly<{
  priceSource: "suggested" | "manual";
  enteredManualPrice: number | null;
  acceptedPriceRaw: number | null;
}> {
  if (!manualPrice.enabled) {
    return Object.freeze({
      priceSource: "suggested",
      enteredManualPrice: null,
      acceptedPriceRaw: null,
    });
  }

  const amountCop = manualPrice.amountCop;

  if (amountCop === null || !Number.isFinite(amountCop) || amountCop <= 0) {
    throw new RangeError("3D printing manual price must be a finite positive number.");
  }

  if (
    amountCop < THREE_D_PRINTING_COMMERCIAL_CONFIG.absoluteMinimumPriceCop
  ) {
    throw new RangeError(THREE_D_PRINTING_ABSOLUTE_MINIMUM_ERROR);
  }

  if (
    amountCop < authorizationThresholdRaw &&
    !manualPrice.belowThresholdAuthorized
  ) {
    throw new RangeError(THREE_D_PRINTING_AUTHORIZATION_REQUIRED_ERROR);
  }

  return Object.freeze({
    priceSource: "manual",
    enteredManualPrice: amountCop,
    acceptedPriceRaw: amountCop,
  });
}

export function requiresThreeDPrintingManualPriceAuthorization(
  input: ThreeDPrintingPricingInput,
): boolean {
  if (!input.manualPrice.enabled) {
    return false;
  }

  try {
    calculateThreeDPrintingPrice({
      ...input,
      manualPrice: {
        ...input.manualPrice,
        belowThresholdAuthorized: false,
      },
    });
    return false;
  } catch (error: unknown) {
    if (
      error instanceof RangeError &&
      error.message === THREE_D_PRINTING_AUTHORIZATION_REQUIRED_ERROR
    ) {
      return true;
    }

    throw error;
  }
}

export function calculateThreeDPrintingPrice(
  input: ThreeDPrintingPricingInput,
): ThreeDPrintingPriceCalculation {
  const material = getThreeDPrintingMaterialConfig(input.materialId);
  const modeling = getThreeDPrintingModelingOption(input.modelingId);

  assertSafeNonNegativeInteger(
    input.quantity,
    "3D printing quantity must be a positive integer.",
  );
  if (input.quantity === 0) {
    throw new RangeError("3D printing quantity must be a positive integer.");
  }

  const materialCost = calculateThreeDPrintingMaterialCost(
    material.id,
    input.gramsPerUnit,
  );
  const electricityCost = calculateThreeDPrintingElectricityCost(
    input.printingHoursPerUnit,
    input.printingMinutesPerUnit,
  );

  if (
    input.gramsPerUnit === 0 &&
    electricityCost.printingTimeHoursPerUnit === 0
  ) {
    throw new RangeError("3D printing work must include material or printing time.");
  }

  const variableCost = assertFiniteCalculation(
    (materialCost.adjustedMaterialCostPerUnit +
      electricityCost.electricityCostPerUnit) *
      input.quantity,
  );
  const baseCost = assertFiniteCalculation(variableCost + modeling.priceCop);
  const suggestedPriceRaw = assertFiniteCalculation(
    baseCost * THREE_D_PRINTING_COMMERCIAL_CONFIG.suggestedPriceMultiplier,
  );
  const authorizationThresholdRaw = assertFiniteCalculation(
    baseCost *
      THREE_D_PRINTING_COMMERCIAL_CONFIG.authorizationThresholdMultiplier,
  );
  const suggestedPrice = assertSafeFinalPrice(
    roundUpToCop500(
      Math.max(
        suggestedPriceRaw,
        THREE_D_PRINTING_COMMERCIAL_CONFIG.absoluteMinimumPriceCop,
      ),
    ),
  );
  const manualResolution = resolveManualPrice(
    input.manualPrice,
    authorizationThresholdRaw,
  );
  const totalPrice =
    manualResolution.acceptedPriceRaw === null
      ? suggestedPrice
      : assertSafeFinalPrice(
          roundUpToCop500(manualResolution.acceptedPriceRaw),
        );
  const internal = Object.freeze({
    ...materialCost,
    ...electricityCost,
    variableCost,
    modelingCost: modeling.priceCop,
    baseCost,
    suggestedPriceRaw,
    authorizationThresholdRaw,
  });

  return Object.freeze({
    materialId: material.id,
    gramsPerUnit: input.gramsPerUnit,
    printingHoursPerUnit: input.printingHoursPerUnit,
    printingMinutesPerUnit: input.printingMinutesPerUnit,
    quantity: input.quantity,
    modelingId: modeling.id,
    priceSource: manualResolution.priceSource,
    suggestedPrice,
    enteredManualPrice: manualResolution.enteredManualPrice,
    totalPrice,
    internal,
  });
}

export function formatThreeDPrintingDuration(
  hours: number,
  minutes: number,
): string {
  calculateThreeDPrintingHours(hours, minutes);

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}
