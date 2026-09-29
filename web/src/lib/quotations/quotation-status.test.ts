import { describe, expect, it } from "vitest";

import { isQuotationExpired, quotationDisplayStatus } from "./quotation-status";

describe("historical quotation status", () => {
  it("expires only sent quotations after their stored validity ends", () => {
    expect(isQuotationExpired("sent", "2026-09-24", 15, "2026-10-09")).toBe(false);
    expect(isQuotationExpired("sent", "2026-09-24", 15, "2026-10-10")).toBe(true);
    expect(quotationDisplayStatus("sent", "2026-09-24", 15, "2026-10-10")).toBe("Vencida");
  });

  it("never presents accepted or rejected quotations as expired", () => {
    expect(quotationDisplayStatus("accepted", "2026-09-24", 15, "2027-01-01")).toBe("Aceptada");
    expect(quotationDisplayStatus("rejected", "2026-09-24", 15, "2027-01-01")).toBe("Rechazada");
  });

  it("uses the stored date and validity across a calendar year", () => {
    expect(isQuotationExpired("sent", "2026-12-31", 1, "2027-01-01")).toBe(false);
    expect(isQuotationExpired("sent", "2026-12-31", 1, "2027-01-02")).toBe(true);
  });
});
