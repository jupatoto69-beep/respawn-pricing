import { parsePositiveIntegerQuantity } from "./service-quantity";
import { SECURITY_SYSTEM_TYPE_IDS } from "./security-system-options";
import type { SecuritySystemTypeId } from "./security-system-options";
import { ANALOG_CAMERA_CATALOG } from "./security-system-catalog/analog-camera-catalog";
import type {
  Camera,
  CameraBrand,
  CameraFormat,
  Recorder,
} from "./security-system-catalog/catalog-types";
import { DVR_XVR_CATALOG } from "./security-system-catalog/dvr-xvr-catalog";
import { IP_CAMERA_CATALOG } from "./security-system-catalog/ip-camera-catalog";
import { NVR_CATALOG } from "./security-system-catalog/nvr-catalog";
import { WIFI_CAMERA_CATALOG } from "./security-system-catalog/wifi-camera-catalog";
import {
  checkRecorderCapacityCompatibility,
  type RecorderCapacityCompatibility,
} from "./recorder-capacity-compatibility";

export type CameraResolutionGroup = Camera["resolutionGroup"];
export type CameraEnvironment = "interior" | "exterior";

export const CAMERA_RESOLUTION_GROUP_NAMES: Readonly<
  Record<CameraResolutionGroup, string>
> = Object.freeze({
  "2-mp": "2 MP",
  "3k-5-mp": "3K / 5 MP",
  "8-mp-4k": "8 MP / 4K",
  "4-mp": "4 MP",
  "5-8-mp": "5 a 8 MP",
  "3-mp-2k": "3 MP / 2K",
  "3-mp": "3 MP",
  "5-mp": "5 MP",
  "6-mp-combined": "6 MP combinados",
  "10-mp-combined": "10 MP combinados",
});

export const CAMERA_ENVIRONMENT_NAMES: Readonly<Record<CameraEnvironment, string>> =
  Object.freeze({ interior: "Interior", exterior: "Exterior" });

const CAMERA_ENVIRONMENTS = Object.freeze([
  "interior",
  "exterior",
] as const satisfies readonly CameraEnvironment[]);

export function isCameraEnvironment(value: string): value is CameraEnvironment {
  return CAMERA_ENVIRONMENTS.some((environment) => environment === value);
}

export type CameraGroup = Readonly<{
  id: string;
  environment: CameraEnvironment | null;
  format: CameraFormat | null;
  quantity: string;
  cameraId: string | null;
}>;

export type SecuritySystemCameraFilters = Readonly<{
  systemTypeId: SecuritySystemTypeId;
  brand?: CameraBrand | null;
  resolutionGroup?: CameraResolutionGroup | null;
  environment?: CameraEnvironment | null;
  format?: CameraFormat | null;
}>;

export type SecuritySystemCatalogSelection = Readonly<{
  systemTypeId: SecuritySystemTypeId | null;
  totalCameraQuantity: string;
  brand: CameraBrand | null;
  resolutionGroup: CameraResolutionGroup | null;
  cameraGroups: readonly CameraGroup[];
  recorderId: string | null;
}>;

export type CameraQuantityValidation =
  | Readonly<{ isValid: true; value: number; errorMessage: null }>
  | Readonly<{ isValid: false; value: null; errorMessage: string }>;

export type CameraGroupDistributionValidation = Readonly<{
  isValid: boolean;
  status:
    | "exact"
    | "under"
    | "over"
    | "invalid-total"
    | "invalid-group-quantity"
    | "unsafe-sum";
  totalQuantity: number | null;
  assignedQuantity: number | null;
  remainingQuantity: number | null;
  invalidGroupIds: readonly string[];
  errorMessage: string | null;
}>;

export type SecuritySystemConfigurationValidation = Readonly<{
  isComplete: boolean;
  areCameraGroupsComplete: boolean;
  distribution: CameraGroupDistributionValidation;
}>;

export type RecorderCandidate = Readonly<{
  recorder: Recorder;
  compatibility: RecorderCapacityCompatibility;
  isRecommended: boolean;
}>;

