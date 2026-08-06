import type {
  TemporaryQuotationDetails,
  TemporaryQuotationTextDetailField,
} from "./temporary-quotation";
import {
  getPhoneCountryDefinition,
  type PhoneCountryIso2,
} from "./phone-country-catalog";

export const TEMPORARY_QUOTATION_DETAIL_LIMITS = Object.freeze({
  customerName: 120,
  customerDocumentDigits: 15,
  customerPhoneNationalDigits: 14,
  customerPhoneE164Digits: 15,
  customerEmail: 254,
  customerCity: 100,
  notes: 1_000,
} as const);

export type TemporaryQuotationDetailErrors = Readonly<
  Partial<Record<TemporaryQuotationTextDetailField, string>>
>;

const DOCUMENT_ALLOWED_CHARACTERS = /^[0-9 -]+$/;
const PHONE_ALLOWED_CHARACTERS = /^[0-9]+$/;
const EMAIL_WITH_COMPLETE_DOMAIN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CITY_ALLOWED_CHARACTERS = /^[\p{L}\p{M} .'’\p{Pd}]+$/u;
const UNICODE_LETTER = /\p{L}/u;

const VALIDATED_DETAIL_FIELDS = Object.freeze([
  "customerName",
  "customerDocument",
  "customerPhoneNumber",
  "customerEmail",
  "customerCity",
  "notes",
] as const satisfies readonly TemporaryQuotationTextDetailField[]);

function isEmpty(value: string): boolean {
  return value.length === 0;
}

export function validateCustomerName(value: string): string | undefined {
  if (isEmpty(value)) {
    return undefined;
  }

  if (value.length > TEMPORARY_QUOTATION_DETAIL_LIMITS.customerName) {
    return "El nombre o empresa no puede superar 120 caracteres.";
  }

  if (value.trim().length < 2) {
    return "El nombre o empresa debe contener al menos 2 caracteres sin contar espacios al inicio o al final.";
  }

  return undefined;
}

export function validateCustomerDocument(value: string): string | undefined {
  if (isEmpty(value)) {
    return undefined;
  }

  if (!DOCUMENT_ALLOWED_CHARACTERS.test(value)) {
    return "El documento o NIT solo puede contener dígitos, espacios y guiones.";
  }

  const digitCount = value.replace(/[^0-9]/g, "").length;

  if (
    digitCount < 5 ||
    digitCount > TEMPORARY_QUOTATION_DETAIL_LIMITS.customerDocumentDigits
  ) {
    return "El documento o NIT debe contener entre 5 y 15 dígitos.";
  }

  return undefined;
}

export function isCustomerPhoneNumberInput(value: string): boolean {
  return value.length === 0 || PHONE_ALLOWED_CHARACTERS.test(value);
}

export function validateCustomerPhone(
  countryIso2: PhoneCountryIso2,
  value: string,
): string | undefined {
  if (isEmpty(value)) {
    return undefined;
  }

  if (!PHONE_ALLOWED_CHARACTERS.test(value)) {
    return "El teléfono debe escribirse sin código de país, espacios ni símbolos; usa únicamente dígitos del 0 al 9.";
  }

  if (
    value.length < 7 ||
    value.length >
      TEMPORARY_QUOTATION_DETAIL_LIMITS.customerPhoneNationalDigits
  ) {
    return "El teléfono debe contener entre 7 y 14 dígitos nacionales, sin código de país, espacios ni símbolos.";
  }

  const callingCodeDigitCount = getPhoneCountryDefinition(
    countryIso2,
  ).callingCode.slice(1).length;

  if (
    callingCodeDigitCount + value.length >
    TEMPORARY_QUOTATION_DETAIL_LIMITS.customerPhoneE164Digits
  ) {
    return "El código de país y el teléfono no pueden superar 15 dígitos en total; escribe el número sin código de país, espacios ni símbolos.";
  }

  return undefined;
}

export function validateCustomerEmail(value: string): string | undefined {
  if (isEmpty(value)) {
    return undefined;
  }

  if (value.length > TEMPORARY_QUOTATION_DETAIL_LIMITS.customerEmail) {
    return "El correo electrónico no puede superar 254 caracteres.";
  }

  if (!EMAIL_WITH_COMPLETE_DOMAIN.test(value)) {
    return "Ingresa un correo con usuario y dominio completo, por ejemplo nombre@dominio.com.";
  }

  return undefined;
}

export function validateCustomerCity(value: string): string | undefined {
  if (isEmpty(value)) {
    return undefined;
  }

  if (value.length > TEMPORARY_QUOTATION_DETAIL_LIMITS.customerCity) {
    return "La ciudad no puede superar 100 caracteres.";
  }

  if (value.trim().length < 2) {
    return "La ciudad debe contener al menos 2 caracteres sin contar espacios al inicio o al final.";
  }

  if (
    !CITY_ALLOWED_CHARACTERS.test(value) ||
    !UNICODE_LETTER.test(value)
  ) {
    return "La ciudad debe incluir letras y solo puede usar espacios, puntos, apóstrofes o guiones como separadores.";
  }

  return undefined;
}

export function validateQuotationNotes(value: string): string | undefined {
  if (isEmpty(value)) {
    return undefined;
  }

  if (value.length > TEMPORARY_QUOTATION_DETAIL_LIMITS.notes) {
    return "Las observaciones generales no pueden superar 1000 caracteres.";
  }

  return undefined;
}

export function validateTemporaryQuotationDetail(
  field: TemporaryQuotationTextDetailField,
  value: string,
  phoneCountryIso2: PhoneCountryIso2,
): string | undefined {
  switch (field) {
    case "customerName":
      return validateCustomerName(value);
    case "customerDocument":
      return validateCustomerDocument(value);
    case "customerPhoneNumber":
      return validateCustomerPhone(phoneCountryIso2, value);
    case "customerEmail":
      return validateCustomerEmail(value);
    case "customerCity":
      return validateCustomerCity(value);
    case "notes":
      return validateQuotationNotes(value);
  }
}

export function validateTemporaryQuotationDetails(
  details: TemporaryQuotationDetails,
): TemporaryQuotationDetailErrors {
  const errors: Partial<
    Record<TemporaryQuotationTextDetailField, string>
  > = {};

  for (const field of VALIDATED_DETAIL_FIELDS) {
    const error = validateTemporaryQuotationDetail(
      field,
      details[field],
      details.customerPhoneCountryIso2,
    );

    if (error !== undefined) {
      errors[field] = error;
    }
  }

  return Object.freeze(errors);
}
