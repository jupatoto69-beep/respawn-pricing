import { describe, expect, it } from "vitest";

import { ANALOG_CAMERA_CATALOG } from "./security-system-catalog/analog-camera-catalog";
import { DVR_XVR_CATALOG } from "./security-system-catalog/dvr-xvr-catalog";
import { HARD_DRIVE_CATALOG } from "./security-system-catalog/hard-drive-catalog";
import { IP_CAMERA_CATALOG } from "./security-system-catalog/ip-camera-catalog";
import { NVR_CATALOG } from "./security-system-catalog/nvr-catalog";
import { WIFI_CAMERA_CATALOG } from "./security-system-catalog/wifi-camera-catalog";
import {
  SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS,
  SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS,
  type SecuritySystemInstallationTypeId,
} from "./security-system-options";
import {
  calculateSecuritySystemPrice,
  SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE,
  SECURITY_SYSTEM_NO_HARD_DRIVE,
  type SecuritySystemCameraGroupPricingInput,
  type SecuritySystemPricingInput,
} from "./security-system-pricing";

const analogCamera = ANALOG_CAMERA_CATALOG[0];
const ipCamera = IP_CAMERA_CATALOG[0];
const wifiCamera = WIFI_CAMERA_CATALOG[0];
const analogRecorder = DVR_XVR_CATALOG.find(
  (recorder) => recorder.brand === analogCamera.brand,
)!;
const ipRecorder = NVR_CATALOG.find(
  (recorder) => recorder.brand === ipCamera.brand,
)!;
const pricedHardDrive = HARD_DRIVE_CATALOG.find(
  (hardDrive) => hardDrive.pricingStatus === "priced",
)!;
const manualHardDrive = HARD_DRIVE_CATALOG.find(
  (hardDrive) => hardDrive.pricingStatus === "manual-confirmation",
)!;

function cameraGroup(
  overrides: Partial<SecuritySystemCameraGroupPricingInput> = {},
): SecuritySystemCameraGroupPricingInput {
  return {
    id: "group-1",
    camera: analogCamera,
    quantity: 2,
    accessorySelectionId:
      SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withoutAccessories,
    installationTypeId: "none",
    ...overrides,
  };
}

function analogInput(
  overrides: Partial<SecuritySystemPricingInput> = {},
): SecuritySystemPricingInput {
  return {
    systemTypeId: "analog",
    totalCameraQuantity: 2,
    cameraGroups: [cameraGroup()],
    recorder: analogRecorder,
    hardDrive: SECURITY_SYSTEM_NO_HARD_DRIVE,
    recorderConfigurationId:
      SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS.notIncluded,
    ...overrides,
  };
}