function uniqueInCatalogOrder<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function freezeCameraGroup(group: CameraGroup): CameraGroup {
  return Object.freeze(group);
}

function freezeSelection(
  selection: SecuritySystemCatalogSelection,
): SecuritySystemCatalogSelection {
  return Object.freeze({
    ...selection,
    cameraGroups: Object.freeze(
      selection.cameraGroups.map((group) => freezeCameraGroup(group)),
    ),
  });
}

function replaceCameraGroup(
  selection: SecuritySystemCatalogSelection,
  groupId: string,
  update: (group: CameraGroup) => CameraGroup,
): SecuritySystemCatalogSelection {
  const index = selection.cameraGroups.findIndex((group) => group.id === groupId);
  if (index < 0) return selection;
  const currentGroup = selection.cameraGroups[index];
  const nextGroup = update(currentGroup);
  if (nextGroup === currentGroup) return selection;

  return freezeSelection({
    ...selection,
    cameraGroups: selection.cameraGroups.map((group, groupIndex) =>
      groupIndex === index ? nextGroup : group,
    ),
  });
}

export function getCameraCatalogForSystemType(
  systemTypeId: SecuritySystemTypeId,
): readonly Camera[] {
  switch (systemTypeId) {
    case SECURITY_SYSTEM_TYPE_IDS.analog:
      return ANALOG_CAMERA_CATALOG;
    case SECURITY_SYSTEM_TYPE_IDS.ip:
      return IP_CAMERA_CATALOG;
    case SECURITY_SYSTEM_TYPE_IDS.wifi:
      return WIFI_CAMERA_CATALOG;
  }
}

export function hasApprovedExteriorEvidence(camera: Camera): boolean {
  return camera.description.split(";").some((detail) => {
    const normalizedDetail = detail.trim().toLocaleLowerCase("es");

    return (
      normalizedDetail === "exterior" ||
      /\bip(?:66|67)\b/i.test(normalizedDetail)
    );
  });
}

export function isCameraCompatibleWithEnvironment(
  camera: Camera,
  environment: CameraEnvironment,
): boolean {
  return environment === "interior" || hasApprovedExteriorEvidence(camera);
}

export function filterSecuritySystemCameras({
  systemTypeId,
  brand,
  resolutionGroup,
  environment,
  format,
}: SecuritySystemCameraFilters): readonly Camera[] {
  return getCameraCatalogForSystemType(systemTypeId).filter(
    (camera) =>
      (!brand || camera.brand === brand) &&
      (!resolutionGroup || camera.resolutionGroup === resolutionGroup) &&
      (!environment || isCameraCompatibleWithEnvironment(camera, environment)) &&
      (!format || camera.format === format),
  );
}

export function getAvailableCameraBrands(
  systemTypeId: SecuritySystemTypeId,
): readonly CameraBrand[] {
  return uniqueInCatalogOrder(
    getCameraCatalogForSystemType(systemTypeId).map((camera) => camera.brand),
  );
}

export function getAvailableCameraResolutionGroups(
  systemTypeId: SecuritySystemTypeId,
  brand: CameraBrand,
): readonly CameraResolutionGroup[] {
  return uniqueInCatalogOrder(
    filterSecuritySystemCameras({ systemTypeId, brand }).map(
      (camera) => camera.resolutionGroup,
    ),
  );
}

export function getAvailableCameraEnvironments(
  systemTypeId: SecuritySystemTypeId,
  brand: CameraBrand,
  resolutionGroup: CameraResolutionGroup,
): readonly CameraEnvironment[] {
  return Object.freeze(
    CAMERA_ENVIRONMENTS.filter(
      (environment) =>
        filterSecuritySystemCameras({
          systemTypeId,
          brand,
          resolutionGroup,
          environment,
        }).length > 0,
    ),
  );
}

export function getAvailableCameraFormats(
  systemTypeId: SecuritySystemTypeId,
  brand: CameraBrand,
  resolutionGroup: CameraResolutionGroup,
  environment: CameraEnvironment,
): readonly CameraFormat[] {
  return uniqueInCatalogOrder(
    filterSecuritySystemCameras({
      systemTypeId,
      brand,
      resolutionGroup,
      environment,
    }).map((camera) => camera.format),
  );
}

