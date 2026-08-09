import { describe, expect, it } from "vitest";

import {
  addQuotationLine,
  createEmptyQuotation,
  updateQuotationDetails,
  type QuotationLineDraft,
} from "@/lib/pricing/temporary-quotation";

import { evaluateQuotationPreviewOpening } from "./quotation-preview-opening";

const FICTIONAL_LINE: QuotationLineDraft = {
  source: "area-product",
  title: "Banner",
  quantity: 1,
  details: [{ label: "Dimensiones", value: "80 × 300 cm" }],
  lineTotal: 768_000,
};

describe("quotation preview opening policy", () => {
  it("does not allow opening without a stored line", () => {
    expect(evaluateQuotationPreviewOpening(createEmptyQuotation())).toEqual({
      canOpen: false,
      errors: {},
      firstInvalidField: null,
    });
  });

  it("allows a stored line with every optional customer field empty", () => {
    const quotation = addQuotationLine(createEmptyQuotation(), FICTIONAL_LINE);

    expect(evaluateQuotationPreviewOpening(quotation)).toEqual({
      canOpen: true,
      errors: {},
      firstInvalidField: null,
    });
  });

  it("blocks opening, returns every error and identifies the first invalid field", () => {
    const quotation = addQuotationLine(
      updateQuotationDetails(createEmptyQuotation(), {
        customerName: "A",
        customerDocument: "ABC",
        customerPhoneNumber: "123",
        customerEmail: "correo-inválido",
        customerCity: "1",
      }),
      FICTIONAL_LINE,
    );
    const evaluation = evaluateQuotationPreviewOpening(quotation);

    expect(evaluation.canOpen).toBe(false);
    expect(Object.keys(evaluation.errors)).toEqual([
      "customerName",
      "customerDocument",
      "customerPhoneNumber",
      "customerEmail",
      "customerCity",
    ]);
    expect(evaluation.firstInvalidField).toBe("customerName");
  });

  it("uses the existing order when phone and email are both invalid", () => {
    const quotation = addQuotationLine(
      updateQuotationDetails(createEmptyQuotation(), {
        customerPhoneNumber: "123",
        customerEmail: "correo-inválido",
      }),
      FICTIONAL_LINE,
    );

    expect(
      evaluateQuotationPreviewOpening(quotation).firstInvalidField,
    ).toBe("customerPhoneNumber");
  });

  it("allows valid fictional customer data without mutating quotation state", () => {
    const quotation = addQuotationLine(
      updateQuotationDetails(createEmptyQuotation(), {
        customerName: "Empresa Ejemplo SAS",
        customerDocument: "900123456-7",
        customerPhoneCountryIso2: "CO",
        customerPhoneNumber: "3229699093",
        customerEmail: "cotizaciones@example.com",
        customerCity: "Fusagasugá",
        notes: "Entregar durante la próxima semana.",
      }),
      FICTIONAL_LINE,
    );
    const before = JSON.stringify(quotation);
    const frozenDate = quotation.quotationDate;

    expect(evaluateQuotationPreviewOpening(quotation).canOpen).toBe(true);
    expect(JSON.stringify(quotation)).toBe(before);
    expect(quotation.quotationDate).toBe(frozenDate);
    expect(quotation.lines[0].lineTotal).toBe(768_000);
    expect(quotation.nextLineSequence).toBe(2);
  });
});
