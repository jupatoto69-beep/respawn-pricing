import {
  type ComputerServiceId,
  type MaintenanceOptionId,
  MAINTENANCE_OPTION_IDS,
} from "./computer-service-catalog";
import {
  EMPTY_MAINTENANCE_SELECTION,
  type MaintenanceSelection,
} from "./resolve-maintenance-price";

export type ComputerServiceFormState = Readonly<{
  serviceId: ComputerServiceId | "";
  quantity: string;
  maintenance: MaintenanceSelection;
}>;

export function createInitialComputerServiceFormState(): ComputerServiceFormState {
  return {
    serviceId: "",
    quantity: "1",
    maintenance: EMPTY_MAINTENANCE_SELECTION,
  };
}

export function changeComputerServiceSelection(
  selection: ComputerServiceFormState,
  serviceId: ComputerServiceId | "",
): ComputerServiceFormState {
  if (selection.serviceId === serviceId) {
    return selection;
  }

  return {
    ...createInitialComputerServiceFormState(),
    serviceId,
  };
}

export function changeMaintenanceSelection(
  selection: MaintenanceSelection,
  optionId: MaintenanceOptionId,
  selected: boolean,
): MaintenanceSelection {
  return optionId === MAINTENANCE_OPTION_IDS.physical
    ? { ...selection, physical: selected }
    : { ...selection, system: selected };
}
