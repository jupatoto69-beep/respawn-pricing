import {
  updateQuotationDetails,
  type TemporaryQuotationState,
} from "@/lib/pricing/temporary-quotation";
import { DEFAULT_PHONE_COUNTRY_ISO2 } from "@/lib/pricing/phone-country-catalog";

import type { Customer } from "./customer";

export function applyCustomerSnapshotToQuotation(
  quotation: TemporaryQuotationState,
  customer: Customer,
): TemporaryQuotationState {
  return updateQuotationDetails(quotation, {
    customerName: customer.name,
    customerDocument: customer.document ?? "",
    customerPhoneCountryIso2:
      customer.phoneCountryIso2 ?? DEFAULT_PHONE_COUNTRY_ISO2,
    customerPhoneNumber: customer.phoneNumber ?? "",
    customerEmail: customer.email ?? "",
    customerCity: customer.city ?? "",
  });
}
