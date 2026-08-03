import { describe, expect, it } from "vitest";

import {
  changePricingMode,
  createInitialPricingModeSelection,
  PRICING_MODE_IDS,
  PRICING_MODE_OPTIONS,
} from "./pricing-mode-selection";

describe("pricing mode selection", () => {
  it("changes from Area products to Services with fresh service state", () => {
    const selection = changePricingMode(
      createInitialPricingModeSelection(),
      PRICING_MODE_IDS.services,
    );

    expect(selection).toEqual({
      modeId: PRICING_MODE_IDS.services,
      areaProductsRevision: 0,
      servicesRevision: 1,
    });
  });

  it("changes from Services to Area products with fresh area state", () => {
    const servicesSelection = createInitialPricingModeSelection(
      PRICING_MODE_IDS.services,
    );

    expect(
      changePricingMode(servicesSelection, PRICING_MODE_IDS.areaProducts),
    ).toEqual({
      modeId: PRICING_MODE_IDS.areaProducts,
      areaProductsRevision: 1,
      servicesRevision: 0,
    });
  });

  it("increments the service revision every time Services is re-entered", () => {
    const firstServicesSelection = changePricingMode(
      createInitialPricingModeSelection(),
      PRICING_MODE_IDS.services,
    );
    const areaSelection = changePricingMode(
      firstServicesSelection,
      PRICING_MODE_IDS.areaProducts,
    );
    const secondServicesSelection = changePricingMode(
      areaSelection,
      PRICING_MODE_IDS.services,
    );

    expect(secondServicesSelection.servicesRevision).toBe(2);
  });

  it("describes Services without presenting every strategy as fixed price", () => {
    const servicesOption = PRICING_MODE_OPTIONS.find(
      (option) => option.id === PRICING_MODE_IDS.services,
    );

    expect(servicesOption?.description).toBe(
      "Cotiza servicios para computadores según su estrategia.",
    );
  });
});
