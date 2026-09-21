import {
  validateCustomerCity,
  validateCustomerDocument,
  validateCustomerEmail,
  validateCustomerName,
  validateCustomerPhone,
} from "@/lib/pricing/temporary-quotation-details-validation";

import type { CustomerInput } from "./customer";

export type CustomerInputField = keyof CustomerInput;

export type CustomerValidationErrors = Readonly<
  Partial<Record<CustomerInputField, string>>
>;

export function validateCustomerInput(
  input: CustomerInput,
): CustomerValidationErrors {
  const errors: Partial<Record<CustomerInputField, string>> = {};
  const normalizedName = input.name.trim();

  if (!normalizedName) {
    errors.name = "Ingresa el nombre o la empresa del cliente.";
  } else {
    const nameError = validateCustomerName(input.name);

    if (nameError) {
      errors.name = nameError;
    }
  }

  const optionalErrors = {
    document: validateCustomerDocument(input.document),
    phoneNumber: validateCustomerPhone(
      input.phoneCountryIso2,
      input.phoneNumber,
    ),
    email: validateCustomerEmail(input.email),
    city: validateCustomerCity(input.city),
  } as const;

  for (const [field, message] of Object.entries(optionalErrors) as Array<
    [keyof typeof optionalErrors, string | undefined]
  >) {
    if (message) {
      errors[field] = message;
    }
  }

  return Object.freeze(errors);
}

export function normalizeCustomerInput(input: CustomerInput): CustomerInput {
  return Object.freeze({
    name: input.name.trim(),
    document: input.document.trim(),
    phoneCountryIso2: input.phoneCountryIso2,
    phoneNumber: input.phoneNumber.trim(),
    email: input.email.trim(),
    city: input.city.trim(),
  });
}

export function isCustomerInputValid(input: CustomerInput): boolean {
  return Object.keys(validateCustomerInput(input)).length === 0;
}
