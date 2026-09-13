import { calculateSecuritySystemInstallationPrice } from "./calculate-security-system-installation-price";
import { roundUpSecuritySystemTotal } from "./round-up-security-system-total";
import type {
  SecuritySystemCameraAccessorySelectionId,
  SecuritySystemInstallationTypeId,
  SecuritySystemRecorderConfigurationId,
  SecuritySystemTypeId,
} from "./security-system-options";
import {
  getSecuritySystemInstallationOption,
  getSecuritySystemRecorderConfigurationOption,
  SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS,
  SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS,
  SECURITY_SYSTEM_TYPE_IDS,
} from "./security-system-options";
import type {
  Camera,
  HardDrive,
  Recorder,
} from "./security-system-catalog/catalog-types";
import { hasPublishedSalePrice } from "./security-system-catalog/catalog-types";

export const SECURITY_SYSTEM_NO_HARD_DRIVE = "none" as const;

export const SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE =
  "El cableado no está incluido en esta cotización. Se cobrará posteriormente según la cantidad real de metros utilizados durante la instalación.";

export type SecuritySystemHardDriveSelection =
  | typeof SECURITY_SYSTEM_NO_HARD_DRIVE
  | HardDrive
  | null;

export type SecuritySystemCameraGroupPricingInput = Readonly<{
  id: string;
  camera: Camera | null;
  quantity: number | null;
  accessorySelectionId: SecuritySystemCameraAccessorySelectionId | null;
  installationTypeId: SecuritySystemInstallationTypeId | null;
}>;

export type SecuritySystemPricingInput = Readonly<{
  systemTypeId: SecuritySystemTypeId;
  totalCameraQuantity: number | null;
  cameraGroups: readonly SecuritySystemCameraGroupPricingInput[];
  recorder: Recorder | null;
  hardDrive: SecuritySystemHardDriveSelection;
  recorderConfigurationId: SecuritySystemRecorderConfigurationId | null;
}>;

export type SecuritySystemCameraGroupPrice = Readonly<{
  id: string;
  cameraReference: string | null;
  quantity: number | null;
  accessorySelectionId: SecuritySystemCameraAccessorySelectionId | null;
  accessorySelectionName: string | null;
  cameraUnitPriceCop: number | null;
  cameraSubtotalCop: number | null;
  installationTypeId: SecuritySystemInstallationTypeId | null;
  installationName: string | null;
  installationUnitPriceCop: number | null;
  installationSubtotalCop: number | null;
  groupSubtotalCop: number | null;
  isComplete: boolean;
}>;

export type SecuritySystemRecorderPrice = Readonly<{
  status: "not-applicable" | "unresolved" | "priced" | "invalid";
  reference: string | null;
  priceCop: number | null;
}>;

export type SecuritySystemHardDrivePrice = Readonly<{
  status:
    | "not-applicable"
    | "unresolved"
    | "none"
    | "priced"
    | "manual-confirmation";
  reference: string | null;
  capacityLabel: string | null;
  priceCop: number | null;
}>;

export type SecuritySystemRecorderConfigurationPrice = Readonly<{
  status: "not-applicable" | "unresolved" | "not-included" | "included";
  priceCop: number | null;
}>;

export type SecuritySystemPricingResult = Readonly<{
  systemTypeId: SecuritySystemTypeId;
  cameraGroups: readonly SecuritySystemCameraGroupPrice[];
  recorder: SecuritySystemRecorderPrice;
  hardDrive: SecuritySystemHardDrivePrice;
  recorderConfiguration: SecuritySystemRecorderConfigurationPrice;
  rawTotalCop: number | null;
  finalTotalCop: number | null;
  isPriceComplete: boolean;
  blockingReasons: readonly string[];
  customerNotes: readonly string[];
}>;

function safeMultiply(price: number, quantity: number): number {
  if (
    !Number.isSafeInteger(price) ||
    price < 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    throw new RangeError("Security system pricing values must be safe integers.");
  }
  const total = price * quantity;
  if (!Number.isSafeInteger(total)) {
    throw new RangeError("Security system component total exceeds the safe range.");
  }
  return total;
}

