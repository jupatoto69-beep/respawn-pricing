import { describe, expect, it } from "vitest";

import { ANALOG_CAMERA_CATALOG } from "./security-system-catalog/analog-camera-catalog";
import { DVR_XVR_CATALOG } from "./security-system-catalog/dvr-xvr-catalog";
import { IP_CAMERA_CATALOG } from "./security-system-catalog/ip-camera-catalog";
import { NVR_CATALOG } from "./security-system-catalog/nvr-catalog";
import { WIFI_CAMERA_CATALOG } from "./security-system-catalog/wifi-camera-catalog";
import type { CameraBrand, CameraFormat } from "./security-system-catalog/catalog-types";
import {
  addSecuritySystemCameraGroup,
  changeSecuritySystemCameraBrand,
  changeSecuritySystemCameraGroupEnvironment,
  changeSecuritySystemCameraGroupFormat,
  changeSecuritySystemCameraGroupModel,
  changeSecuritySystemCameraGroupQuantity,
  changeSecuritySystemCameraResolution,
  changeSecuritySystemRecorder,
  changeSecuritySystemTotalCameraQuantity,
  changeSecuritySystemType,
  createInitialSecuritySystemCatalogSelection,
  filterSecuritySystemCameras,
  getAvailableCameraBrands,
  getAvailableCameraEnvironments,
  getAvailableCameraFormats,
  getAvailableCameraResolutionGroups,
  getCameraCatalogForSystemType,
  getCameraForGroup,
  getRecorderCandidates,
  getRecorderCatalogForSystemType,
  hasApprovedExteriorEvidence,
  isCameraCompatibleWithEnvironment,
  removeSecuritySystemCameraGroup,
  validateCameraGroupDistribution,
  validateSecuritySystemCameraQuantity,
  validateSecuritySystemConfiguration,
  type CameraEnvironment,
  type CameraResolutionGroup,
  type SecuritySystemCatalogSelection,
} from "./security-system-catalog-selection";
import type { SecuritySystemTypeId } from "./security-system-options";

function createBaseSelection({
  systemTypeId,
  brand,
  resolutionGroup,
  totalCameraQuantity = "1",
}: Readonly<{
  systemTypeId: SecuritySystemTypeId;
  brand: CameraBrand;
  resolutionGroup: CameraResolutionGroup;
  totalCameraQuantity?: string;
}>): SecuritySystemCatalogSelection {
  let selection = createInitialSecuritySystemCatalogSelection(systemTypeId);
  selection = changeSecuritySystemTotalCameraQuantity(
    selection,
    totalCameraQuantity,
  );
  selection = changeSecuritySystemCameraBrand(selection, brand);
  return changeSecuritySystemCameraResolution(selection, resolutionGroup);
}

function addConfiguredGroup(
  selection: SecuritySystemCatalogSelection,
  {
    id,
    environment,
    format,
    cameraId,
    quantity,
  }: Readonly<{
    id: string;
    environment: CameraEnvironment;
    format: CameraFormat;
    cameraId: string;
    quantity: string;
  }>,
): SecuritySystemCatalogSelection {
  let next = addSecuritySystemCameraGroup(selection, id);
  next = changeSecuritySystemCameraGroupEnvironment(next, id, environment);
  next = changeSecuritySystemCameraGroupFormat(next, id, format);
  next = changeSecuritySystemCameraGroupQuantity(next, id, quantity);
  return changeSecuritySystemCameraGroupModel(next, id, cameraId);
}

