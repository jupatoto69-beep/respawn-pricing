import { describe, expect, it } from "vitest";

import { createEmptyQuotationDetails } from "./temporary-quotation";
import {
  formatQuotationPhoneDisplay,
  formatQuotationPhoneE164,
} from "./quotation-phone";

describe("quotation phone formats", () => {
  it("formats the selected country and national number for display", () => {
    const details = {
      ...createEmptyQuotationDetails(),
      customerPhoneNumber: "3229699093",
    };

    expect(formatQuotationPhoneDisplay(details)).toBe("+57 3229699093");
  });

  it("formats the selected country and national number as E.164", () => {
    const details = {
      ...createEmptyQuotationDetails(),
      customerPhoneNumber: "3229699093",
    };

    expect(formatQuotationPhoneE164(details)).toBe("+573229699093");
  });

  it("returns empty formats when the national number is empty", () => {
    const details = {
      ...createEmptyQuotationDetails(),
      customerPhoneCountryIso2: "ES" as const,
    };

    expect(formatQuotationPhoneDisplay(details)).toBe("");
    expect(formatQuotationPhoneE164(details)).toBe("");
  });
});
