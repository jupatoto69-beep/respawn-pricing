import { describe, expect, it } from "vitest";

import {
  changeComputerServiceSelection,
  changeMaintenanceSelection,
  createInitialComputerServiceFormState,
} from "./computer-service-selection";
import {
  COMPUTER_SERVICE_IDS,
  MAINTENANCE_OPTION_IDS,
} from "./computer-service-catalog";

describe("computer service selection", () => {
  it("starts from a safe state", () => {
    expect(createInitialComputerServiceFormState()).toEqual({
      serviceId: "",
      quantity: "1",
      maintenance: { physical: false, system: false },
    });
  });

  it("resets service-only values when the selected service changes", () => {
    expect(
      changeComputerServiceSelection(
        {
          serviceId: COMPUTER_SERVICE_IDS.maintenance,
          quantity: "4",
          maintenance: { physical: true, system: true },
        },
        COMPUTER_SERVICE_IDS.officeInstallation,
      ),
    ).toEqual({
      serviceId: COMPUTER_SERVICE_IDS.officeInstallation,
      quantity: "1",
      maintenance: { physical: false, system: false },
    });
  });

  it("resets the program quantity when leaving software installation", () => {
    expect(
      changeComputerServiceSelection(
        {
          serviceId: COMPUTER_SERVICE_IDS.softwareInstallation,
          quantity: "5",
          maintenance: { physical: false, system: false },
        },
        COMPUTER_SERVICE_IDS.officeInstallation,
      ),
    ).toEqual({
      serviceId: COMPUTER_SERVICE_IDS.officeInstallation,
      quantity: "1",
      maintenance: { physical: false, system: false },
    });
  });

  it("changes each maintenance checkbox independently", () => {
    const physicalSelection = changeMaintenanceSelection(
      { physical: false, system: false },
      MAINTENANCE_OPTION_IDS.physical,
      true,
    );

    expect(
      changeMaintenanceSelection(
        physicalSelection,
        MAINTENANCE_OPTION_IDS.system,
        true,
      ),
    ).toEqual({ physical: true, system: true });
  });
});