describe("Security Systems camera group catalog filtering", () => {
  it.each([
    ["analog", ANALOG_CAMERA_CATALOG],
    ["ip", IP_CAMERA_CATALOG],
    ["wifi", WIFI_CAMERA_CATALOG],
  ] as const)("%s uses only its approved camera catalog", (type, catalog) => {
    expect(getCameraCatalogForSystemType(type)).toBe(catalog);
    expect(catalog.every((camera) => camera.systemType === type)).toBe(true);
  });

  it("derives brands and resolution groups from actual catalog entries", () => {
    expect(getAvailableCameraBrands("analog")).toEqual([
      "Dahua",
      "Hikvision",
      "HiLook",
    ]);
    expect(getAvailableCameraResolutionGroups("analog", "HiLook")).toEqual([
      "2-mp",
      "3k-5-mp",
    ]);
  });

  it("accepts the explicit Exterior detail as approved evidence", () => {
    const explicitExterior = WIFI_CAMERA_CATALOG.find(
      ({ reference }) => reference === "DS-2CV2021G2-IDW(2.8mm)",
    )!;

    expect(hasApprovedExteriorEvidence(explicitExterior)).toBe(true);
    expect(isCameraCompatibleWithEnvironment(explicitExterior, "exterior")).toBe(
      true,
    );
  });

  it("accepts a real Analog IP66 camera for Exterior", () => {
    const camera = ANALOG_CAMERA_CATALOG.find(
      ({ reference }) => reference === "THC-B120-PC (2.8mm)",
    )!;

    expect(camera.description).toContain("IP66");
    expect(hasApprovedExteriorEvidence(camera)).toBe(true);
    expect(isCameraCompatibleWithEnvironment(camera, "exterior")).toBe(true);
  });

  it("accepts real Analog and IP cameras with IP67 for Exterior", () => {
    const analogCamera = ANALOG_CAMERA_CATALOG.find(
      ({ reference }) => reference === "DH-HAC-B1A21N-U-0280B",
    )!;
    const ipCamera = IP_CAMERA_CATALOG.find(
      ({ reference }) => reference === "DS-2CD1043G2-LIU(2.8mm)",
    )!;

    expect(analogCamera.description).toContain("IP67");
    expect(ipCamera.description).toContain("IP67");
    expect(isCameraCompatibleWithEnvironment(analogCamera, "exterior")).toBe(
      true,
    );
    expect(isCameraCompatibleWithEnvironment(ipCamera, "exterior")).toBe(true);
  });

  it("accepts a real Wi-Fi IP67 camera for Exterior", () => {
    const camera = WIFI_CAMERA_CATALOG.find(
      ({ reference }) => reference === "DH-IPC-F3DP-PV-0280B",
    )!;

    expect(camera.description).toContain("IP67");
    expect(isCameraCompatibleWithEnvironment(camera, "exterior")).toBe(true);
  });

  it("does not accept IP50 as sufficient Exterior evidence", () => {
    const camera = ANALOG_CAMERA_CATALOG.find(
      ({ reference }) => reference === "DH-HAC-HFW1800RN-0280B",
    )!;

    expect(camera.description).toContain("IP50");
    expect(hasApprovedExteriorEvidence(camera)).toBe(false);
    expect(isCameraCompatibleWithEnvironment(camera, "exterior")).toBe(false);
  });

  it("does not infer Exterior for a camera without approved evidence", () => {
    const camera = ANALOG_CAMERA_CATALOG.find(
      ({ reference }) => reference === "DH-HAC-T1A21N-U-028B",
    )!;

    expect(camera.description).not.toMatch(/exterior|\bIP6[67]\b/i);
    expect(hasApprovedExteriorEvidence(camera)).toBe(false);
    expect(isCameraCompatibleWithEnvironment(camera, "exterior")).toBe(false);
  });

  it("allows every catalog camera for Interior without invented restrictions", () => {
    for (const camera of [
      ...ANALOG_CAMERA_CATALOG,
      ...IP_CAMERA_CATALOG,
      ...WIFI_CAMERA_CATALOG,
    ]) {
      expect(isCameraCompatibleWithEnvironment(camera, "interior")).toBe(true);
    }
  });

  it("offers only environments that have compatible models", () => {
    expect(getAvailableCameraEnvironments("analog", "HiLook", "2-mp")).toEqual([
      "interior",
      "exterior",
    ]);
    expect(getAvailableCameraEnvironments("wifi", "Hikvision", "2-mp")).toEqual(
      ["interior", "exterior"],
    );
  });

  it("derives formats only after applying environment compatibility", () => {
    expect(
      getAvailableCameraFormats("wifi", "Hikvision", "2-mp", "exterior"),
    ).toEqual(["Bala"]);
    expect(
      getAvailableCameraFormats("wifi", "Hikvision", "2-mp", "interior"),
    ).toEqual(["Cubo", "PT", "Bala"]);
  });

  it("never exposes a format without compatible models", () => {
    for (const systemTypeId of ["analog", "ip", "wifi"] as const) {
      for (const brand of getAvailableCameraBrands(systemTypeId)) {
        for (const resolution of getAvailableCameraResolutionGroups(
          systemTypeId,
          brand,
        )) {
          for (const environment of getAvailableCameraEnvironments(
            systemTypeId,
            brand,
            resolution,
          )) {
            for (const format of getAvailableCameraFormats(
              systemTypeId,
              brand,
              resolution,
              environment,
            )) {
              expect(
                filterSecuritySystemCameras({
                  systemTypeId,
                  brand,
                  resolutionGroup: resolution,
                  environment,
                  format,
                }).length,
              ).toBeGreaterThan(0);
            }
          }
        }
      }
    }
  });

  it("keeps model selection explicit when a group is added", () => {
    const selection = addSecuritySystemCameraGroup(
      createBaseSelection({
        systemTypeId: "analog",
        brand: "HiLook",
        resolutionGroup: "2-mp",
      }),
      "group-a",
    );

    expect(selection.cameraGroups).toEqual([
      {
        id: "group-a",
        environment: null,
        format: null,
        quantity: "1",
        cameraId: null,
      },
    ]);
  });

  it("supports one complete group", () => {
    const selection = addConfiguredGroup(
      createBaseSelection({
        systemTypeId: "analog",
        brand: "HiLook",
        resolutionGroup: "2-mp",
      }),
      {
        id: "group-a",
        environment: "interior",
        format: "Turret",
        cameraId: "analog-camera-thc-t120-pc-2-8mm",
        quantity: "1",
      },
    );

    expect(validateSecuritySystemConfiguration(selection).isComplete).toBe(true);
    expect(getCameraForGroup(selection, selection.cameraGroups[0])?.reference).toBe(
      "THC-T120-PC (2.8mm)",
    );
  });

  it("allows multiple formats and a different model in each group", () => {
    let selection = createBaseSelection({
      systemTypeId: "analog",
      brand: "HiLook",
      resolutionGroup: "2-mp",
      totalCameraQuantity: "4",
    });
    selection = addConfiguredGroup(selection, {
      id: "bullets",
      environment: "interior",
      format: "Bala",
      cameraId: "analog-camera-thc-b120-pc-2-8mm",
      quantity: "2",
    });
    selection = addConfiguredGroup(selection, {
      id: "turrets",
      environment: "interior",
      format: "Turret",
      cameraId: "analog-camera-thc-t120-pc-2-8mm",
      quantity: "2",
    });

    expect(selection.cameraGroups.map(({ format }) => format)).toEqual([
      "Bala",
      "Turret",
    ]);
    expect(new Set(selection.cameraGroups.map(({ cameraId }) => cameraId)).size).toBe(
      2,
    );
    expect(validateSecuritySystemConfiguration(selection).isComplete).toBe(true);
  });

  it("allows Interior and Exterior groups to coexist", () => {
    let selection = createBaseSelection({
      systemTypeId: "wifi",
      brand: "Hikvision",
      resolutionGroup: "2-mp",
      totalCameraQuantity: "2",
    });
    selection = addConfiguredGroup(selection, {
      id: "inside",
      environment: "interior",
      format: "PT",
      cameraId: "wifi-camera-ds-2cv2q21g1-idw-w",
      quantity: "1",
    });
    selection = addConfiguredGroup(selection, {
      id: "outside",
      environment: "exterior",
      format: "Bala",
      cameraId: "wifi-camera-ds-2cv2021g2-idw-2-8mm",
      quantity: "1",
    });

    expect(selection.cameraGroups.map(({ environment }) => environment)).toEqual([
      "interior",
      "exterior",
    ]);
    expect(validateSecuritySystemConfiguration(selection).isComplete).toBe(true);
  });
});

