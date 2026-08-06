import { describe, expect, it } from "vitest";

import { createEmptyQuotationDetails } from "./temporary-quotation";
import {
  TEMPORARY_QUOTATION_DETAIL_LIMITS,
  isCustomerPhoneNumberInput,
  validateCustomerCity,
  validateCustomerDocument,
  validateCustomerEmail,
  validateCustomerName,
  validateCustomerPhone,
  validateQuotationNotes,
  validateTemporaryQuotationDetails,
} from "./temporary-quotation-details-validation";

function expectValid(error: string | undefined): void {
  expect(error).toBeUndefined();
}

function expectInvalid(error: string | undefined): void {
  expect(error).toEqual(expect.any(String));
}

describe("temporary quotation detail validation", () => {
  it("accepts every completely empty optional field without errors", () => {
    const details = createEmptyQuotationDetails();

    expectValid(validateCustomerName(""));
    expectValid(validateCustomerDocument(""));
    expectValid(validateCustomerPhone("CO", ""));
    expectValid(validateCustomerEmail(""));
    expectValid(validateCustomerCity(""));
    expectValid(validateQuotationNotes(""));
    expect(validateTemporaryQuotationDetails(details)).toEqual({});
  });

  describe("customer name", () => {
    it.each(["AB", "  AB  ", "Empresa Ejemplo SAS"])(
      "accepts %j",
      (value) => {
        expectValid(validateCustomerName(value));
      },
    );

    it.each(["A", " A ", "   "])("rejects %j after trimming", (value) => {
      expectInvalid(validateCustomerName(value));
    });

    it("accepts exactly 120 characters and rejects 121", () => {
      expectValid(
        validateCustomerName(
          "x".repeat(TEMPORARY_QUOTATION_DETAIL_LIMITS.customerName),
        ),
      );
      expectInvalid(
        validateCustomerName(
          "x".repeat(TEMPORARY_QUOTATION_DETAIL_LIMITS.customerName + 1),
        ),
      );
    });
  });

  describe("customer document", () => {
    it.each([
      "900123456-7",
      "0900123456-7",
      "00000",
      "123 456 789-012-345",
    ])("accepts %j without changing its format", (value) => {
      expectValid(validateCustomerDocument(value));
    });

    it.each(["900.123.456", "ABC123", "12"])("rejects %j", (value) => {
      expectInvalid(validateCustomerDocument(value));
    });

    it("accepts exactly 15 real digits and rejects 16", () => {
      expectValid(validateCustomerDocument("12345-67890-12345"));
      expectInvalid(validateCustomerDocument("12345-67890-123456"));
    });
  });

  describe("customer phone", () => {
    it.each([
      ["CO", "3229699093"],
      ["CO", "0123456789"],
      ["US", "2025550123"],
      ["ES", "612345678"],
    ] as const)(
      "accepts %s / %j",
      (countryIso2, value) => {
        expectValid(validateCustomerPhone(countryIso2, value));
      },
    );

    it.each([
      "+57 3229699093",
      "322 969 9093",
      "322-969-9093",
      "322.969.9093",
      "telefono123",
      "(322)9699093",
      "123",
    ])("rejects %j", (value) => {
      expectInvalid(validateCustomerPhone("CO", value));
    });

    it("accepts only digits as raw input and preserves leading zeros", () => {
      expect(isCustomerPhoneNumberInput("")).toBe(true);
      expect(isCustomerPhoneNumberInput("0123456789")).toBe(true);

      for (const value of [
        "+57",
        "322 969",
        "322-969",
        "322.969",
        "telefono123",
        "(322)969",
      ]) {
        expect(isCustomerPhoneNumberInput(value)).toBe(false);
      }
    });

    it("accepts the national 7 and 14 digit boundaries", () => {
      expectValid(validateCustomerPhone("US", "0".repeat(7)));
      expectValid(validateCustomerPhone("US", "0".repeat(14)));
    });

    it("rejects national numbers outside the 7 to 14 digit range", () => {
      expectInvalid(validateCustomerPhone("US", "1".repeat(6)));
      expectInvalid(validateCustomerPhone("US", "1".repeat(15)));
    });

    it("rejects a country-code combination above 15 digits", () => {
      expectValid(validateCustomerPhone("EC", "1".repeat(12)));
      expectInvalid(validateCustomerPhone("EC", "1".repeat(13)));
    });
  });

  describe("customer email", () => {
    it.each([
      "cotizaciones@example.com",
      "juan.toro+cotizaciones@example.co.uk",
    ])("accepts the common address %j", (value) => {
      expectValid(validateCustomerEmail(value));
    });

    it.each([
      "usuario",
      "usuario@",
      "@dominio.com",
      "usuario@dominio",
      "usuario@@dominio.com",
    ])("rejects the incomplete address %j", (value) => {
      expectInvalid(validateCustomerEmail(value));
    });

    it("accepts exactly 254 characters and rejects 255", () => {
      const suffix = "@example.com";
      const maximumEmail = `${"a".repeat(
        TEMPORARY_QUOTATION_DETAIL_LIMITS.customerEmail - suffix.length,
      )}${suffix}`;

      expect(maximumEmail).toHaveLength(254);
      expectValid(validateCustomerEmail(maximumEmail));
      expectInvalid(validateCustomerEmail(`a${maximumEmail}`));
    });
  });

  describe("customer city", () => {
    it.each(["Fusagasugá", "Bogotá D.C.", "San José", "Villa de Leyva"])(
      "accepts %j",
      (value) => {
        expectValid(validateCustomerCity(value));
      },
    );

    it.each(["12345", "-", "A", "Bogotá_1"])("rejects %j", (value) => {
      expectInvalid(validateCustomerCity(value));
    });

    it("accepts exactly 100 characters and rejects 101", () => {
      expectValid(
        validateCustomerCity(
          "A".repeat(TEMPORARY_QUOTATION_DETAIL_LIMITS.customerCity),
        ),
      );
      expectInvalid(
        validateCustomerCity(
          "A".repeat(TEMPORARY_QUOTATION_DETAIL_LIMITS.customerCity + 1),
        ),
      );
    });
  });

  describe("general notes", () => {
    it("preserves line breaks and accepts exactly 1000 characters", () => {
      expectValid(validateQuotationNotes("Primera línea\n\nÚltima línea"));
      expectValid(
        validateQuotationNotes(
          "x".repeat(TEMPORARY_QUOTATION_DETAIL_LIMITS.notes),
        ),
      );
    });

    it("rejects 1001 characters", () => {
      expectInvalid(
        validateQuotationNotes(
          "x".repeat(TEMPORARY_QUOTATION_DETAIL_LIMITS.notes + 1),
        ),
      );
    });
  });

  it("returns errors keyed by every invalid field it receives", () => {
    const errors = validateTemporaryQuotationDetails({
      customerName: "A",
      customerDocument: "ABC123",
      customerPhoneCountryIso2: "CO",
      customerPhoneNumber: "+57 3229699093",
      customerEmail: "usuario@dominio",
      customerCity: "12345",
      notes: "x".repeat(TEMPORARY_QUOTATION_DETAIL_LIMITS.notes + 1),
    });

    expect(Object.keys(errors).sort()).toEqual([
      "customerCity",
      "customerDocument",
      "customerEmail",
      "customerName",
      "customerPhoneNumber",
      "notes",
    ]);
  });
});
