import { describe, expect, it } from "vitest";

import {
  COMPUTER_SERVICE_CATALOG,
  COMPUTER_SERVICE_IDS,
} from "./computer-service-catalog";
import {
  AUDIOVISUAL_SERVICE_IDS,
  getService,
  getServicesForCategory,
  SERVICE_CATEGORY_CATALOG,
  SERVICE_CATEGORY_IDS,
} from "./service-catalog";

describe("service category catalog", () => {
  it("exposes Computers and Audiovisual as the initial categories", () => {
    expect(SERVICE_CATEGORY_CATALOG.map(({ id, name }) => ({ id, name }))).toEqual(
      [
        { id: SERVICE_CATEGORY_IDS.computers, name: "Computadores" },
        { id: SERVICE_CATEGORY_IDS.audiovisual, name: "Audiovisual" },
      ],
    );
  });

  it("keeps every existing computer service under Computers", () => {
    expect(getServicesForCategory(SERVICE_CATEGORY_IDS.computers)).toEqual(
      COMPUTER_SERVICE_CATALOG,
    );
    expect(
      getService(
        SERVICE_CATEGORY_IDS.computers,
        COMPUTER_SERVICE_IDS.officeInstallation,
      ),
    ).not.toBeNull();
    expect(
      getService(
        SERVICE_CATEGORY_IDS.audiovisual,
        COMPUTER_SERVICE_IDS.officeInstallation,
      ),
    ).toBeNull();
  });

  it("exposes simple video editing only under Audiovisual", () => {
    expect(getServicesForCategory(SERVICE_CATEGORY_IDS.audiovisual)).toEqual([
      expect.objectContaining({
        id: AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing,
        name: "Edición de video sencilla",
        pricingStrategy: "duration",
      }),
    ]);
    expect(
      getService(
        SERVICE_CATEGORY_IDS.computers,
        AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing,
      ),
    ).toBeNull();
  });
});