describe("calculateSecuritySystemPrice", () => {
  it("uses the published base camera price times quantity", () => {
    const result = calculateSecuritySystemPrice(analogInput());
    expect(result.cameraGroups[0].cameraUnitPriceCop).toBe(
      analogCamera.salePriceCop,
    );
    expect(result.cameraGroups[0].cameraSubtotalCop).toBe(
      analogCamera.salePriceCop * 2,
    );
  });

  it("uses the published with-accessories camera price without adding a kit", () => {
    const result = calculateSecuritySystemPrice(
      analogInput({
        totalCameraQuantity: 3,
        cameraGroups: [
          cameraGroup({
            quantity: 3,
            accessorySelectionId:
              SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withAccessories,
          }),
        ],
      }),
    );
    expect(result.cameraGroups[0].cameraUnitPriceCop).toBe(
      analogCamera.withAccessoriesSalePriceCop,
    );
    expect(result.cameraGroups[0].cameraSubtotalCop).toBe(
      analogCamera.withAccessoriesSalePriceCop * 3,
    );
  });

  it.each([
    ["none", 0],
    ["standard", 60_000],
    ["high", 80_000],
    ["special", 90_000],
  ] satisfies readonly [SecuritySystemInstallationTypeId, number][])(
    "prices %s installation per camera",
    (installationTypeId, pricePerCameraCop) => {
      const result = calculateSecuritySystemPrice(
        analogInput({
          totalCameraQuantity: 4,
          cameraGroups: [cameraGroup({ quantity: 4, installationTypeId })],
        }),
      );
      expect(result.cameraGroups[0].installationUnitPriceCop).toBe(
        pricePerCameraCop,
      );
      expect(result.cameraGroups[0].installationSubtotalCop).toBe(
        pricePerCameraCop * 4,
      );
    },
  );

  it("prices multiple groups independently", () => {
    const secondCamera = ANALOG_CAMERA_CATALOG.find(
      (camera) => camera.id !== analogCamera.id,
    )!;
    const result = calculateSecuritySystemPrice(
      analogInput({
        totalCameraQuantity: 3,
        cameraGroups: [
          cameraGroup({ quantity: 2, installationTypeId: "standard" }),
          cameraGroup({
            id: "group-2",
            camera: secondCamera,
            quantity: 1,
            accessorySelectionId:
              SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withAccessories,
            installationTypeId: "high",
          }),
        ],
      }),
    );
    expect(result.cameraGroups[0].groupSubtotalCop).toBe(
      analogCamera.salePriceCop * 2 + 120_000,
    );
    expect(result.cameraGroups[1].groupSubtotalCop).toBe(
      secondCamera.withAccessoriesSalePriceCop + 80_000,
    );
  });

  it("includes Analog and IP recorders exactly once", () => {
    const analog = calculateSecuritySystemPrice(analogInput());
    expect(analog.recorder.priceCop).toBe(analogRecorder.salePriceCop);

    const ip = calculateSecuritySystemPrice({
      systemTypeId: "ip",
      totalCameraQuantity: 2,
      cameraGroups: [cameraGroup({ camera: ipCamera })],
      recorder: ipRecorder,
      hardDrive: SECURITY_SYSTEM_NO_HARD_DRIVE,
      recorderConfigurationId:
        SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS.notIncluded,
    });
    expect(ip.recorder.priceCop).toBe(ipRecorder.salePriceCop);
  });

  it("accepts no disk and charges a priced disk at its published price", () => {
    const withoutDisk = calculateSecuritySystemPrice(analogInput());
    expect(withoutDisk.hardDrive.status).toBe("none");
    expect(withoutDisk.isPriceComplete).toBe(true);

    const withDisk = calculateSecuritySystemPrice(
      analogInput({ hardDrive: pricedHardDrive }),
    );
    expect(withDisk.hardDrive.priceCop).toBe(pricedHardDrive.salePriceCop);
    expect(withDisk.rawTotalCop! - withoutDisk.rawTotalCop!).toBe(
      pricedHardDrive.salePriceCop,
    );
  });

  it("never converts a manual-confirmation disk to zero", () => {
    const result = calculateSecuritySystemPrice(
      analogInput({ hardDrive: manualHardDrive }),
    );
    expect(result.hardDrive.status).toBe("manual-confirmation");
    expect(result.hardDrive.priceCop).toBeNull();
    expect(result.rawTotalCop).toBeNull();
    expect(result.finalTotalCop).toBeNull();
    expect(result.isPriceComplete).toBe(false);
    expect(result.blockingReasons).toContain(
      "hard-drive-manual-confirmation",
    );
  });

  it("charges recorder configuration once per complete system", () => {
    const withoutConfiguration = calculateSecuritySystemPrice(analogInput());
    const withConfiguration = calculateSecuritySystemPrice(
      analogInput({
        recorderConfigurationId:
          SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS.included,
      }),
    );
    expect(withConfiguration.recorderConfiguration.priceCop).toBe(50_000);
    expect(
      withConfiguration.rawTotalCop! - withoutConfiguration.rawTotalCop!,
    ).toBe(50_000);
  });

  it("keeps Wi-Fi recorder, disk and recorder configuration out of pricing", () => {
    const result = calculateSecuritySystemPrice({
      systemTypeId: "wifi",
      totalCameraQuantity: 2,
      cameraGroups: [cameraGroup({ camera: wifiCamera })],
      recorder: null,
      hardDrive: null,
      recorderConfigurationId: null,
    });
    expect(result.recorder.status).toBe("not-applicable");
    expect(result.hardDrive.status).toBe("not-applicable");
    expect(result.recorderConfiguration.status).toBe("not-applicable");
    expect(result.rawTotalCop).toBe(wifiCamera.salePriceCop * 2);
    expect(result.isPriceComplete).toBe(true);
  });

  it("withholds totals while a group commercial choice is unresolved", () => {
    const result = calculateSecuritySystemPrice(
      analogInput({
        cameraGroups: [cameraGroup({ accessorySelectionId: null })],
      }),
    );
    expect(result.isPriceComplete).toBe(false);
    expect(result.rawTotalCop).toBeNull();
  });

  it("withholds totals when grouped quantities do not match the system total", () => {
    const result = calculateSecuritySystemPrice(
      analogInput({ totalCameraQuantity: 3 }),
    );
    expect(result.isPriceComplete).toBe(false);
    expect(result.rawTotalCop).toBeNull();
    expect(result.blockingReasons).toContain("camera-quantity-mismatch");
  });

  it("rounds the final raw total upward once to COP 1,000", () => {
    const result = calculateSecuritySystemPrice(analogInput());
    expect(result.finalTotalCop).toBe(Math.ceil(result.rawTotalCop! / 1_000) * 1_000);
    expect(result.finalTotalCop! % 1_000).toBe(0);
  });

  it("does not increase an already exact COP 1,000 total", () => {
    const result = calculateSecuritySystemPrice(
      analogInput({
        totalCameraQuantity: 10,
        cameraGroups: [cameraGroup({ quantity: 10 })],
      }),
    );
    expect(result.rawTotalCop! % 1_000).toBe(0);
    expect(result.finalTotalCop).toBe(result.rawTotalCop);
  });

  it("represents cable only as the approved exclusion note", () => {
    const result = calculateSecuritySystemPrice(analogInput());
    expect(result.customerNotes).toEqual([SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE]);
    expect(JSON.stringify(result)).not.toMatch(/meters|meterPrice|cablePrice/i);
  });

  it("serializes only customer-safe pricing concepts", () => {
    const serialized = JSON.stringify(calculateSecuritySystemPrice(analogInput()));
    expect(serialized).not.toMatch(
      /supplier|purchasePrice|costPrice|margin|markup|profitability|threshold/i,
    );
  });
});