export function validateSecuritySystemCameraQuantity(
  cameraQuantity: string,
): CameraQuantityValidation {
  try {
    return Object.freeze({
      isValid: true,
      value: parsePositiveIntegerQuantity(cameraQuantity),
      errorMessage: null,
    });
  } catch {
    return Object.freeze({
      isValid: false,
      value: null,
      errorMessage:
        "Ingresa una cantidad de cámaras que sea un entero seguro mayor que cero.",
    });
  }
}

export function validateCameraGroupDistribution(
  totalCameraQuantity: string,
  cameraGroups: readonly CameraGroup[],
): CameraGroupDistributionValidation {
  const total = validateSecuritySystemCameraQuantity(totalCameraQuantity);
  if (!total.isValid) {
    return Object.freeze({
      isValid: false,
      status: "invalid-total",
      totalQuantity: null,
      assignedQuantity: null,
      remainingQuantity: null,
      invalidGroupIds: Object.freeze([]),
      errorMessage: total.errorMessage,
    });
  }

  const quantities = cameraGroups.map((group) => ({
    group,
    validation: validateSecuritySystemCameraQuantity(group.quantity),
  }));
  const invalidGroupIds = quantities
    .filter(({ validation }) => !validation.isValid)
    .map(({ group }) => group.id);

  if (invalidGroupIds.length > 0) {
    return Object.freeze({
      isValid: false,
      status: "invalid-group-quantity",
      totalQuantity: total.value,
      assignedQuantity: null,
      remainingQuantity: null,
      invalidGroupIds: Object.freeze(invalidGroupIds),
      errorMessage:
        "Cada grupo debe tener una cantidad que sea un entero seguro mayor que cero.",
    });
  }

  let assignedQuantity = 0;
  for (const { validation } of quantities) {
    if (!validation.isValid) continue;
    assignedQuantity += validation.value;
    if (!Number.isSafeInteger(assignedQuantity)) {
      return Object.freeze({
        isValid: false,
        status: "unsafe-sum",
        totalQuantity: total.value,
        assignedQuantity: null,
        remainingQuantity: null,
        invalidGroupIds: Object.freeze([]),
        errorMessage: "La suma de cantidades excede el rango entero seguro.",
      });
    }
  }

  const remainingQuantity = total.value - assignedQuantity;
  const status =
    remainingQuantity === 0
      ? "exact"
      : remainingQuantity > 0
        ? "under"
        : "over";

  return Object.freeze({
    isValid: status === "exact",
    status,
    totalQuantity: total.value,
    assignedQuantity,
    remainingQuantity,
    invalidGroupIds: Object.freeze([]),
    errorMessage:
      status === "exact"
        ? null
        : status === "under"
          ? `${remainingQuantity} cámara${remainingQuantity === 1 ? "" : "s"} pendiente${remainingQuantity === 1 ? "" : "s"}.`
          : `${Math.abs(remainingQuantity)} cámara${remainingQuantity === -1 ? "" : "s"} por encima del total.`,
  });
}

export function isCameraGroupSelectionComplete(
  selection: SecuritySystemCatalogSelection,
  group: CameraGroup,
): boolean {
  if (
    !selection.systemTypeId ||
    !selection.brand ||
    !selection.resolutionGroup ||
    !group.environment ||
    !group.format ||
    !group.cameraId ||
    !validateSecuritySystemCameraQuantity(group.quantity).isValid
  ) {
    return false;
  }

  return getCameraForGroup(selection, group) !== null;
}

export function getCameraForGroup(
  selection: SecuritySystemCatalogSelection,
  group: CameraGroup,
): Camera | null {
  if (
    !selection.systemTypeId ||
    !selection.brand ||
    !selection.resolutionGroup ||
    !group.environment ||
    !group.format ||
    !group.cameraId
  ) {
    return null;
  }

  return filterSecuritySystemCameras({
    systemTypeId: selection.systemTypeId,
    brand: selection.brand,
    resolutionGroup: selection.resolutionGroup,
    environment: group.environment,
    format: group.format,
  }).find((camera) => camera.id === group.cameraId) ?? null;
}

