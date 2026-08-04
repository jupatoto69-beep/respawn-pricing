import { describe, expect, it } from "vitest";

import { BUSINESS_CARD_TYPE_IDS } from "./business-card-pricing";
import {
  BUSINESS_CARD_SERVICE,
  PRINTED_SERVICE_CATALOG,
  PRINTED_SERVICE_CATEGORY,
  PRINTED_SERVICE_IDS,
  TABLOID_SERVICE,
} from "./printed-service-catalog";
import {
  TABLOID_ADHESIVE_FINISH_IDS,
  TABLOID_TYPE_IDS,
} from "./tabloid-pricing";

describe("printed service catalog", () => {
  it("exposes business cards as an isolated pricing strategy", () => {
    expect(PRINTED_SERVICE_CATEGORY).toEqual({
      id: "printed-products",
      name: "Impresos",
    });
    expect(PRINTED_SERVICE_CATALOG).toEqual([
      BUSINESS_CARD_SERVICE,
      TABLOID_SERVICE,
    ]);
    expect(BUSINESS_CARD_SERVICE).toMatchObject({
      id: PRINTED_SERVICE_IDS.businessCards,
      name: "Tarjetas de presentación",
      pricingStrategy: "business-card-pricing",
    });
  });

  it("exposes tabloids as a separate printed pricing strategy", () => {
    expect(TABLOID_SERVICE).toMatchObject({
      id: PRINTED_SERVICE_IDS.tabloids,
      name: "Tabloides",
      pricingStrategy: "tabloid-pricing",
    });
    expect(TABLOID_SERVICE.tabloidTypes.map(({ id, name }) => ({ id, name })))
      .toEqual([
        { id: TABLOID_TYPE_IDS.standard, name: "Tabloide estándar" },
        { id: TABLOID_TYPE_IDS.adhesive, name: "Tabloide adhesivo" },
      ]);
    expect(
      TABLOID_SERVICE.adhesiveFinishes.map(({ id, name }) => ({ id, name })),
    ).toEqual([
      {
        id: TABLOID_ADHESIVE_FINISH_IDS.standard,
        name: "Adhesivo estándar",
      },
      {
        id: TABLOID_ADHESIVE_FINISH_IDS.preCut,
        name: "Adhesivo precortado",
      },
    ]);
  });

  it("offers only the confirmed glossy and matte UV card types", () => {
    expect(BUSINESS_CARD_SERVICE.cardTypes.map(({ id, name }) => ({ id, name })))
      .toEqual([
        { id: BUSINESS_CARD_TYPE_IDS.glossy, name: "Brillantes" },
        { id: BUSINESS_CARD_TYPE_IDS.matteUv, name: "Mate UV" },
      ]);
  });
});
