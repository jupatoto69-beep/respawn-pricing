import {
  getPhoneCountryDefinition,
  type PhoneCountryIso2,
} from "./phone-country-catalog";

type QuotationPhoneDetails = Readonly<{
  customerPhoneCountryIso2: PhoneCountryIso2;
  customerPhoneNumber: string;
}>;

export function formatQuotationPhoneDisplay(
  details: QuotationPhoneDetails,
): string {
  if (details.customerPhoneNumber.length === 0) {
    return "";
  }

  const country = getPhoneCountryDefinition(details.customerPhoneCountryIso2);
  return `${country.callingCode} ${details.customerPhoneNumber}`;
}

export function formatQuotationPhoneE164(
  details: QuotationPhoneDetails,
): string {
  if (details.customerPhoneNumber.length === 0) {
    return "";
  }

  const country = getPhoneCountryDefinition(details.customerPhoneCountryIso2);
  return `${country.callingCode}${details.customerPhoneNumber}`;
}