export function validateSecuritySystemConfiguration(
  selection: SecuritySystemCatalogSelection,
): SecuritySystemConfigurationValidation {
  const distribution = validateCameraGroupDistribution(
    selection.totalCameraQuantity,
    selection.cameraGroups,
  );
  const areCameraGroupsComplete =
    selection.cameraGroups.length > 0 &&
    selection.cameraGroups.every((group) =>
      isCameraGroupSelectionComplete(selection, group),
    );

  return Object.freeze({
    isComplete:
      Boolean(
        selection.systemTypeId &&
          selection.brand &&
          selection.resolutionGroup,
      ) &&
      areCameraGroupsComplete &&
      distribution.isValid,
    areCameraGroupsComplete,
    distribution,
  });
}

export function getRecorderCatalogForSystemType(
  systemTypeId: SecuritySystemTypeId,
): readonly Recorder[] {
  switch (systemTypeId) {
    case SECURITY_SYSTEM_TYPE_IDS.analog:
      return DVR_XVR_CATALOG;
    case SECURITY_SYSTEM_TYPE_IDS.ip:
      return NVR_CATALOG;
    case SECURITY_SYSTEM_TYPE_IDS.wifi:
      return Object.freeze([]);
  }
}

export function getRecorderCandidates(
  systemTypeId: SecuritySystemTypeId,
  brand: CameraBrand,
  totalCameraQuantity: number,
): readonly RecorderCandidate[] {
  const candidates = getRecorderCatalogForSystemType(systemTypeId)
    .filter((recorder) => recorder.brand === brand)
    .map((recorder) => ({
      recorder,
      compatibility: checkRecorderCapacityCompatibility(
        totalCameraQuantity,
        recorder.channels,
      ),
    }))
    .sort((left, right) => {
      if (left.compatibility.hasWarning !== right.compatibility.hasWarning) {
        return left.compatibility.hasWarning ? 1 : -1;
      }
      if (!left.compatibility.hasWarning) {
        return left.recorder.channels - right.recorder.channels;
      }
      return 0;
    });

  return Object.freeze(
    candidates.map((candidate, index) =>
      Object.freeze({
        ...candidate,
        isRecommended: index === 0 && !candidate.compatibility.hasWarning,
      }),
    ),
  );
}

export function createCameraGroup(id: string): CameraGroup {
  if (!id.trim()) throw new RangeError("Camera group ID must not be empty.");
  return freezeCameraGroup({
    id,
    environment: null,
    format: null,
    quantity: "1",
    cameraId: null,
  });
}

export function createInitialSecuritySystemCatalogSelection(
  systemTypeId: SecuritySystemTypeId | null = null,
): SecuritySystemCatalogSelection {
  return freezeSelection({
    systemTypeId,
    totalCameraQuantity: "1",
    brand: null,
    resolutionGroup: null,
    cameraGroups: [],
    recorderId: null,
  });
}

function revalidateCameraGroup(
  group: CameraGroup,
  selection: Pick<
    SecuritySystemCatalogSelection,
    "systemTypeId" | "brand" | "resolutionGroup"
  >,
): CameraGroup {
  if (!selection.systemTypeId || !selection.brand || !selection.resolutionGroup) {
    return freezeCameraGroup({
      ...group,
      environment: null,
      format: null,
      cameraId: null,
    });
  }

  const environment =
    group.environment &&
    getAvailableCameraEnvironments(
      selection.systemTypeId,
      selection.brand,
      selection.resolutionGroup,
    ).includes(group.environment)
      ? group.environment
      : null;
  const format =
    environment &&
    group.format &&
    getAvailableCameraFormats(
      selection.systemTypeId,
      selection.brand,
      selection.resolutionGroup,
      environment,
    ).includes(group.format)
      ? group.format
      : null;
  const cameraId =
    environment &&
    format &&
    group.cameraId &&
    filterSecuritySystemCameras({
      systemTypeId: selection.systemTypeId,
      brand: selection.brand,
      resolutionGroup: selection.resolutionGroup,
      environment,
      format,
    }).some((camera) => camera.id === group.cameraId)
      ? group.cameraId
      : null;

  if (
    environment === group.environment &&
    format === group.format &&
    cameraId === group.cameraId
  ) {
    return group;
  }
  return freezeCameraGroup({ ...group, environment, format, cameraId });
}

