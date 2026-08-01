import { calculateFixedPrice } from "./calculate-fixed-price-service";
import {
  MAINTENANCE_OPTION_IDS,
  type MaintenanceOptionId,
} from "./computer-service-catalog";

export const INDIVIDUAL_MAINTENANCE_UNIT_PRICE = 70_000;
export const COMPLETE_MAINTENANCE_UNIT_PRICE = 120_000;
export const COMPLETE_MAINTENANCE_PACKAGE_NAME = "Mantenimiento completo";

export type MaintenanceSelection = Readonly<{
  physical: boolean;
  system: boolean;
}>;

export type MaintenancePriceResolution = Readonly<{
  selectedOptionIds: readonly MaintenanceOptionId[];
  packageName: typeof COMPLETE_MAINTENANCE_PACKAGE_NAME | null;
  unitPrice: number;
}>;

export type MaintenancePriceCalculation = MaintenancePriceResolution &
  Readonly<{
    quantity: number;
    totalPrice: number;
  }>;

export const EMPTY_MAINTENANCE_SELECTION: MaintenanceSelection = {
  physical: false,
  system: false,
};

export function resolveMaintenancePrice(
  selection: MaintenanceSelection,
): MaintenancePriceResolution | null {
  if (!selection.physical && !selection.system) {
    return null;
  }

  const selectedOptionIds: MaintenanceOptionId[] = [];

  if (selection.physical) {
    selectedOptionIds.push(MAINTENANCE_OPTION_IDS.physical);
  }

  if (selection.system) {
    selectedOptionIds.push(MAINTENANCE_OPTION_IDS.system);
  }

  const usesCompletePackage = selection.physical && selection.system;

  return {
    selectedOptionIds,
    packageName: usesCompletePackage
      ? COMPLETE_MAINTENANCE_PACKAGE_NAME
      : null,
    unitPrice: usesCompletePackage
      ? COMPLETE_MAINTENANCE_UNIT_PRICE
      : INDIVIDUAL_MAINTENANCE_UNIT_PRICE,
  };
}

export function calculateMaintenancePrice(
  selection: MaintenanceSelection,
  quantity: number,
): MaintenancePriceCalculation | null {
  const resolution = resolveMaintenancePrice(selection);

  if (resolution === null) {
    return null;
  }

  const calculation = calculateFixedPrice(resolution.unitPrice, quantity);

  return {
    ...resolution,
    quantity: calculation.quantity,
    totalPrice: calculation.totalPrice,
  };
}
