export type PhoneCountryIso2 =
  | "CO"
  | "US"
  | "MX"
  | "ES"
  | "VE"
  | "EC"
  | "PE"
  | "CL"
  | "AR"
  | "BR"
  | "PA";

export type PhoneCountryDefinition = Readonly<{
  iso2: PhoneCountryIso2;
  name: string;
  callingCode: string;
}>;

export const DEFAULT_PHONE_COUNTRY_ISO2 =
  "CO" as const satisfies PhoneCountryIso2;

const PHONE_COUNTRY_DEFINITIONS_BY_ISO2 = Object.freeze({
  CO: Object.freeze({ iso2: "CO", name: "Colombia", callingCode: "+57" }),
  US: Object.freeze({
    iso2: "US",
    name: "Estados Unidos / Canadá",
    callingCode: "+1",
  }),
  MX: Object.freeze({ iso2: "MX", name: "México", callingCode: "+52" }),
  ES: Object.freeze({ iso2: "ES", name: "España", callingCode: "+34" }),
  VE: Object.freeze({ iso2: "VE", name: "Venezuela", callingCode: "+58" }),
  EC: Object.freeze({ iso2: "EC", name: "Ecuador", callingCode: "+593" }),
  PE: Object.freeze({ iso2: "PE", name: "Perú", callingCode: "+51" }),
  CL: Object.freeze({ iso2: "CL", name: "Chile", callingCode: "+56" }),
  AR: Object.freeze({ iso2: "AR", name: "Argentina", callingCode: "+54" }),
  BR: Object.freeze({ iso2: "BR", name: "Brasil", callingCode: "+55" }),
  PA: Object.freeze({ iso2: "PA", name: "Panamá", callingCode: "+507" }),
} satisfies Readonly<Record<PhoneCountryIso2, PhoneCountryDefinition>>);

export const PHONE_COUNTRY_DEFINITIONS: readonly PhoneCountryDefinition[] =
  Object.freeze(Object.values(PHONE_COUNTRY_DEFINITIONS_BY_ISO2));

export function isPhoneCountryIso2(value: string): value is PhoneCountryIso2 {
  return Object.prototype.hasOwnProperty.call(
    PHONE_COUNTRY_DEFINITIONS_BY_ISO2,
    value,
  );
}

export function getPhoneCountryDefinition(
  iso2: PhoneCountryIso2,
): PhoneCountryDefinition {
  return PHONE_COUNTRY_DEFINITIONS_BY_ISO2[iso2];
}
