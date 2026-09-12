import { describe, expect, it } from "vitest";

import { calculateSecuritySystemInstallationPrice } from "./calculate-security-system-installation-price";
import { SECURITY_SYSTEM_INSTALLATION_TYPE_IDS } from "./security-system-options";

describe("calculateSecuritySystemInstallationPrice", () => {
  it.each([
    [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.none, 3, 0, 0],
    [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.standard, 1, 60_000, 60_000],
    [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.standard, 3, 60_000, 180_000],
    [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.high, 2, 80_000, 160_000],
    [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.special, 2, 90_000, 180_000],
  ] as const)(
    "calculates %s installation for %i cameras",
    (installationTypeId, cameraQuantity, pricePerCameraCop, totalPriceCop) => {
      expect(
        calculateSecuritySystemInstallationPrice(
          cameraQuantity,
          installationTypeId,
        ),
      ).toEqual({
        cameraQuantity,
        installationTypeId,
        pricePerCameraCop,
        totalPriceCop,
      });
    },
  );

  it("rejects an invalid installation option", () => {
    expect(() =>
      calculateSecuritySystemInstallationPrice(1, "invalid"),
    ).toThrow("Security system installation type must be valid.");
  });

  it.each([null, undefined, 90_000, {}, []])(
    "rejects invalid runtime installation value %s",
    (installationTypeId) => {
      expect(() =>
        calculateSecuritySystemInstallationPrice(
          1,
          installationTypeId as unknown as string,
        ),
      ).toThrow(RangeError);
    },
  );

  it.each([
    [Number.NaN, "finite"],
    [Number.POSITIVE_INFINITY, "finite"],
    [Number.NEGATIVE_INFINITY, "finite"],
    [-1, "greater than zero"],
    [0, "greater than zero"],
    [1.5, "safe integer"],
    [Number.MAX_SAFE_INTEGER + 1, "safe integer"],
  ] as const)("rejects invalid camera quantity %s", (quantity, message) => {
    expect(() =>
      calculateSecuritySystemInstallationPrice(
        quantity,
        SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.standard,
      ),
    ).toThrow(message);
  });

  it("rejects installation totals outside the safe integer range", () => {
    expect(() =>
      calculateSecuritySystemInstallationPrice(
        Number.MAX_SAFE_INTEGER,
        SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.standard,
      ),
    ).toThrow("installation total must be a safe integer");
  });
});