function safeSum(values: readonly number[]): number {
  return values.reduce((total, value) => {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError("Security system component total must be valid.");
    }
    if (value > Number.MAX_SAFE_INTEGER - total) {
      throw new RangeError("Security system total exceeds the safe range.");
    }
    return total + value;
  }, 0);
}

function priceCameraGroup(
  group: SecuritySystemCameraGroupPricingInput,
): SecuritySystemCameraGroupPrice {
  const quantityIsValid =
    group.quantity !== null &&
    Number.isSafeInteger(group.quantity) &&
    group.quantity > 0;
  const cameraUnitPriceCop =
    group.camera && group.accessorySelectionId
      ? group.accessorySelectionId ===
        SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withAccessories
        ? group.camera.withAccessoriesSalePriceCop
        : group.camera.salePriceCop
      : null;
  const cameraSubtotalCop =
    cameraUnitPriceCop !== null && quantityIsValid
      ? safeMultiply(cameraUnitPriceCop, group.quantity!)
      : null;
  const installation = group.installationTypeId
    ? getSecuritySystemInstallationOption(group.installationTypeId)
    : null;
  const installationCalculation =
    installation && quantityIsValid
      ? calculateSecuritySystemInstallationPrice(
          group.quantity!,
          installation.id,
        )
      : null;
  const installationSubtotalCop =
    installationCalculation?.totalPriceCop ?? null;
  const groupSubtotalCop =
    cameraSubtotalCop !== null && installationSubtotalCop !== null
      ? safeSum([cameraSubtotalCop, installationSubtotalCop])
      : null;

  return Object.freeze({
    id: group.id,
    cameraReference: group.camera?.reference ?? null,
    quantity: quantityIsValid ? group.quantity : null,
    accessorySelectionId: group.accessorySelectionId,
    accessorySelectionName:
      group.accessorySelectionId ===
      SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withAccessories
        ? "Con accesorios"
        : group.accessorySelectionId ===
            SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withoutAccessories
          ? "Sin accesorios"
          : null,
    cameraUnitPriceCop,
    cameraSubtotalCop,
    installationTypeId: group.installationTypeId,
    installationName: installation?.name ?? null,
    installationUnitPriceCop: installation?.pricePerCameraCop ?? null,
    installationSubtotalCop,
    groupSubtotalCop,
    isComplete: groupSubtotalCop !== null,
  });
}

function priceRecorder(
  systemTypeId: SecuritySystemTypeId,
  recorder: Recorder | null,
): SecuritySystemRecorderPrice {
  if (systemTypeId === SECURITY_SYSTEM_TYPE_IDS.wifi) {
    return Object.freeze({
      status: "not-applicable",
      reference: null,
      priceCop: null,
    });
  }
  if (!recorder) {
    return Object.freeze({ status: "unresolved", reference: null, priceCop: null });
  }
  const matchesSystem =
    (systemTypeId === SECURITY_SYSTEM_TYPE_IDS.analog &&
      recorder.recorderType === "dvr-xvr") ||
    (systemTypeId === SECURITY_SYSTEM_TYPE_IDS.ip &&
      recorder.recorderType === "nvr");
  return Object.freeze({
    status: matchesSystem ? "priced" : "invalid",
    reference: recorder.reference,
    priceCop: matchesSystem ? recorder.salePriceCop : null,
  });
}

function priceHardDrive(
  systemTypeId: SecuritySystemTypeId,
  hardDrive: SecuritySystemHardDriveSelection,
): SecuritySystemHardDrivePrice {
  if (systemTypeId === SECURITY_SYSTEM_TYPE_IDS.wifi) {
    return Object.freeze({
      status: "not-applicable",
      reference: null,
      capacityLabel: null,
      priceCop: null,
    });
  }
  if (hardDrive === null) {
    return Object.freeze({
      status: "unresolved",
      reference: null,
      capacityLabel: null,
      priceCop: null,
    });
  }
  if (hardDrive === SECURITY_SYSTEM_NO_HARD_DRIVE) {
    return Object.freeze({
      status: "none",
      reference: null,
      capacityLabel: null,
      priceCop: null,
    });
  }
  return Object.freeze({
    status: hasPublishedSalePrice(hardDrive)
      ? "priced"
      : "manual-confirmation",
    reference: hardDrive.reference,
    capacityLabel: `${hardDrive.capacity} ${hardDrive.capacityUnit}`,
    priceCop: hasPublishedSalePrice(hardDrive) ? hardDrive.salePriceCop : null,
  });
}

