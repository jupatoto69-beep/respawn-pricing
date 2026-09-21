import { describe, expect, it } from "vitest";

import type { CustomerInput } from "./customer";
import {
  isCustomerInputValid,
  normalizeCustomerInput,
  validateCustomerInput,
} from "./customer-validation";

const VALID_CUSTOMER: CustomerInput = {
  name: "Empresa Ficción Lunar SAS",
  document: "900 555 444-1",
  phoneCountryIso2: "CO",
  phoneNumber: "3205550199",
  email: "compras@ficcion-lunar.example",
  city: "Villa Imaginaria",
};

describe("customer validation", () => {
  it("requires a customer name or company", () => {
    expect(validateCustomerInput({ ...VALID_CUSTOMER, name: "   " })).toEqual({
      name: "Ingresa el nombre o la empresa del cliente.",
    });
  });

  it("accepts valid optional customer fields", () => {
    expect(validateCustomerInput(VALID_CUSTOMER)).toEqual({});
    expect(isCustomerInputValid(VALID_CUSTOMER)).toBe(true);
  });

  it("allows every optional field to be absent", () => {
    expect(
      validateCustomerInput({
        ...VALID_CUSTOMER,
        document: "",
        phoneNumber: "",
        email: "",
        city: "",
      }),
    ).toEqual({});
  });

  it("uses the quotation-compatible validation rules", () => {
    const errors = validateCustomerInput({
      ...VALID_CUSTOMER,
      document: "ABC",
      phoneNumber: "123",
      email: "correo-incompleto",
      city: "1",
    });

    expect(Object.keys(errors).sort()).toEqual([
      "city",
      "document",
      "email",
      "phoneNumber",
    ]);
  });

  it("normalizes surrounding whitespace without inventing optional values", () => {
    expect(
      normalizeCustomerInput({
        ...VALID_CUSTOMER,
        name: "  Empresa Ficción Lunar SAS  ",
        document: "  ",
        email: "  compras@ficcion-lunar.example  ",
      }),
    ).toMatchObject({
      name: "Empresa Ficción Lunar SAS",
      document: "",
      email: "compras@ficcion-lunar.example",
    });
  });
});
