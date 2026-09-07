import { describe, expect, it } from "vitest";

import {
  isSecuritySystemCustomPriceReasonId,
  isSecuritySystemInstallationTypeId,
  isSecuritySystemPresentationId,
  isSecuritySystemTypeId,
  SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS,
  SECURITY_SYSTEM_CUSTOM_PRICE_REASON_OPTIONS,
  SECURITY_SYSTEM_INSTALLATION_OPTIONS,
  SECURITY_SYSTEM_INSTALLATION_TYPE_IDS,
  SECURITY_SYSTEM_PRESENTATION_IDS,
  SECURITY_SYSTEM_PRESENTATION_OPTIONS,
  SECURITY_SYSTEM_TYPE_IDS,
  SECURITY_SYSTEM_TYPE_OPTIONS,
} from "./security-system-options";

describe("Security Systems options", () => {
  it("exposes the confirmed system type IDs and UI names", () => {
    expect(SECURITY_SYSTEM_TYPE_OPTIONS).toEqual([
      { id: SECURITY_SYSTEM_TYPE_IDS.analog, name: "Analógico" },
      { id: SECURITY_SYSTEM_TYPE_IDS.ip, name: "IP" },
      { id: SECURITY_SYSTEM_TYPE_IDS.wifi, name: "Wi-Fi" },
    ]);

    expect(
      SECURITY_SYSTEM_TYPE_OPTIONS.every(({ id }) =>
        isSecuritySystemTypeId(id),
      ),
    ).toBe(true);
    expect(isSecuritySystemTypeId("invalid")).toBe(false);
  });

  it("exposes only the confirmed installation IDs and per-camera prices", () => {
    expect(SECURITY_SYSTEM_INSTALLATION_OPTIONS).toEqual({
      [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.none]: {
        id: "none",
        name: "Sin instalación",
        pricePerCameraCop: 0,
      },
      [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.standard]: {
        id: "standard",
        name: "Estándar",
        pricePerCameraCop: 60_000,
      },
      [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.high]: {
        id: "high",
        name: "Más de 4 metros",
        pricePerCameraCop: 80_000,
      },
      [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.special]: {
        id: "special",
        name: "Especial / difícil",
        pricePerCameraCop: 90_000,
      },
    });

    expect(isSecuritySystemInstallationTypeId("standard")).toBe(true);
    expect(isSecuritySystemInstallationTypeId("invalid")).toBe(false);
  });

  it("represents itemized and bundled quotation presentation", () => {
    expect(SECURITY_SYSTEM_PRESENTATION_OPTIONS.map(({ id }) => id)).toEqual([
      SECURITY_SYSTEM_PRESENTATION_IDS.itemized,
      SECURITY_SYSTEM_PRESENTATION_IDS.bundled,
    ]);
    expect(isSecuritySystemPresentationId("itemized")).toBe(true);
    expect(isSecuritySystemPresentationId("bundled")).toBe(true);
    expect(isSecuritySystemPresentationId("private")).toBe(false);
  });

  it("exposes all confirmed custom-price reasons and free text for Other", () => {
    expect(SECURITY_SYSTEM_CUSTOM_PRICE_REASON_OPTIONS).toEqual([
      {
        id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.negotiatedPrice,
        name: "Precio negociado",
        allowsFreeText: false,
      },
      {
        id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.frequentCustomer,
        name: "Cliente frecuente",
        allowsFreeText: false,
      },
      {
        id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.competition,
        name: "Competencia",
        allowsFreeText: false,
      },
      {
        id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.catalogError,
        name: "Error de catálogo",
        allowsFreeText: false,
      },
      {
        id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.other,
        name: "Otro",
        allowsFreeText: true,
      },
    ]);

    expect(
      SECURITY_SYSTEM_CUSTOM_PRICE_REASON_OPTIONS.every(({ id }) =>
        isSecuritySystemCustomPriceReasonId(id),
      ),
    ).toBe(true);
    expect(isSecuritySystemCustomPriceReasonId("invalid")).toBe(false);
  });
});