describe("Security Systems group quantity validation", () => {
  const group = {
    id: "group-a",
    environment: null,
    format: null,
    quantity: "1",
    cameraId: null,
  } as const;

  it("accepts an exact group sum", () => {
    const result = validateCameraGroupDistribution("6", [
      { ...group, id: "a", quantity: "3" },
      { ...group, id: "b", quantity: "2" },
      { ...group, id: "c", quantity: "1" },
    ]);
    expect(result).toMatchObject({
      isValid: true,
      status: "exact",
      assignedQuantity: 6,
      remainingQuantity: 0,
    });
  });

  it("marks a lower sum as incomplete", () => {
    expect(
      validateCameraGroupDistribution("6", [
        { ...group, id: "a", quantity: "3" },
        { ...group, id: "b", quantity: "2" },
      ]),
    ).toMatchObject({
      isValid: false,
      status: "under",
      assignedQuantity: 5,
      remainingQuantity: 1,
    });
  });

  it("rejects a sum above the total", () => {
    expect(
      validateCameraGroupDistribution("6", [
        { ...group, id: "a", quantity: "3" },
        { ...group, id: "b", quantity: "2" },
        { ...group, id: "c", quantity: "2" },
      ]),
    ).toMatchObject({
      isValid: false,
      status: "over",
      assignedQuantity: 7,
      remainingQuantity: -1,
    });
  });

  it.each(["0", "-1", "1.5", "9007199254740992"])(
    "rejects invalid group quantity %j",
    (quantity) => {
      expect(
        validateCameraGroupDistribution("6", [{ ...group, quantity }]),
      ).toMatchObject({
        isValid: false,
        status: "invalid-group-quantity",
        invalidGroupIds: ["group-a"],
      });
    },
  );

  it("rejects a sum that exceeds the safe integer range", () => {
    expect(
      validateCameraGroupDistribution("9007199254740991", [
        { ...group, id: "a", quantity: "9007199254740991" },
        { ...group, id: "b", quantity: "1" },
      ]),
    ).toMatchObject({ isValid: false, status: "unsafe-sum" });
  });

  it("uses the same positive safe-integer validation for the total", () => {
    expect(validateSecuritySystemCameraQuantity(" 12 ")).toMatchObject({
      isValid: true,
      value: 12,
    });
    expect(validateCameraGroupDistribution("0", [])).toMatchObject({
      isValid: false,
      status: "invalid-total",
    });
  });

  it("updates assigned and remaining quantities after deleting a stable-ID group", () => {
    let selection = createBaseSelection({
      systemTypeId: "analog",
      brand: "HiLook",
      resolutionGroup: "2-mp",
      totalCameraQuantity: "4",
    });
    selection = addSecuritySystemCameraGroup(selection, "first-stable-id");
    selection = changeSecuritySystemCameraGroupQuantity(
      selection,
      "first-stable-id",
      "2",
    );
    selection = addSecuritySystemCameraGroup(selection, "second-stable-id");
    selection = changeSecuritySystemCameraGroupQuantity(
      selection,
      "second-stable-id",
      "2",
    );
    selection = removeSecuritySystemCameraGroup(selection, "first-stable-id");

    expect(selection.cameraGroups.map(({ id }) => id)).toEqual([
      "second-stable-id",
    ]);
    expect(
      validateCameraGroupDistribution(
        selection.totalCameraQuantity,
        selection.cameraGroups,
      ),
    ).toMatchObject({ assignedQuantity: 2, remainingQuantity: 2 });
  });
});

