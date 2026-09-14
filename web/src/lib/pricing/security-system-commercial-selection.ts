import { ACCESSORY_CATALOG } from "./security-system-catalog/accessory-catalog";
import { POE_SWITCH_CATALOG } from "./security-system-catalog/poe-switch-catalog";
import { POWER_SUPPLY_CATALOG } from "./security-system-catalog/power-supply-catalog";
import type {
  Accessory,
  PoeSwitch,
  PowerSupply,
} from "./security-system-catalog/catalog-types";
import type {
  SecuritySystemCameraAccessorySelectionId,
  SecuritySystemInstallationTypeId,
  SecuritySystemRecorderConfigurationId,
  SecuritySystemTypeId,
} from "./security-system-options";

export const SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES = Object.freeze({
  poeSwitch: "poe-switch",
  centralizedPowerSupply: "centralized-power-supply",
  additionalAccessory: "additional-accessory",
} as const);

export type SecuritySystemOptionalComponentType =
  (typeof SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES)[keyof typeof SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES];

export type SecuritySystemCameraGroupCommercialSelection = Readonly<{
  accessorySelectionId: SecuritySystemCameraAccessorySelectionId | null;
  installationTypeId: SecuritySystemInstallationTypeId | null;
}>;

export type SecuritySystemOptionalComponentSelection = Readonly<{
  id: string;
  componentType: SecuritySystemOptionalComponentType;
  productId: string | null;
  quantity: string;
}>;

export type SecuritySystemCommercialSelection = Readonly<{
  cameraGroups: Readonly<
    Record<string, SecuritySystemCameraGroupCommercialSelection>
  >;
  hardDriveSelectionId: string | null;
  recorderConfigurationId: SecuritySystemRecorderConfigurationId | null;
  optionalComponents: readonly SecuritySystemOptionalComponentSelection[];
}>;

export type SecuritySystemOptionalComponentPricingInput =
  | Readonly<{
      id: string;
      componentType: "poe-switch";
      product: PoeSwitch | null;
      quantity: number | null;
    }>
  | Readonly<{
      id: string;
      componentType: "centralized-power-supply";
      product: PowerSupply | null;
      quantity: number | null;
    }>
  | Readonly<{
      id: string;
      componentType: "additional-accessory";
      product: Accessory | null;
      quantity: number | null;
    }>;

export function createInitialSecuritySystemCommercialSelection(): SecuritySystemCommercialSelection {
  return Object.freeze({
    cameraGroups: Object.freeze({}),
    hardDriveSelectionId: null,
    recorderConfigurationId: null,
    optionalComponents: Object.freeze([]),
  });
}

export function isSecuritySystemOptionalComponentTypeAllowed(
  systemTypeId: SecuritySystemTypeId,
  componentType: SecuritySystemOptionalComponentType,
): boolean {
  return (
    componentType ===
      SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES.additionalAccessory ||
    (systemTypeId === "ip" &&
      componentType === SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES.poeSwitch) ||
    (systemTypeId === "analog" &&
      componentType ===
        SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES.centralizedPowerSupply)
  );
}

export function addSecuritySystemOptionalComponent(
  selection: SecuritySystemCommercialSelection,
  systemTypeId: SecuritySystemTypeId,
  rowId: string,
  componentType: SecuritySystemOptionalComponentType,
): SecuritySystemCommercialSelection {
  if (
    rowId.length === 0 ||
    selection.optionalComponents.some(({ id }) => id === rowId) ||
    !isSecuritySystemOptionalComponentTypeAllowed(systemTypeId, componentType)
  ) {
    return selection;
  }

  return Object.freeze({
    ...selection,
    optionalComponents: Object.freeze([
      ...selection.optionalComponents,
      Object.freeze({
        id: rowId,
        componentType,
        productId: null,
        quantity: "1",
      }),
    ]),
  });
}

