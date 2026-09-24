import { describe, expect, it } from "vitest";

import { createCustomQuotationLineDraft } from "@/lib/pricing/custom-quotation-line";
import {
  addQuotationLine,
  createEmptyQuotation,
  updateQuotationDetails,
  type TemporaryQuotationState,
} from "@/lib/pricing/temporary-quotation";

import {
  createQuotationPersistenceSnapshot,
  isValidQuotationPersistenceSnapshot,
  QUOTATION_SNAPSHOT_EMPTY_MESSAGE,
} from "./quotation-snapshot";

const SAVED_AT = new Date(2026, 8, 24, 9, 30);

function createFictionalQuotation() {
  const withDetails = updateQuotationDetails(createEmptyQuotation(), {
    customerName: "Empresa Ejemplo Histórica SAS",
    customerDocument: "900123456-7",
    customerPhoneCountryIso2: "CO",
    customerPhoneNumber: "3205550199",
    customerEmail: "historica@example.com",
    customerCity: "Ciudad Ejemplo",
    notes: "Conservar estos valores históricos.",
  });
  const withStandard = addQuotationLine(
    withDetails,
    {
      source: "area-product",
      title: "Producto normal de ejemplo",
      quantity: 1.5,
      details: [
        { label: "Dimensiones", value: "50 × 70 cm" },
        { label: "Costo interno", value: "No debe persistirse" },
      ],
      lineTotal: 83_300,
    },
    SAVED_AT,
  );

  return addQuotationLine(
    withStandard,
    createCustomQuotationLineDraft({
      description: "Medio metro de lámina sublimada",
      quantity: 2,
      unitPriceCop: 58_350,
    }),
    SAVED_AT,
  );
}

describe("quotation persistence snapshot", () => {
  it("rejects an empty quotation before persistence", () => {
    expect(createQuotationPersistenceSnapshot(createEmptyQuotation())).toEqual({
      ok: false,
      message: QUOTATION_SNAPSHOT_EMPTY_MESSAGE,
    });
  });

  it("builds an explicit ordered customer-safe snapshot without calculator state", () => {
    const result = createQuotationPersistenceSnapshot(createFictionalQuotation());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.quotationDate).toBe("2026-09-24");
    expect(result.value.validityDays).toBe(15);
    expect(result.value.customerName).toBe("Empresa Ejemplo Histórica SAS");
    expect(result.value.notes).toBe("Conservar estos valores históricos.");
    expect(result.value.totalCop).toBe(200_000);
    expect(result.value.lines.map((line) => line.source)).toEqual([
      "area-product",
      "custom",
    ]);
    expect(result.value.lines[0]).toEqual({
      source: "area-product",
      title: "Producto normal de ejemplo",
      quantity: 1.5,
      details: [{ label: "Dimensiones", value: "50 × 70 cm" }],
      lineTotalCop: 83_300,
    });
    expect(JSON.stringify(result.value)).not.toContain("Costo interno");
    expect(JSON.stringify(result.value)).not.toContain("commercialGroup");
    expect(JSON.stringify(result.value)).not.toContain("nextLineSequence");
  });

  it("preserves exact custom quantity, unit price and total without recalculation", () => {
    const result = createQuotationPersistenceSnapshot(createFictionalQuotation());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.lines[1]).toEqual({
      source: "custom",
      title: "Medio metro de lámina sublimada",
      description: "Medio metro de lámina sublimada",
      quantity: 2,
      unitPriceCop: 58_350,
      details: [],
      lineTotalCop: 116_700,
    });
  });

  it("keeps the saved customer and notes independent from later customer changes", () => {
    const quotation = createFictionalQuotation();
    const result = createQuotationPersistenceSnapshot(quotation);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const laterCustomer = {
      name: "Empresa Editada Posteriormente SAS",
      email: "editada@example.com",
    };

    expect(laterCustomer.name).not.toBe(result.value.customerName);
    expect(result.value.customerName).toBe("Empresa Ejemplo Histórica SAS");
    expect(result.value.customerEmail).toBe("historica@example.com");
    expect(result.value.notes).toBe("Conservar estos valores históricos.");
  });

  it("refuses malformed custom arithmetic instead of repairing it", () => {
    const quotation = createFictionalQuotation();
    const customLine = quotation.lines[1];
    const malformed = {
      ...quotation,
      lines: [
        quotation.lines[0],
        { ...customLine, lineTotal: 116_701 },
      ],
    } as TemporaryQuotationState;

    expect(createQuotationPersistenceSnapshot(malformed).ok).toBe(false);
  });

  it("rejects a snapshot whose header total does not equal its stored lines", () => {
    const result = createQuotationPersistenceSnapshot(createFictionalQuotation());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(
      isValidQuotationPersistenceSnapshot({
        ...result.value,
        totalCop: result.value.totalCop + 1,
      }),
    ).toBe(false);
  });
});
