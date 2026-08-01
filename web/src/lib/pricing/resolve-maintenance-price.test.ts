import { describe, expect, it } from "vitest";

import { MAINTENANCE_OPTION_IDS } from "./computer-service-catalog";
import {
  calculateMaintenancePrice,
  COMPLETE_MAINTENANCE_PACKAGE_NAME,
  resolveMaintenancePrice,
} from "./resolve-maintenance-price";

describe("resolveMaintenancePrice", () => {
  it("resolves physical maintenance only to COP 70,000", () => {
    expect(
      resolveMaintenancePrice({ physical: true, system: false }),
    ).toEqual({
      selectedOptionIds: [MAINTENANCE_OPTION_IDS.physical],
      packageName: null,
      unitPrice: 70_000,
    });
  });

  it("resolves system maintenance only to COP 70,000", () => {
    expect(
      resolveMaintenancePrice({ physical: false, system: true }),
    ).toEqual({
      selectedOptionIds: [MAINTENANCE_OPTION_IDS.system],
      packageName: null,
      unitPrice: 70_000,
    });
  });

  it("uses the COP 120,000 complete-maintenance bundle for both options", () => {
    expect(
      resolveMaintenancePrice({ physical: true, system: true }),
    ).toEqual({
      selectedOptionIds: [
        MAINTENANCE_OPTION_IDS.physical,
        MAINTENANCE_OPTION_IDS.system,
      ],
      packageName: COMPLETE_MAINTENANCE_PACKAGE_NAME,
      unitPrice: 120_000,
    });
  });

  it("returns an invalid state when no maintenance option is selected", () => {
    expect(
      resolveMaintenancePrice({ physical: false, system: false }),
    ).toBeNull();
  });
});

describe("calculateMaintenancePrice", () => {
  it.each([
    [{ physical: true, system: false }, 70_000],
    [{ physical: false, system: true }, 70_000],
    [{ physical: true, system: true }, 120_000],
  ])(
    "calculates a selected maintenance for quantity one",
    (selection, totalPrice) => {
      expect(calculateMaintenancePrice(selection, 1)).toMatchObject({
        quantity: 1,
        totalPrice,
      });
    },
  );

  it("calculates two complete maintenances as COP 240,000", () => {
    expect(
      calculateMaintenancePrice({ physical: true, system: true }, 2),
    ).toMatchObject({
      unitPrice: 120_000,
      quantity: 2,
      totalPrice: 240_000,
    });
  });

  it("does not calculate a total without a selected option", () => {
    expect(
      calculateMaintenancePrice({ physical: false, system: false }, 1),
    ).toBeNull();
  });
});