function isProductIdForComponentType(
  componentType: SecuritySystemOptionalComponentType,
  productId: string,
): boolean {
  if (componentType === SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES.poeSwitch) {
    return POE_SWITCH_CATALOG.some(({ id }) => id === productId);
  }
  if (
    componentType ===
    SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES.centralizedPowerSupply
  ) {
    return POWER_SUPPLY_CATALOG.some(({ id }) => id === productId);
  }
  return ACCESSORY_CATALOG.some(({ id }) => id === productId);
}

export function changeSecuritySystemOptionalComponentProduct(
  selection: SecuritySystemCommercialSelection,
  rowId: string,
  productId: string,
): SecuritySystemCommercialSelection {
  const row = selection.optionalComponents.find(({ id }) => id === rowId);
  if (!row) return selection;

  const nextProductId =
    productId === ""
      ? null
      : isProductIdForComponentType(row.componentType, productId)
        ? productId
        : row.productId;
  if (nextProductId === row.productId) return selection;

  return Object.freeze({
    ...selection,
    optionalComponents: Object.freeze(
      selection.optionalComponents.map((candidate) =>
        candidate.id === rowId
          ? Object.freeze({ ...candidate, productId: nextProductId })
          : candidate,
      ),
    ),
  });
}

export function changeSecuritySystemOptionalComponentQuantity(
  selection: SecuritySystemCommercialSelection,
  rowId: string,
  quantity: string,
): SecuritySystemCommercialSelection {
  if (!selection.optionalComponents.some(({ id }) => id === rowId)) {
    return selection;
  }

  return Object.freeze({
    ...selection,
    optionalComponents: Object.freeze(
      selection.optionalComponents.map((candidate) =>
        candidate.id === rowId
          ? Object.freeze({ ...candidate, quantity })
          : candidate,
      ),
    ),
  });
}

export function removeSecuritySystemOptionalComponent(
  selection: SecuritySystemCommercialSelection,
  rowId: string,
): SecuritySystemCommercialSelection {
  if (!selection.optionalComponents.some(({ id }) => id === rowId)) {
    return selection;
  }

  return Object.freeze({
    ...selection,
    optionalComponents: Object.freeze(
      selection.optionalComponents.filter(({ id }) => id !== rowId),
    ),
  });
}

export function resetSecuritySystemCommercialSelectionForSystemType(
  selection: SecuritySystemCommercialSelection,
): SecuritySystemCommercialSelection {
  if (
    Object.keys(selection.cameraGroups).length === 0 &&
    selection.hardDriveSelectionId === null &&
    selection.recorderConfigurationId === null &&
    selection.optionalComponents.length === 0
  ) {
    return selection;
  }
  return createInitialSecuritySystemCommercialSelection();
}

function parseQuantity(quantity: string): number | null {
  return quantity.trim().length === 0 ? null : Number(quantity);
}

export function resolveSecuritySystemOptionalComponentPricingInputs(
  selections: readonly SecuritySystemOptionalComponentSelection[],
): readonly SecuritySystemOptionalComponentPricingInput[] {
  return Object.freeze(
    selections.map((selection): SecuritySystemOptionalComponentPricingInput => {
      const quantity = parseQuantity(selection.quantity);
      if (
        selection.componentType ===
        SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES.poeSwitch
      ) {
        return Object.freeze({
          id: selection.id,
          componentType: selection.componentType,
          product:
            POE_SWITCH_CATALOG.find(({ id }) => id === selection.productId) ??
            null,
          quantity,
        });
      }
      if (
        selection.componentType ===
        SECURITY_SYSTEM_OPTIONAL_COMPONENT_TYPES.centralizedPowerSupply
      ) {
        return Object.freeze({
          id: selection.id,
          componentType: selection.componentType,
          product:
            POWER_SUPPLY_CATALOG.find(({ id }) => id === selection.productId) ??
            null,
          quantity,
        });
      }
      return Object.freeze({
        id: selection.id,
        componentType: selection.componentType,
        product:
          ACCESSORY_CATALOG.find(({ id }) => id === selection.productId) ?? null,
        quantity,
      });
    }),
  );
}
