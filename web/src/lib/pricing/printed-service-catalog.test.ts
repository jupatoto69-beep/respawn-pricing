import { describe, expect, it } from "vitest";

import { BUSINESS_CARD_TYPE_IDS } from "./business-card-pricing";
import {
  BUSINESS_CARD_SERVICE,
  PRINTED_SERVICE_CATALOG,
  PRINTED_SERVICE_CATEGORY,
  PRINTED_SERVICE_IDS,
} from "./printed-service-catalog";

describe("printed service catalog", () => {
  it("exposes business cards as an isolated pricing strategy", () => {
    expect(PRINTED_SERVICE_CATEGORY).toEqual({
      id: "printed-products",
      name: "Impresos",
    });
    expect(PRINTED_SERVICE_CATALOG).toEqual([BUSINESS_CARD_SERVICE]);
    expect(BUSINESS_CARD_SERVICE).toMatchObject({
      id: PRINTED_SERVICE_IDS.businessCards,
      name: "Tarjetas de presentación",
      pricingStrategy: "business-card-pricing",
    });
  });

  it("offers only the confirmed glossy and matte UV card types", () => {
    expect(BUSINESS_CARD_SERVICE.cardTypes.map(({ id, name }) => ({ id, name })))
      .toEqual([
        { id: BUSINESS_CARD_TYPE_IDS.glossy, name: "Brillantes" },
        { id: BUSINESS_CARD_TYPE_IDS.matteUv, name: "Mate UV" },
      ]);
  });
});
