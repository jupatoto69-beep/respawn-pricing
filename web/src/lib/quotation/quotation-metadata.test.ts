import { describe, expect, it } from "vitest";

import {
  createQuotationCalendarDate,
  formatQuotationCalendarDate,
  formatQuotationValidity,
  QUOTATION_VALIDITY,
} from "./quotation-metadata";

describe("quotation metadata", () => {
  it("captures the browser-local calendar components without a UTC conversion", () => {
    const localMoment = new Date(2026, 0, 5, 23, 59, 59);

    expect(createQuotationCalendarDate(localMoment)).toEqual({
      year: 2026,
      month: 1,
      day: 5,
    });
  });

  it("formats DD/MM/YYYY deterministically from stable calendar components", () => {
    expect(
      formatQuotationCalendarDate({ year: 2026, month: 1, day: 5 }),
    ).toBe("05/01/2026");
    expect(
      formatQuotationCalendarDate({ year: 2024, month: 2, day: 29 }),
    ).toBe("29/02/2024");
  });

  it("centralizes the typed 15-day customer-facing validity", () => {
    expect(QUOTATION_VALIDITY.days).toBe(15);
    expect(formatQuotationValidity()).toBe("15 días");
    expect(Object.isFrozen(QUOTATION_VALIDITY)).toBe(true);
  });

  it("rejects impossible calendar dates", () => {
    expect(() =>
      formatQuotationCalendarDate({ year: 2026, month: 2, day: 29 }),
    ).toThrowError("outside the selected month");
  });
});
