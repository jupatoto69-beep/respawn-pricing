import { describe, expect, it } from "vitest";

import {
  DEFAULT_PHONE_COUNTRY_ISO2,
  getPhoneCountryDefinition,
  PHONE_COUNTRY_DEFINITIONS,
  type PhoneCountryIso2,
} from "./phone-country-catalog";

const EXPECTED_COUNTRIES = Object.freeze([
  ["CO", "Colombia", "+57"],
  ["US", "Estados Unidos / Canadá", "+1"],
  ["MX", "México", "+52"],
  ["ES", "España", "+34"],
  ["VE", "Venezuela", "+58"],
  ["EC", "Ecuador", "+593"],
  ["PE", "Perú", "+51"],
  ["CL", "Chile", "+56"],
  ["AR", "Argentina", "+54"],
  ["BR", "Brasil", "+55"],
  ["PA", "Panamá", "+507"],
] as const satisfies readonly (readonly [PhoneCountryIso2, string, string])[]);

describe("phone country catalog", () => {
  it("uses Colombia as the default country and resolves +57", () => {
    expect(DEFAULT_PHONE_COUNTRY_ISO2).toBe("CO");
    expect(getPhoneCountryDefinition(DEFAULT_PHONE_COUNTRY_ISO2)).toEqual({
      iso2: "CO",
      name: "Colombia",
      callingCode: "+57",
    });
  });

  it.each(EXPECTED_COUNTRIES)(
    "resolves %s as %s (%s)",
    (iso2, name, callingCode) => {
      expect(getPhoneCountryDefinition(iso2)).toEqual({
        iso2,
        name,
        callingCode,
      });
    },
  );

  it("exposes every definition once in display order", () => {
    expect(PHONE_COUNTRY_DEFINITIONS).toHaveLength(EXPECTED_COUNTRIES.length);
    expect(PHONE_COUNTRY_DEFINITIONS.map(({ iso2 }) => iso2)).toEqual(
      EXPECTED_COUNTRIES.map(([iso2]) => iso2),
    );
    expect(Object.isFrozen(PHONE_COUNTRY_DEFINITIONS)).toBe(true);
    expect(
      PHONE_COUNTRY_DEFINITIONS.every((country) => Object.isFrozen(country)),
    ).toBe(true);
  });
});
