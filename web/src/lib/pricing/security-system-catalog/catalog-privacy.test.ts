import { describe, expect, it } from "vitest";
import { ANALOG_CAMERA_AVAILABILITY_NOTICES } from "./analog-camera-catalog";
import { CAMERA_KIT_CONDITIONS } from "./camera-kit-catalog";
import {
  SECURITY_SYSTEM_CATALOGS,
  type SecurityCatalogFamily,
} from "./catalog";

const common = ["id", "pricingStatus", "salePriceCop"];
const camera = [
  ...common,
  "brand",
  "reference",
  "systemType",
  "resolutionGroup",
  "format",
  "description",
  "withAccessoriesSalePriceCop",
];
const recorder = [
  ...common,
  "brand",
  "reference",
  "recorderType",
  "systemType",
  "channels",
  "description",
];
const publicFields: Record<SecurityCatalogFamily, readonly string[]> = {
  analogCameras: camera,
  ipCameras: camera,
  wifiCameras: camera,
  dvrXvr: recorder,
  nvr: [...recorder, "poePorts"],
  hardDrives: [
    ...common,
    "line",
    "reference",
    "capacity",
    "capacityUnit",
    "conditionAndWarranty",
  ],
  poeSwitches: [...common, "brand", "reference", "poePorts", "description"],
  powerSupplies: [...common, "reference", "amperes", "outputs", "description"],
  exteriorCable: [
    ...common,
    "reference",
    "category",
    "presentationLengthMeters",
    "construction",
  ],
  accessories: [...common, "reference", "name"],
  cameraKits: [...common, "name", "systemType", "location", "components"],
};

describe("Security Systems public data boundary", () => {
  it("exposes only the explicitly approved fields for each family", () => {
    for (const family of Object.keys(
      SECURITY_SYSTEM_CATALOGS,
    ) as SecurityCatalogFamily[]) {
      for (const item of SECURITY_SYSTEM_CATALOGS[family]) {
        expect(Object.keys(item).sort()).toEqual(
          [...publicFields[family]].sort(),
        );
        for (const [key, value] of Object.entries(item)) {
          if (key === "components") {
            for (const component of value as readonly object[]) {
              expect(Object.keys(component).sort()).toEqual([
                "accessoryId",
                "quantity",
              ]);
              expect(
                Object.values(component).every(
                  (part) =>
                    typeof part === "string" || typeof part === "number",
                ),
              ).toBe(true);
            }
          } else {
            expect(
              value === null ||
                typeof value === "string" ||
                typeof value === "number",
            ).toBe(true);
          }
        }
      }
    }
    expect(Object.keys(ANALOG_CAMERA_AVAILABILITY_NOTICES[0]).sort()).toEqual(
      [
        ...common,
        "systemType",
        "brand",
        "resolutionGroup",
        "reference",
        "withAccessoriesSalePriceCop",
        "description",
      ].sort(),
    );
    expect(Object.keys(CAMERA_KIT_CONDITIONS).sort()).toEqual([
      "balunConfirmation",
      "exclusions",
    ]);
  });

  it("rejects private field names recursively, including nested kit objects", () => {
    const forbiddenFieldNames = [
      "cost",
      "catalogCost",
      "supplier",
      "supplierCost",
      "supplierName",
      "purchase",
      "purchasePrice",
      "margin",
      "markup",
      "profit",
      "profitability",
      "multiplier",
      "precioCatalogo",
      "costo",
      "proveedor",
      "margen",
      "rentabilidad",
    ];
    function inspect(value: unknown): void {
      if (value === null || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        for (const forbidden of forbiddenFieldNames) {
          expect(key.toLowerCase()).not.toContain(forbidden.toLowerCase());
        }
        inspect(child);
      }
    }
    inspect(SECURITY_SYSTEM_CATALOGS);
    inspect(ANALOG_CAMERA_AVAILABILITY_NOTICES);
    inspect(CAMERA_KIT_CONDITIONS);
  });
});
