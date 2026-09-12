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
      threeDPrintingRevision: 0,
      securitySystemsRevision: 0,
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
      threeDPrintingRevision: 0,
      securitySystemsRevision: 0,
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
      "Cotiza servicios por categoría según su estrategia.",
    );
  });

  it("exposes all four top-level pricing modes", () => {
    expect(PRICING_MODE_OPTIONS.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: PRICING_MODE_IDS.areaProducts, name: "Productos por área" },
      { id: PRICING_MODE_IDS.services, name: "Servicios" },
      { id: PRICING_MODE_IDS.threeDPrinting, name: "Impresión 3D" },
      { id: PRICING_MODE_IDS.securitySystems, name: "Sistemas de seguridad" },
    ]);
  });

  it("increments the isolated 3D revision every time its mode is re-entered", () => {
    const first = changePricingMode(
      createInitialPricingModeSelection(),
      PRICING_MODE_IDS.threeDPrinting,
    );
    const services = changePricingMode(first, PRICING_MODE_IDS.services);
    const second = changePricingMode(
      services,
      PRICING_MODE_IDS.threeDPrinting,
    );

    expect(second.threeDPrintingRevision).toBe(2);
    expect(second.servicesRevision).toBe(1);
  });

  it("increments the isolated Security Systems revision when re-entered", () => {
    const first = changePricingMode(
      createInitialPricingModeSelection(),
      PRICING_MODE_IDS.securitySystems,
    );
    const areaProducts = changePricingMode(
      first,
      PRICING_MODE_IDS.areaProducts,
    );
    const second = changePricingMode(
      areaProducts,
      PRICING_MODE_IDS.securitySystems,
    );

    expect(second.securitySystemsRevision).toBe(2);
    expect(second.areaProductsRevision).toBe(1);
  });
});
