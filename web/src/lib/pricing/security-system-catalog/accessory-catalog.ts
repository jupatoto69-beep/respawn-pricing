import { freezeCatalog, type Accessory } from "./catalog-types";

export const ACCESSORY_CATALOG = freezeCatalog([
  {
    id: "accessory-a1a",
    reference: "A1A",
    name: "Adaptador 12 V 1 A",
    pricingStatus: "priced",
    salePriceCop: 14000,
  },
  {
    id: "accessory-dch",
    reference: "DCH",
    name: "Conector hembra tornillo",
    pricingStatus: "priced",
    salePriceCop: 7000,
  },
  {
    id: "accessory-balhd",
    reference: "BALHD",
    name: "Video balun hasta 2 MP",
    pricingStatus: "priced",
    salePriceCop: 13000,
  },
  {
    id: "accessory-bal4k",
    reference: "BAL4K",
    name: "Video balun hasta 8 MP",
    pricingStatus: "priced",
    salePriceCop: 16000,
  },
  {
    id: "accessory-ca-in",
    reference: "CA-IN",
    name: "Caja plástica interior",
    pricingStatus: "priced",
    salePriceCop: 8000,
  },
  {
    id: "accessory-caip55",
    reference: "CAIP55",
    name: "Caja plástica exterior",
    pricingStatus: "priced",
    salePriceCop: 15000,
  },
  {
    id: "accessory-rj45cat5ez",
    reference: "RJ45CAT5EZ",
    name: "RJ45 categoría 5E EZ",
    pricingStatus: "priced",
    salePriceCop: 6000,
  },
  {
    id: "accessory-rj45cat6ez",
    reference: "RJ45CAT6EZ",
    name: "RJ45 categoría 6 EZ",
    pricingStatus: "priced",
    salePriceCop: 6000,
  },
  {
    id: "accessory-ram2",
    reference: "RAM2",
    name: "Ramal de voltaje 1 x 2",
    pricingStatus: "priced",
    salePriceCop: 9000,
  },
  {
    id: "accessory-ram4",
    reference: "RAM4",
    name: "Ramal de voltaje 1 x 4",
    pricingStatus: "priced",
    salePriceCop: 12000,
  },
  {
    id: "accessory-ram8",
    reference: "RAM8",
    name: "Ramal de voltaje 1 x 8",
    pricingStatus: "priced",
    salePriceCop: 16000,
  },
  {
    id: "accessory-fc10a9",
    reference: "FC10A9",
    name: "Fuente 10 A 9 salidas",
    pricingStatus: "priced",
    salePriceCop: 130000,
  },
  {
    id: "accessory-fc20a18",
    reference: "FC20A18",
    name: "Fuente 20 A 18 salidas",
    pricingStatus: "priced",
    salePriceCop: 175000,
  },
  {
    id: "accessory-fc30a18",
    reference: "FC30A18",
    name: "Fuente 30 A 18 salidas",
    pricingStatus: "priced",
    salePriceCop: 195000,
  },
] as const satisfies readonly Accessory[]);

export type AccessoryId = (typeof ACCESSORY_CATALOG)[number]["id"];

export function isAccessoryId(value: string): value is AccessoryId {
  return ACCESSORY_CATALOG.some((entry) => entry.id === value);
}