describe("Security Systems dependent group state", () => {
  function createWifiMixedSelection() {
    let selection = createBaseSelection({
      systemTypeId: "wifi",
      brand: "Hikvision",
      resolutionGroup: "2-mp",
      totalCameraQuantity: "2",
    });
    selection = addConfiguredGroup(selection, {
      id: "inside",
      environment: "interior",
      format: "PT",
      cameraId: "wifi-camera-ds-2cv2q21g1-idw-w",
      quantity: "1",
    });
    return addConfiguredGroup(selection, {
      id: "outside",
      environment: "exterior",
      format: "Bala",
      cameraId: "wifi-camera-ds-2cv2021g2-idw-2-8mm",
      quantity: "1",
    });
  }

  it("clears an incompatible format and model when environment changes", () => {
    const changed = changeSecuritySystemCameraGroupEnvironment(
      createWifiMixedSelection(),
      "inside",
      "exterior",
    );
    expect(changed.cameraGroups[0]).toMatchObject({
      id: "inside",
      environment: "exterior",
      format: null,
      cameraId: null,
      quantity: "1",
    });
  });

  it("clears an incompatible model when format changes", () => {
    const changed = changeSecuritySystemCameraGroupFormat(
      createWifiMixedSelection(),
      "inside",
      "Bala",
    );
    expect(changed.cameraGroups[0]).toMatchObject({
      format: "Bala",
      cameraId: null,
    });
  });

  it("revalidates every group and clears recorder when brand changes", () => {
    const changed = changeSecuritySystemCameraBrand(
      createWifiMixedSelection(),
      "Dahua",
    );
    expect(changed).toMatchObject({
      brand: "Dahua",
      resolutionGroup: null,
      recorderId: null,
    });
    expect(changed.cameraGroups).toEqual([
      {
        id: "inside",
        environment: null,
        format: null,
        cameraId: null,
        quantity: "1",
      },
      {
        id: "outside",
        environment: null,
        format: null,
        cameraId: null,
        quantity: "1",
      },
    ]);
  });

  it("revalidates every group when resolution changes", () => {
    const changed = changeSecuritySystemCameraResolution(
      createWifiMixedSelection(),
      "4-mp",
    );
    expect(changed.cameraGroups).toEqual([
      {
        id: "inside",
        environment: "interior",
        format: "PT",
        cameraId: null,
        quantity: "1",
      },
      {
        id: "outside",
        environment: "exterior",
        format: "Bala",
        cameraId: null,
        quantity: "1",
      },
    ]);
  });

  it("clears all groups and recorder when system type changes", () => {
    const selection = { ...createWifiMixedSelection(), recorderId: "stale" };
    expect(changeSecuritySystemType(selection, "ip")).toMatchObject({
      systemTypeId: "ip",
      brand: null,
      resolutionGroup: null,
      cameraGroups: [],
      recorderId: null,
    });
  });

  it("refuses a model outside its group filters", () => {
    const selection = createWifiMixedSelection();
    expect(
      changeSecuritySystemCameraGroupModel(
        selection,
        "inside",
        "wifi-camera-ds-2cv2021g2-idw-2-8mm",
      ),
    ).toBe(selection);
  });
});

