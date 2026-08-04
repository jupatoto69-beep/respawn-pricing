import { describe, expect, it } from "vitest";

import {
  COMPUTER_SERVICE_CATALOG,
  COMPUTER_SERVICE_IDS,
} from "./computer-service-catalog";
import {
  PRINTED_SERVICE_CATALOG,
  PRINTED_SERVICE_IDS,
} from "./printed-service-catalog";
import {
  AUDIOVISUAL_SERVICE_IDS,
  getService,
  getServicesForCategory,
  SERVICE_CATEGORY_CATALOG,
  SERVICE_CATEGORY_IDS,
} from "./service-catalog";

describe("service category catalog", () => {
  it("exposes Computers, Audiovisual and Printed products independently", () => {
    expect(SERVICE_CATEGORY_CATALOG.map(({ id, name }) => ({ id, name }))).toEqual(
      [
        { id: SERVICE_CATEGORY_IDS.computers, name: "Computadores" },
        { id: SERVICE_CATEGORY_IDS.audiovisual, name: "Audiovisual" },
        { id: SERVICE_CATEGORY_IDS.printedProducts, name: "Impresos" },
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

  it("exposes business cards only under Printed products", () => {
    expect(
      getServicesForCategory(SERVICE_CATEGORY_IDS.printedProducts),
    ).toEqual(PRINTED_SERVICE_CATALOG);
    expect(
      getService(
        SERVICE_CATEGORY_IDS.printedProducts,
        PRINTED_SERVICE_IDS.businessCards,
      ),
    ).toMatchObject({
      name: "Tarjetas de presentación",
      pricingStrategy: "business-card-pricing",
    });
    expect(
      getService(
        SERVICE_CATEGORY_IDS.computers,
        PRINTED_SERVICE_IDS.businessCards,
      ),
    ).toBeNull();
    expect(
      getService(
        SERVICE_CATEGORY_IDS.audiovisual,
        PRINTED_SERVICE_IDS.businessCards,
      ),
    ).toBeNull();
  });

  it("exposes tabloids only under Printed products", () => {
    expect(
      getService(
        SERVICE_CATEGORY_IDS.printedProducts,
        PRINTED_SERVICE_IDS.tabloids,
      ),
    ).toMatchObject({
      name: "Tabloides",
      pricingStrategy: "tabloid-pricing",
    });
    expect(
      getService(SERVICE_CATEGORY_IDS.computers, PRINTED_SERVICE_IDS.tabloids),
    ).toBeNull();
    expect(
      getService(
        SERVICE_CATEGORY_IDS.audiovisual,
        PRINTED_SERVICE_IDS.tabloids,
      ),
    ).toBeNull();
  });
});
