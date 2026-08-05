import { describe, expect, it } from "vitest";

import {
  addQuotationLine,
  calculateQuotationTotal,
  clearQuotation,
  createEmptyQuotation,
  removeQuotationLine,
  type QuotationLineDraft,
} from "./temporary-quotation";

function createDraft(
  overrides: Partial<QuotationLineDraft> = {},
): QuotationLineDraft {
  return {
    source: "area-product",
    title: "Banner",
    quantity: 1,
    details: [{ label: "Dimensiones", value: "80 × 300 cm" }],
    lineTotal: 768_000,
    ...overrides,
  };
}

describe("temporary quotation", () => {
  it("creates an empty quotation whose total is zero", () => {
    const quotation = createEmptyQuotation();

    expect(quotation).toEqual({ lines: [], nextLineSequence: 1 });
    expect(calculateQuotationTotal(quotation)).toBe(0);
  });

  it("assigns deterministic consecutive IDs and preserves insertion order", () => {
    const first = addQuotationLine(createEmptyQuotation(), createDraft());
    const second = addQuotationLine(
      first,
      createDraft({ title: "Mantenimiento de computador", lineTotal: 120_000 }),
    );

    expect(second.lines.map(({ id, title }) => ({ id, title }))).toEqual([
      { id: "quotation-line-1", title: "Banner" },
      {
        id: "quotation-line-2",
        title: "Mantenimiento de computador",
      },
    ]);
    expect(second.nextLineSequence).toBe(3);
  });

  it("allows duplicate lines as independent entries", () => {
    const draft = createDraft();
    const first = addQuotationLine(createEmptyQuotation(), draft);
    const second = addQuotationLine(first, draft);

    expect(second.lines).toHaveLength(2);
    expect(second.lines[0].id).not.toBe(second.lines[1].id);
    expect(second.lines[0].lineTotal).toBe(second.lines[1].lineTotal);
  });

  it("removes one line without changing the remaining ID or reusing it", () => {
    const first = addQuotationLine(createEmptyQuotation(), createDraft());
    const second = addQuotationLine(first, createDraft({ title: "Panaflex" }));
    const removed = removeQuotationLine(second, "quotation-line-1");
    const third = addQuotationLine(removed, createDraft({ title: "Tabloides" }));

    expect(removed.lines.map((line) => line.id)).toEqual([
      "quotation-line-2",
    ]);
    expect(third.lines.map((line) => line.id)).toEqual([
      "quotation-line-2",
      "quotation-line-3",
    ]);
  });

  it("returns the same state when removing an unknown ID", () => {
    const quotation = addQuotationLine(createEmptyQuotation(), createDraft());

    expect(removeQuotationLine(quotation, "quotation-line-99")).toBe(
      quotation,
    );
  });

  it("clears lines without resetting the sequence", () => {
    const quotation = addQuotationLine(createEmptyQuotation(), createDraft());
    const cleared = clearQuotation(quotation);
    const next = addQuotationLine(cleared, createDraft());

    expect(cleared).toEqual({ lines: [], nextLineSequence: 2 });
    expect(next.lines[0].id).toBe("quotation-line-2");
  });

  it("keeps every operation immutable", () => {
    const empty = createEmptyQuotation();
    const added = addQuotationLine(empty, createDraft());
    const removed = removeQuotationLine(added, "quotation-line-1");

    expect(empty.lines).toEqual([]);
    expect(added.lines).toHaveLength(1);
    expect(removed.lines).toEqual([]);
    expect(added).not.toBe(empty);
    expect(removed).not.toBe(added);
  });

  it("copies detail objects and their array safely", () => {
    const details = [{ label: "Dimensiones", value: "50 × 50 cm" }];
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ details }),
    );

    details[0].value = "100 × 100 cm";
    details.push({ label: "Privado", value: "No debe aparecer" });

    expect(quotation.lines[0].details).toEqual([
      { label: "Dimensiones", value: "50 × 50 cm" },
    ]);
    expect(Object.isFrozen(quotation.lines[0].details)).toBe(true);
    expect(Object.isFrozen(quotation.lines[0].details[0])).toBe(true);
  });

  it("sums exact stored totals without multiplying quantity", () => {
    const first = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ quantity: 4, lineTotal: 100_001 }),
    );
    const second = addQuotationLine(
      first,
      createDraft({ quantity: 9, lineTotal: 267_500 }),
    );

    expect(calculateQuotationTotal(second)).toBe(367_501);
  });

  it("does not apply an additional COP 500 rounding", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ lineTotal: 234_501 }),
    );

    expect(calculateQuotationTotal(quotation)).toBe(234_501);
  });

  it.each([
    [Number.NaN, "finite"],
    [Number.POSITIVE_INFINITY, "finite"],
    [-1, "negative"],
    [10.5, "safe integer"],
    [Number.MAX_SAFE_INTEGER + 1, "safe integer"],
  ])("rejects invalid line total %s", (lineTotal, message) => {
    expect(() =>
      addQuotationLine(createEmptyQuotation(), createDraft({ lineTotal })),
    ).toThrowError(message);
  });

  it("rejects a total that overflows the safe integer range", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ lineTotal: Number.MAX_SAFE_INTEGER }),
    );

    expect(() =>
      addQuotationLine(quotation, createDraft({ lineTotal: 1 })),
    ).toThrowError("Quotation total exceeds the safe integer range.");
  });
});