export function changeSecuritySystemType(
  selection: SecuritySystemCatalogSelection,
  systemTypeId: SecuritySystemTypeId,
): SecuritySystemCatalogSelection {
  if (selection.systemTypeId === systemTypeId) return selection;
  return freezeSelection({
    ...selection,
    systemTypeId,
    brand: null,
    resolutionGroup: null,
    cameraGroups: [],
    recorderId: null,
  });
}

export function changeSecuritySystemTotalCameraQuantity(
  selection: SecuritySystemCatalogSelection,
  totalCameraQuantity: string,
): SecuritySystemCatalogSelection {
  if (selection.totalCameraQuantity === totalCameraQuantity) return selection;
  return freezeSelection({
    ...selection,
    totalCameraQuantity,
    recorderId: validateSecuritySystemCameraQuantity(totalCameraQuantity).isValid
      ? selection.recorderId
      : null,
  });
}

export function changeSecuritySystemCameraBrand(
  selection: SecuritySystemCatalogSelection,
  brand: CameraBrand,
): SecuritySystemCatalogSelection {
  if (
    !selection.systemTypeId ||
    !getAvailableCameraBrands(selection.systemTypeId).includes(brand)
  ) {
    return selection;
  }
  if (selection.brand === brand) return selection;

  const resolutionGroup =
    selection.resolutionGroup &&
    getAvailableCameraResolutionGroups(selection.systemTypeId, brand).includes(
      selection.resolutionGroup,
    )
      ? selection.resolutionGroup
      : null;
  const upperSelection = {
    systemTypeId: selection.systemTypeId,
    brand,
    resolutionGroup,
  };
  return freezeSelection({
    ...selection,
    brand,
    resolutionGroup,
    cameraGroups: selection.cameraGroups.map((group) =>
      revalidateCameraGroup(group, upperSelection),
    ),
    recorderId: null,
  });
}

export function changeSecuritySystemCameraResolution(
  selection: SecuritySystemCatalogSelection,
  resolutionGroup: CameraResolutionGroup,
): SecuritySystemCatalogSelection {
  if (
    !selection.systemTypeId ||
    !selection.brand ||
    !getAvailableCameraResolutionGroups(
      selection.systemTypeId,
      selection.brand,
    ).includes(resolutionGroup)
  ) {
    return selection;
  }
  if (selection.resolutionGroup === resolutionGroup) return selection;

  const upperSelection = {
    systemTypeId: selection.systemTypeId,
    brand: selection.brand,
    resolutionGroup,
  };
  return freezeSelection({
    ...selection,
    resolutionGroup,
    cameraGroups: selection.cameraGroups.map((group) =>
      revalidateCameraGroup(group, upperSelection),
    ),
  });
}

export function addSecuritySystemCameraGroup(
  selection: SecuritySystemCatalogSelection,
  groupId: string,
): SecuritySystemCatalogSelection {
  if (
    !selection.systemTypeId ||
    !selection.brand ||
    !selection.resolutionGroup ||
    !groupId.trim() ||
    selection.cameraGroups.some((group) => group.id === groupId)
  ) {
    return selection;
  }
  return freezeSelection({
    ...selection,
    cameraGroups: [...selection.cameraGroups, createCameraGroup(groupId)],
  });
}

export function removeSecuritySystemCameraGroup(
  selection: SecuritySystemCatalogSelection,
  groupId: string,
): SecuritySystemCatalogSelection {
  if (!selection.cameraGroups.some((group) => group.id === groupId)) {
    return selection;
  }
  return freezeSelection({
    ...selection,
    cameraGroups: selection.cameraGroups.filter((group) => group.id !== groupId),
  });
}

