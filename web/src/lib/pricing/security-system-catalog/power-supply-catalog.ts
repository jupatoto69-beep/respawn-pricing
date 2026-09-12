import { freezeCatalog, type PowerSupply } from "./catalog-types";

export const POWER_SUPPLY_CATALOG = freezeCatalog([
  {
    id: "power-supply-fc10a9",
    reference: "FC10A9",
    amperes: 10,
    outputs: 9,
    description: "Fuente centralizada para sistemas CCTV",
    pricingStatus: "priced",
    salePriceCop: 130000,
  },
  {
    id: "power-supply-fc20a18",
    reference: "FC20A18",
    amperes: 20,
    outputs: 18,
    description: "Fuente centralizada para sistemas CCTV",
    pricingStatus: "priced",
    salePriceCop: 175000,
  },
  {
    id: "power-supply-fc30a18",
    reference: "FC30A18",
    amperes: 30,
    outputs: 18,
    description: "Fuente centralizada para sistemas CCTV",
    pricingStatus: "priced",
    salePriceCop: 195000,
  },
] as const satisfies readonly PowerSupply[]);