function priceRecorderConfiguration(
  systemTypeId: SecuritySystemTypeId,
  configurationId: SecuritySystemRecorderConfigurationId | null,
): SecuritySystemRecorderConfigurationPrice {
  if (systemTypeId === SECURITY_SYSTEM_TYPE_IDS.wifi) {
    return Object.freeze({ status: "not-applicable", priceCop: null });
  }
  if (configurationId === null) {
    return Object.freeze({ status: "unresolved", priceCop: null });
  }
  const option = getSecuritySystemRecorderConfigurationOption(configurationId);
  return Object.freeze({
    status:
      configurationId === SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS.included
        ? "included"
        : "not-included",
    priceCop: option.priceCop,
  });
}

export function calculateSecuritySystemPrice(
  input: SecuritySystemPricingInput,
): SecuritySystemPricingResult {
  const cameraGroups = Object.freeze(input.cameraGroups.map(priceCameraGroup));
  const recorder = priceRecorder(input.systemTypeId, input.recorder);
  const hardDrive = priceHardDrive(input.systemTypeId, input.hardDrive);
  const recorderConfiguration = priceRecorderConfiguration(
    input.systemTypeId,
    input.recorderConfigurationId,
  );
  const blockingReasons: string[] = [];

  if (cameraGroups.length === 0 || cameraGroups.some((group) => !group.isComplete)) {
    blockingReasons.push("camera-groups-incomplete");
  }
  const groupQuantityTotal = cameraGroups.every(
    (group) => group.quantity !== null,
  )
    ? safeSum(cameraGroups.map((group) => group.quantity!))
    : null;
  if (
    input.totalCameraQuantity === null ||
    !Number.isSafeInteger(input.totalCameraQuantity) ||
    input.totalCameraQuantity <= 0 ||
    groupQuantityTotal === null ||
    groupQuantityTotal !== input.totalCameraQuantity
  ) {
    blockingReasons.push("camera-quantity-mismatch");
  }
  if (recorder.status === "unresolved" || recorder.status === "invalid") {
    blockingReasons.push("recorder-unresolved");
  }
  if (hardDrive.status === "unresolved") {
    blockingReasons.push("hard-drive-unresolved");
  } else if (hardDrive.status === "manual-confirmation") {
    blockingReasons.push("hard-drive-manual-confirmation");
  }
  if (recorderConfiguration.status === "unresolved") {
    blockingReasons.push("recorder-configuration-unresolved");
  }

  const isPriceComplete = blockingReasons.length === 0;
  const rawTotalCop = isPriceComplete
    ? safeSum([
        ...cameraGroups.flatMap((group) =>
          group.groupSubtotalCop === null ? [] : [group.groupSubtotalCop],
        ),
        ...(recorder.priceCop === null ? [] : [recorder.priceCop]),
        ...(hardDrive.priceCop === null ? [] : [hardDrive.priceCop]),
        ...(recorderConfiguration.priceCop === null
          ? []
          : [recorderConfiguration.priceCop]),
      ])
    : null;

  return Object.freeze({
    systemTypeId: input.systemTypeId,
    cameraGroups,
    recorder,
    hardDrive,
    recorderConfiguration,
    rawTotalCop,
    finalTotalCop:
      rawTotalCop === null ? null : roundUpSecuritySystemTotal(rawTotalCop),
    isPriceComplete,
    blockingReasons: Object.freeze(blockingReasons),
    customerNotes: Object.freeze([SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE]),
  });
}
