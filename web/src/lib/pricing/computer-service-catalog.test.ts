import { describe, expect, it } from "vitest";

import {
  getComputerService,
  COMPUTER_SERVICE_IDS,
} from "./computer-service-catalog";
import {
  SOFTWARE_INSTALLATION_PRICING_TIER_IDS,
  SOFTWARE_INSTALLATION_PRICING_TIERS,
} from "./calculate-software-installation-price";

describe("computer service catalog", () => {
  it("exposes individual software installation as a quantity-tier service", () => {
    const service = getComputerService(
      COMPUTER_SERVICE_IDS.softwareInstallation,
    );

    expect(service).toMatchObject({
      id: COMPUTER_SERVICE_IDS.softwareInstallation,
      name: "Instalación individual de programas",
      pricingStrategy: "quantity-tier",
      unit: { singular: "programa", plural: "programas" },
      computerScope: { id: "one-computer", name: "Un computador" },
    });

    expect(
      service?.pricingStrategy === "quantity-tier"
        ? service.pricingTiers
        : null,
    ).toEqual(SOFTWARE_INSTALLATION_PRICING_TIERS);
    expect(SOFTWARE_INSTALLATION_PRICING_TIERS).toMatchObject({
      [SOFTWARE_INSTALLATION_PRICING_TIER_IDS.singleProgram]: {
        unitPrice: 70_000,
      },
      [SOFTWARE_INSTALLATION_PRICING_TIER_IDS.multiProgram]: {
        minimumProgramCount: 2,
        unitPrice: 50_000,
      },
    });
  });
});
