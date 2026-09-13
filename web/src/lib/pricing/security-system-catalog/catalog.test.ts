import { describe, expect, expectTypeOf, it } from "vitest";

import { ACCESSORY_CATALOG, isAccessoryId } from "./accessory-catalog";
import { ANALOG_CAMERA_AVAILABILITY_NOTICES } from "./analog-camera-catalog";
import {
  CAMERA_KIT_CATALOG,
  CAMERA_KIT_CONDITIONS,
} from "./camera-kit-catalog";
import {
  getSecurityCatalogEntry,
  isSecurityCatalogId,
  SECURITY_SYSTEM_CATALOGS,
  type SecurityCatalogIdFor,
} from "./catalog";
import {
  hasPublishedSalePrice,
  type CatalogPrice,
  type PublishedSalePrice,
} from "./catalog-types";

const catalogs = SECURITY_SYSTEM_CATALOGS;
const allEntries = Object.values(catalogs).flat();

describe("approved Security Systems catalogs", () => {
  it("matches the product row counts on all fifteen source pages", () => {
    expect(
      Object.fromEntries(
        Object.entries(catalogs).map(([key, entries]) => [key, entries.length]),
      ),
    ).toEqual({
      analogCameras: 45,
      dvrXvr: 31,
      nvr: 26,
      ipCameras: 34,
      wifiCameras: 19,
      hardDrives: 12,
      poeSwitches: 14,
      powerSupplies: 3,
      exteriorCable: 9,
      accessories: 14,
      cameraKits: 10,
    });
    expect(allEntries).toHaveLength(217);
    expect(allEntries.filter(hasPublishedSalePrice)).toHaveLength(214);
  });

  it.each(Object.entries(catalogs))(
    "keeps %s IDs unique and literal data frozen",
    (_family, entries) => {
      expect(new Set(entries.map(({ id }) => id)).size).toBe(entries.length);
      expect(Object.isFrozen(entries)).toBe(true);
      for (const entry of entries) {
        expect(Object.isFrozen(entry)).toBe(true);
        expect(entry.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      }
    },
  );

  it("has globally unique IDs and safe lookup behavior", () => {
    expect(new Set(allEntries.map(({ id }) => id)).size).toBe(
      allEntries.length,
    );
    for (const entry of allEntries) {
      expect(isSecurityCatalogId(entry.id)).toBe(true);
      expect(getSecurityCatalogEntry(entry.id)).toBe(entry);
    }
    for (const id of [
      "",
      "invalid",
      "toString",
      "__proto__",
      "DH-XVR1B04-I-T",
    ]) {
      expect(isSecurityCatalogId(id)).toBe(false);
      expect(getSecurityCatalogEntry(id)).toBeNull();
    }
    expectTypeOf<SecurityCatalogIdFor<"accessories">>().toEqualTypeOf<
      (typeof ACCESSORY_CATALOG)[number]["id"]
    >();
  });

  it("stores only positive safe integers for published sale prices", () => {
    for (const entry of allEntries) {
      if (entry.pricingStatus === "priced") {
        expect(Number.isSafeInteger(entry.salePriceCop)).toBe(true);
        expect(entry.salePriceCop).toBeGreaterThan(0);
        expect(hasPublishedSalePrice(entry)).toBe(true);
      } else {
        expect(entry.salePriceCop).toBeNull();
        expect(hasPublishedSalePrice(entry)).toBe(false);
      }
      if ("withAccessoriesSalePriceCop" in entry) {
        expect(Number.isSafeInteger(entry.withAccessoriesSalePriceCop)).toBe(
          true,
        );
        expect(entry.withAccessoriesSalePriceCop).toBeGreaterThan(0);
      }
    }
  });

  it("requires manual confirmation for precisely the three unpublished disk prices", () => {
    expect(allEntries.filter((entry) => !hasPublishedSalePrice(entry))).toEqual(
      [
        expect.objectContaining({
          reference: "WD60PUR",
          capacity: 6,
          capacityUnit: "TB",
          pricingStatus: "manual-confirmation",
          salePriceCop: null,
        }),
        expect.objectContaining({
          reference: "WD80PUR",
          capacity: 8,
          capacityUnit: "TB",
          pricingStatus: "manual-confirmation",
          salePriceCop: null,
        }),
        expect.objectContaining({
          reference: "WD100PURZ",
          capacity: 10,
          capacityUnit: "TB",
          pricingStatus: "manual-confirmation",
          salePriceCop: null,
        }),
      ],
    );
  });

  it("keeps the unpublished HiLook row outside automatically quotable products", () => {
    expect(ANALOG_CAMERA_AVAILABILITY_NOTICES).toEqual([
      expect.objectContaining({
        brand: "HiLook",
        systemType: "analog",
        resolutionGroup: "8-mp-4k",
        reference: null,
        pricingStatus: "manual-confirmation",
        salePriceCop: null,
        withAccessoriesSalePriceCop: null,
      }),
    ]);
    const notice = ANALOG_CAMERA_AVAILABILITY_NOTICES[0];
    expect(hasPublishedSalePrice(notice)).toBe(false);
    expect(getSecurityCatalogEntry(notice.id)).toBeNull();
    expect(
      catalogs.analogCameras
        .filter((entry) => entry.resolutionGroup === "8-mp-4k")
        .map((entry) => entry.brand),
    ).not.toContain("HiLook");
  });

  it("narrows prices and rejects invalid numeric sale values", () => {
    const entry: CatalogPrice = {
      pricingStatus: "priced",
      salePriceCop: 90000,
    };
    if (hasPublishedSalePrice(entry))
      expectTypeOf(entry).toExtend<PublishedSalePrice>();
    for (const salePriceCop of [
      0,
      -1,
      0.5,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(
        hasPublishedSalePrice({ pricingStatus: "priced", salePriceCop }),
      ).toBe(false);
    }
    expect(
      hasPublishedSalePrice({
        pricingStatus: "manual-confirmation",
        salePriceCop: null,
      }),
    ).toBe(false);
  });

  it("preserves camera systems, published formats, brands and resolution group counts", () => {
    for (const [entries, systemType, counts] of [
      [
        catalogs.analogCameras,
        "analog",
        { "2-mp": 18, "3k-5-mp": 15, "8-mp-4k": 12 },
      ],
      [catalogs.ipCameras, "ip", { "2-mp": 14, "4-mp": 13, "5-8-mp": 7 }],
      [
        catalogs.wifiCameras,
        "wifi",
        {
          "2-mp": 5,
          "3-mp-2k": 2,
          "3-mp": 2,
          "4-mp": 3,
          "5-mp": 3,
          "6-mp-combined": 2,
          "10-mp-combined": 2,
        },
      ],
    ] as const) {
      const actual: Record<string, number> = {};
      for (const entry of entries) {
        expect(entry.systemType).toBe(systemType);
        expect(["Dahua", "Hikvision", "HiLook"]).toContain(entry.brand);
        expect([
          "Domo",
          "Bala",
          "Turret",
          "Mini bala",
          "Ojo de pez",
          "Cubo",
          "PT",
          "Dual PT",
        ]).toContain(entry.format);
        actual[entry.resolutionGroup] =
          (actual[entry.resolutionGroup] ?? 0) + 1;
      }
      expect(actual).toEqual(counts);
    }
  });

  it("distinguishes recorders and preserves channel and explicit PoE counts", () => {
    for (const [entries, recorderType, counts] of [
      [catalogs.dvrXvr, "dvr-xvr", { 4: 7, 8: 9, 16: 9, 32: 6 }],
      [catalogs.nvr, "nvr", { 4: 7, 8: 8, 16: 6, 32: 5 }],
    ] as const) {
      const actual: Record<number, number> = {};
      for (const entry of entries) {
        expect(entry.recorderType).toBe(recorderType);
        expect(entry.systemType).toBe(recorderType === "nvr" ? "ip" : "analog");
        expect(["Dahua", "Hikvision", "HiLook"]).toContain(entry.brand);
        expect(Number.isSafeInteger(entry.channels)).toBe(true);
        expect(entry.channels).toBeGreaterThan(0);
        actual[entry.channels] = (actual[entry.channels] ?? 0) + 1;
      }
      expect(actual).toEqual(counts);
    }
    for (const entry of catalogs.nvr) {
      expect(Number.isSafeInteger(entry.poePorts)).toBe(true);
      expect(entry.description).toContain(
        entry.poePorts === 0 ? "Sin PoE" : `${entry.poePorts} PoE`,
      );
    }
    for (const entry of catalogs.poeSwitches) {
      expect(["Hikvision", "Witek"]).toContain(entry.brand);
      expect([4, 8, 16, 24]).toContain(entry.poePorts);
    }
  });

  it("preserves complete cable presentations without per-meter pricing", () => {
    expect(
      catalogs.exteriorCable.filter(
        (entry) => entry.presentationLengthMeters === 100,
      ),
    ).toHaveLength(4);
    expect(
      catalogs.exteriorCable.filter(
        (entry) => entry.presentationLengthMeters === 305,
      ),
    ).toHaveLength(5);
    expect(
      catalogs.exteriorCable.filter((entry) => entry.category === "cat-5e"),
    ).toHaveLength(4);
    expect(
      catalogs.exteriorCable.filter((entry) => entry.category === "cat-6"),
    ).toHaveLength(5);
  });

  it("keeps repeated power-supply references consistent across classifications", () => {
    for (const supply of catalogs.powerSupplies) {
      expect(
        catalogs.accessories.find(
          (entry) => entry.reference === supply.reference,
        )?.salePriceCop,
      ).toBe(supply.salePriceCop);
      expect(supply.amperes).toBeGreaterThan(0);
      expect(supply.outputs).toBeGreaterThan(0);
    }
  });

  it("uses known accessory IDs and immutable kit compositions", () => {
    for (const kit of CAMERA_KIT_CATALOG) {
      expect(Object.isFrozen(kit.components)).toBe(true);
      for (const component of kit.components) {
        expect(isAccessoryId(component.accessoryId)).toBe(true);
        expect(Number.isSafeInteger(component.quantity)).toBe(true);
        expect(component.quantity).toBeGreaterThan(0);
        expect(Object.isFrozen(component)).toBe(true);
      }
    }
    expect(isAccessoryId("invalid")).toBe(false);
    expect(isAccessoryId("__proto__")).toBe(false);
    expect(CAMERA_KIT_CONDITIONS.exclusions).toContain("No incluye cableado");
    expect(CAMERA_KIT_CONDITIONS.balunConfirmation).toContain("BALHD y BAL4K");
  });
});
