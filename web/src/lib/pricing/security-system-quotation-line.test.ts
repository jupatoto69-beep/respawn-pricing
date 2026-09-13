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
} from "./security-system-options";
import {
  createSecuritySystemQuotationLineDraft,
} from "./security-system-quotation-line";
import {
  calculateSecuritySystemPrice,
  SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE,
} from "./security-system-pricing";
import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
} from "./temporary-quotation";
import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "../quotation/business-profile";
import { createQuotationPreviewViewModel } from "../quotation/quotation-preview-view-model";

function createPricing() {
  const camera = ANALOG_CAMERA_CATALOG[0];
  const recorder = DVR_XVR_CATALOG.find(
    (candidate) => candidate.brand === camera.brand,
  )!;
  const hardDrive = HARD_DRIVE_CATALOG.find(
    (candidate) => candidate.pricingStatus === "priced",
  )!;
  return calculateSecuritySystemPrice({
    systemTypeId: "analog",
    totalCameraQuantity: 2,
    cameraGroups: [
      {
        id: "group-1",
        camera,
        quantity: 2,
        accessorySelectionId:
          SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withAccessories,
        installationTypeId: "standard",
      },
    ],
    recorder,
    hardDrive,
    recorderConfigurationId:
      SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS.included,
  });
}

describe("createSecuritySystemQuotationLineDraft", () => {
  it("keeps itemized and bundled mathematical totals identical", () => {
    const pricing = createPricing();
    const itemized = createSecuritySystemQuotationLineDraft(pricing, "itemized");
    const bundled = createSecuritySystemQuotationLineDraft(pricing, "bundled");
    expect(itemized.lineTotal).toBe(pricing.finalTotalCop);
    expect(bundled.lineTotal).toBe(itemized.lineTotal);
  });

  it("shows customer-safe component prices only in itemized details", () => {
    const pricing = createPricing();
    const itemized = createSecuritySystemQuotationLineDraft(pricing, "itemized");
    const bundled = createSecuritySystemQuotationLineDraft(pricing, "bundled");
    expect(itemized.details.map((detail) => detail.value).join(" ")).toContain(
      "COP",
    );
    expect(bundled.details.map((detail) => detail.value).join(" ")).not.toContain(
      "COP",
    );
    expect(bundled.details.map((detail) => detail.value).join(" ")).toContain(
      pricing.cameraGroups[0].cameraReference,
    );
  });

  it("carries the cable exclusion note through the quotation snapshot", () => {
    const line = createSecuritySystemQuotationLineDraft(createPricing(), "bundled");
    expect(line.details).toContainEqual({
      label: "Cableado",
      value: SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE,
    });
  });

  it("integrates the rounded system snapshot with quotation and preview", () => {
    const pricing = createPricing();
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createSecuritySystemQuotationLineDraft(pricing, "itemized"),
      new Date("2026-09-12T12:00:00-05:00"),
    );
    const total = calculateQuotationTotal(quotation);
    const preview = createQuotationPreviewViewModel({
      quotation,
      total,
      businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
    });
    expect(total).toBe(pricing.finalTotalCop);
    expect(preview.lines).toHaveLength(1);
    expect(preview.lines[0].lineTotal).toBe(pricing.finalTotalCop);
    expect(preview.lines[0].details).toContainEqual({
      label: "Cableado",
      value: SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE,
    });
  });

  it("adds valid IP and Wi-Fi systems through the same quotation domain", () => {
    const ipCamera = IP_CAMERA_CATALOG[0];
    const ipPricing = calculateSecuritySystemPrice({
      systemTypeId: "ip",
      totalCameraQuantity: 1,
      cameraGroups: [
        {
          id: "ip-group",
          camera: ipCamera,
          quantity: 1,
          accessorySelectionId:
            SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withoutAccessories,
          installationTypeId: "high",
        },
      ],
      recorder: NVR_CATALOG.find(
        (recorder) => recorder.brand === ipCamera.brand,
      )!,
      hardDrive: "none",
      recorderConfigurationId:
        SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS.notIncluded,
    });
    const wifiCamera = WIFI_CAMERA_CATALOG[0];
    const wifiPricing = calculateSecuritySystemPrice({
      systemTypeId: "wifi",
      totalCameraQuantity: 1,
      cameraGroups: [
        {
          id: "wifi-group",
          camera: wifiCamera,
          quantity: 1,
          accessorySelectionId:
            SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withAccessories,
          installationTypeId: "standard",
        },
      ],
      recorder: null,
      hardDrive: null,
      recorderConfigurationId: null,
    });
    let quotation = addQuotationLine(
      createEmptyQuotation(),
      createSecuritySystemQuotationLineDraft(ipPricing, "itemized"),
    );
    quotation = addQuotationLine(
      quotation,
      createSecuritySystemQuotationLineDraft(wifiPricing, "bundled"),
    );
    expect(quotation.lines.map((line) => line.title)).toEqual([
      "Sistema de seguridad — IP",
      "Sistema de seguridad — Wi-Fi",
    ]);
    expect(calculateQuotationTotal(quotation)).toBe(
      ipPricing.finalTotalCop! + wifiPricing.finalTotalCop!,
    );
  });

  it("rejects a result whose published price is incomplete", () => {
    const camera = ANALOG_CAMERA_CATALOG[0];
    const pricing = calculateSecuritySystemPrice({
      systemTypeId: "analog",
      totalCameraQuantity: 1,
      cameraGroups: [
        {
          id: "group-1",
          camera,
          quantity: 1,
          accessorySelectionId: null,
          installationTypeId: "none",
        },
      ],
      recorder: null,
      hardDrive: null,
      recorderConfigurationId: null,
    });
    expect(() =>
      createSecuritySystemQuotationLineDraft(pricing, "itemized"),
    ).toThrow(RangeError);
  });

  it("does not serialize private pricing concepts", () => {
    const line = createSecuritySystemQuotationLineDraft(createPricing(), "itemized");
    expect(JSON.stringify(line)).not.toMatch(
      /supplier|purchasePrice|costPrice|margin|markup|profitability|threshold/i,
    );
  });
});
