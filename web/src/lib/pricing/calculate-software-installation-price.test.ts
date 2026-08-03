import { describe, expect, it } from "vitest";

import {
  calculateSoftwareInstallationPrice,
  SOFTWARE_INSTALLATION_PRICING_TIER_IDS,
} from "./calculate-software-installation-price";

const { singleProgram, multiProgram } =
  SOFTWARE_INSTALLATION_PRICING_TIER_IDS;

describe("calculateSoftwareInstallationPrice", () => {
  it.each([
    [1, singleProgram, 70_000, 70_000],
    [2, multiProgram, 50_000, 100_000],
    [3, multiProgram, 50_000, 150_000],
    [5, multiProgram, 50_000, 250_000],
  ] as const)(
    "calculates %i programs with the expected tier and price",
    (programCount, tierId, unitPrice, totalPrice) => {
      expect(calculateSoftwareInstallationPrice(programCount)).toEqual({
        programCount,
        tierId,
        unitPrice,
        totalPrice,
      });
    },
  );

  it("applies the multi-program tier at exactly two programs", () => {
    expect(calculateSoftwareInstallationPrice(2).tierId).toBe(multiProgram);
  });

  it("keeps the single-program unit price for one program", () => {
    expect(calculateSoftwareInstallationPrice(1)).toMatchObject({
      tierId: singleProgram,
      unitPrice: 70_000,
    });
  });

  it("uses the multi-program unit price from two programs onward", () => {
    expect(calculateSoftwareInstallationPrice(8)).toMatchObject({
      tierId: multiProgram,
      unitPrice: 50_000,
    });
  });
});