export function changeSecuritySystemCameraGroupQuantity(
  selection: SecuritySystemCatalogSelection,
  groupId: string,
  quantity: string,
): SecuritySystemCatalogSelection {
  return replaceCameraGroup(selection, groupId, (group) =>
    group.quantity === quantity
      ? group
      : freezeCameraGroup({ ...group, quantity }),
  );
}

export function changeSecuritySystemCameraGroupEnvironment(
  selection: SecuritySystemCatalogSelection,
  groupId: string,
  environment: CameraEnvironment,
): SecuritySystemCatalogSelection {
  if (
    !selection.systemTypeId ||
    !selection.brand ||
    !selection.resolutionGroup ||
    !getAvailableCameraEnvironments(
      selection.systemTypeId,
      selection.brand,
      selection.resolutionGroup,
    ).includes(environment)
  ) {
    return selection;
  }

  return replaceCameraGroup(selection, groupId, (group) => {
    if (group.environment === environment) return group;
    const format =
      group.format &&
      getAvailableCameraFormats(
        selection.systemTypeId!,
        selection.brand!,
        selection.resolutionGroup!,
        environment,
      ).includes(group.format)
        ? group.format
        : null;
    const cameraId =
      format &&
      group.cameraId &&
      filterSecuritySystemCameras({
        systemTypeId: selection.systemTypeId!,
        brand: selection.brand!,
        resolutionGroup: selection.resolutionGroup!,
        environment,
        format,
      }).some((camera) => camera.id === group.cameraId)
        ? group.cameraId
        : null;
    return freezeCameraGroup({ ...group, environment, format, cameraId });
  });
}

export function changeSecuritySystemCameraGroupFormat(
  selection: SecuritySystemCatalogSelection,
  groupId: string,
  format: CameraFormat,
): SecuritySystemCatalogSelection {
  if (!selection.systemTypeId || !selection.brand || !selection.resolutionGroup) {
    return selection;
  }

  return replaceCameraGroup(selection, groupId, (group) => {
    if (
      !group.environment ||
      !getAvailableCameraFormats(
        selection.systemTypeId!,
        selection.brand!,
        selection.resolutionGroup!,
        group.environment,
      ).includes(format)
    ) {
      return group;
    }
    if (group.format === format) return group;
    const cameraId =
      group.cameraId &&
      filterSecuritySystemCameras({
        systemTypeId: selection.systemTypeId!,
        brand: selection.brand!,
        resolutionGroup: selection.resolutionGroup!,
        environment: group.environment,
        format,
      }).some((camera) => camera.id === group.cameraId)
        ? group.cameraId
        : null;
    return freezeCameraGroup({ ...group, format, cameraId });
  });
}

export function changeSecuritySystemCameraGroupModel(
  selection: SecuritySystemCatalogSelection,
  groupId: string,
  cameraId: string,
): SecuritySystemCatalogSelection {
  if (!selection.systemTypeId || !selection.brand || !selection.resolutionGroup) {
    return selection;
  }

  return replaceCameraGroup(selection, groupId, (group) => {
    if (
      !group.environment ||
      !group.format ||
      !filterSecuritySystemCameras({
        systemTypeId: selection.systemTypeId!,
        brand: selection.brand!,
        resolutionGroup: selection.resolutionGroup!,
        environment: group.environment,
        format: group.format,
      }).some((camera) => camera.id === cameraId)
    ) {
      return group;
    }
    return group.cameraId === cameraId
      ? group
      : freezeCameraGroup({ ...group, cameraId });
  });
}

export function changeSecuritySystemRecorder(
  selection: SecuritySystemCatalogSelection,
  recorderId: string,
): SecuritySystemCatalogSelection {
  const quantity = validateSecuritySystemCameraQuantity(
    selection.totalCameraQuantity,
  );
  if (
    !selection.systemTypeId ||
    !selection.brand ||
    !quantity.isValid ||
    !getRecorderCandidates(
      selection.systemTypeId,
      selection.brand,
      quantity.value,
    ).some((candidate) => candidate.recorder.id === recorderId)
  ) {
    return selection;
  }
  return selection.recorderId === recorderId
    ? selection
    : freezeSelection({ ...selection, recorderId });
}
