import { ACCESSORY_CATALOG } from "./accessory-catalog";
import { ANALOG_CAMERA_CATALOG } from "./analog-camera-catalog";
import { CAMERA_KIT_CATALOG } from "./camera-kit-catalog";
import { DVR_XVR_CATALOG } from "./dvr-xvr-catalog";
import { EXTERIOR_CABLE_CATALOG } from "./exterior-cable-catalog";
import { HARD_DRIVE_CATALOG } from "./hard-drive-catalog";
import { IP_CAMERA_CATALOG } from "./ip-camera-catalog";
import { NVR_CATALOG } from "./nvr-catalog";
import { POE_SWITCH_CATALOG } from "./poe-switch-catalog";
import { POWER_SUPPLY_CATALOG } from "./power-supply-catalog";
import { WIFI_CAMERA_CATALOG } from "./wifi-camera-catalog";

export const SECURITY_SYSTEM_CATALOGS = Object.freeze({
  analogCameras: ANALOG_CAMERA_CATALOG,
  dvrXvr: DVR_XVR_CATALOG,
  nvr: NVR_CATALOG,
  ipCameras: IP_CAMERA_CATALOG,
  wifiCameras: WIFI_CAMERA_CATALOG,
  hardDrives: HARD_DRIVE_CATALOG,
  poeSwitches: POE_SWITCH_CATALOG,
  powerSupplies: POWER_SUPPLY_CATALOG,
  exteriorCable: EXTERIOR_CABLE_CATALOG,
  accessories: ACCESSORY_CATALOG,
  cameraKits: CAMERA_KIT_CATALOG,
});

export type SecurityCatalogFamily = keyof typeof SECURITY_SYSTEM_CATALOGS;
export type SecurityCatalogEntry =
  (typeof SECURITY_SYSTEM_CATALOGS)[SecurityCatalogFamily][number];
export type SecurityCatalogId = SecurityCatalogEntry["id"];
export type SecurityCatalogIdFor<F extends SecurityCatalogFamily> =
  (typeof SECURITY_SYSTEM_CATALOGS)[F][number]["id"];

export function isSecurityCatalogId(value: string): value is SecurityCatalogId {
  return Object.values(SECURITY_SYSTEM_CATALOGS).some((catalog) =>
    catalog.some((entry) => entry.id === value),
  );
}

export function getSecurityCatalogEntry(
  id: string,
): SecurityCatalogEntry | null {
  for (const catalog of Object.values(SECURITY_SYSTEM_CATALOGS)) {
    const entry = catalog.find((candidate) => candidate.id === id);
    if (entry) return entry;
  }
  return null;
}
