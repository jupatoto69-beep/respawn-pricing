import { describe, expect, it } from "vitest";

import { calculateFixedPriceService } from "./calculate-fixed-price-service";
import { COMPUTER_SERVICE_IDS } from "./computer-service-catalog";

describe("calculateFixedPriceService", () => {
  it.each([
    [COMPUTER_SERVICE_IDS.officeInstallation, 1, 50_000, 50_000],
    [COMPUTER_SERVICE_IDS.officeInstallation, 2, 50_000, 100_000],
    [COMPUTER_SERVICE_IDS.hardDriveDataRecovery, 1, 70_000, 70_000],
    [COMPUTER_SERVICE_IDS.hardDriveDataRecovery, 2, 70_000, 140_000],
    [
      COMPUTER_SERVICE_IDS.passwordProtectedSystemAccess,
      1,
      90_000,
      90_000,
    ],
    [
      COMPUTER_SERVICE_IDS.passwordProtectedSystemAccess,
      2,
      90_000,
      180_000,
    ],
  ] as const)(
    "calculates %s with quantity %i",
    (serviceId, quantity, unitPrice, totalPrice) => {
      expect(calculateFixedPriceService(serviceId, quantity)).toEqual({
        quantity,
        unitPrice,
        totalPrice,
      });
    },
  );
});
