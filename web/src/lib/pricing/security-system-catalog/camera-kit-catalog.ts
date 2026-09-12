import { type AccessoryId } from "./accessory-catalog";
import { freezeCatalog, type PublishedSalePrice } from "./catalog-types";

export type CameraKit = Readonly<{
  id: string;
  name: string;
  systemType: "analog" | "ip" | "wifi";
  location: "interior" | "exterior";
  components: readonly Readonly<{
    accessoryId: AccessoryId;
    quantity: number;
  }>[];
}> &
  PublishedSalePrice;

export const CAMERA_KIT_CATALOG = freezeCatalog([
  {
    id: "kit-analog-2-mp-interior",
    name: "Analógico 2 MP interior",
    systemType: "analog",
    location: "interior",
    components: [
      {
        accessoryId: "accessory-a1a",
        quantity: 1,
      },
      {
        accessoryId: "accessory-balhd",
        quantity: 1,
      },
      {
        accessoryId: "accessory-dch",
        quantity: 1,
      },
      {
        accessoryId: "accessory-ca-in",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 50000,
  },
  {
    id: "kit-analog-2-mp-exterior",
    name: "Analógico 2 MP exterior",
    systemType: "analog",
    location: "exterior",
    components: [
      {
        accessoryId: "accessory-a1a",
        quantity: 1,
      },
      {
        accessoryId: "accessory-balhd",
        quantity: 1,
      },
      {
        accessoryId: "accessory-dch",
        quantity: 1,
      },
      {
        accessoryId: "accessory-caip55",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 50000,
  },
  {
    id: "kit-analog-3k-8-mp-interior",
    name: "Analógico 3K a 8 MP interior",
    systemType: "analog",
    location: "interior",
    components: [
      {
        accessoryId: "accessory-a1a",
        quantity: 1,
      },
      {
        accessoryId: "accessory-bal4k",
        quantity: 1,
      },
      {
        accessoryId: "accessory-dch",
        quantity: 1,
      },
      {
        accessoryId: "accessory-ca-in",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 50000,
  },
  {
    id: "kit-analog-3k-8-mp-exterior",
    name: "Analógico 3K a 8 MP exterior",
    systemType: "analog",
    location: "exterior",
    components: [
      {
        accessoryId: "accessory-a1a",
        quantity: 1,
      },
      {
        accessoryId: "accessory-bal4k",
        quantity: 1,
      },
      {
        accessoryId: "accessory-dch",
        quantity: 1,
      },
      {
        accessoryId: "accessory-caip55",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 50000,
  },
  {
    id: "kit-ip-cat-5e-interior",
    name: "IP Cat 5E interior",
    systemType: "ip",
    location: "interior",
    components: [
      {
        accessoryId: "accessory-rj45cat5ez",
        quantity: 2,
      },
      {
        accessoryId: "accessory-ca-in",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 25000,
  },
  {
    id: "kit-ip-cat-5e-exterior",
    name: "IP Cat 5E exterior",
    systemType: "ip",
    location: "exterior",
    components: [
      {
        accessoryId: "accessory-rj45cat5ez",
        quantity: 2,
      },
      {
        accessoryId: "accessory-caip55",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 25000,
  },
  {
    id: "kit-ip-cat-6-interior",
    name: "IP Cat 6 interior",
    systemType: "ip",
    location: "interior",
    components: [
      {
        accessoryId: "accessory-rj45cat6ez",
        quantity: 2,
      },
      {
        accessoryId: "accessory-ca-in",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 25000,
  },
  {
    id: "kit-ip-cat-6-exterior",
    name: "IP Cat 6 exterior",
    systemType: "ip",
    location: "exterior",
    components: [
      {
        accessoryId: "accessory-rj45cat6ez",
        quantity: 2,
      },
      {
        accessoryId: "accessory-caip55",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 25000,
  },
  {
    id: "kit-wifi-interior",
    name: "Wi-Fi interior",
    systemType: "wifi",
    location: "interior",
    components: [
      {
        accessoryId: "accessory-ca-in",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 15000,
  },
  {
    id: "kit-wifi-exterior",
    name: "Wi-Fi exterior",
    systemType: "wifi",
    location: "exterior",
    components: [
      {
        accessoryId: "accessory-caip55",
        quantity: 1,
      },
    ],
    pricingStatus: "priced",
    salePriceCop: 20000,
  },
] as const satisfies readonly CameraKit[]);

export type CameraKitId = (typeof CAMERA_KIT_CATALOG)[number]["id"];

export const CAMERA_KIT_CONDITIONS = Object.freeze({
  exclusions: "No incluye cableado, switch PoE, transporte ni mano de obra.",
  balunConfirmation:
    "Confirmar que BALHD y BAL4K correspondan al juego completo.",
});