describe("Security Systems recorder recommendations and boundaries", () => {
  it("uses DVR/XVR for Analog, NVR for IP, and no recorder for Wi-Fi", () => {
    expect(getRecorderCatalogForSystemType("analog")).toBe(DVR_XVR_CATALOG);
    expect(getRecorderCatalogForSystemType("ip")).toBe(NVR_CATALOG);
    expect(getRecorderCatalogForSystemType("wifi")).toEqual([]);
  });

  it("recommends Analog DVR/XVR using the total camera quantity", () => {
    const candidates = getRecorderCandidates("analog", "Dahua", 5);
    expect(candidates[0]).toMatchObject({
      isRecommended: true,
      recorder: { recorderType: "dvr-xvr", channels: 8 },
    });
  });

  it("recommends IP NVR using the total camera quantity", () => {
    const candidates = getRecorderCandidates("ip", "Hikvision", 10);
    expect(candidates[0]).toMatchObject({
      isRecommended: true,
      recorder: { recorderType: "nvr", channels: 16 },
    });
  });

  it("keeps insufficient same-brand recorders selectable with a warning", () => {
    const insufficient = getRecorderCandidates("ip", "Hikvision", 10).find(
      ({ recorder }) => recorder.channels === 4,
    );
    expect(insufficient).toMatchObject({
      compatibility: { hasWarning: true, isBlocking: false },
    });
  });

  it("keeps a selected recorder while a valid total change updates compatibility", () => {
    let selection = createBaseSelection({
      systemTypeId: "analog",
      brand: "HiLook",
      resolutionGroup: "2-mp",
      totalCameraQuantity: "4",
    });
    selection = changeSecuritySystemRecorder(selection, "dvr-xvr-dvr-104g-m1-c");
    selection = changeSecuritySystemTotalCameraQuantity(selection, "5");
    expect(selection.recorderId).toBe("dvr-xvr-dvr-104g-m1-c");
    expect(
      getRecorderCandidates("analog", "HiLook", 5).find(
        ({ recorder }) => recorder.id === selection.recorderId,
      )?.compatibility,
    ).toMatchObject({ hasWarning: true, isBlocking: false });
  });

  it("preserves published camera prices and returns original catalog objects", () => {
    const camera = filterSecuritySystemCameras({
      systemTypeId: "ip",
      brand: "Hikvision",
      resolutionGroup: "4-mp",
      environment: "interior",
      format: "Bala",
    }).find(({ id }) => id === "ip-camera-ds-2cd1043g2-liu-2-8mm");
    expect(camera).toBe(IP_CAMERA_CATALOG[17]);
    expect(camera).toMatchObject({
      salePriceCop: 395_000,
      withAccessoriesSalePriceCop: 420_000,
    });
  });

  it("does not introduce private fields in public selection results", () => {
    const publicResult = {
      cameras: filterSecuritySystemCameras({
        systemTypeId: "wifi",
        brand: "Hikvision",
        resolutionGroup: "2-mp",
        environment: "interior",
      }),
      recorders: getRecorderCandidates("ip", "Hikvision", 5),
    };
    expect(JSON.stringify(publicResult)).not.toMatch(
      /supplier|purchasePrice|margin|markup|profit|profitability|internalFormula/i,
    );
  });
});
