import { describe, expect, it } from "vitest";

import { CUT_VINYL_PRODUCT_ID } from "./area-product-catalog";
import { createCustomQuotationLineDraft } from "./custom-quotation-line";
import {
  calculateCutVinylColorGroupPrice,
  createCutVinylColorGroupPricing,
} from "./cut-vinyl-color-group";
import {
  addQuotationLine,
  calculateQuotationTotal,
  clearQuotation,
  createEmptyQuotation,
  createEmptyQuotationDetails,
  hasQuotationDetailsInformation,
  hasQuotationInformation,
  removeQuotationLine,
  updateCustomQuotationLine,
  updateQuotationDetail,
  updateQuotationDetails,
  updateQuotationPhoneCountry,
  type QuotationLineDraft,
  type StandardQuotationLineDraft,
  type TemporaryQuotationDetails,
  type TemporaryQuotationTextDetailField,
} from "./temporary-quotation";

function createDraft(
  overrides: Partial<StandardQuotationLineDraft> = {},
): StandardQuotationLineDraft {
  return {
    source: "area-product",
    title: "Banner",
    quantity: 1,
    details: [{ label: "Dimensiones", value: "80 × 300 cm" }],
    lineTotal: 768_000,
    ...overrides,
  };
}

function createCutVinylDraft(
  color: string,
  subtotalBeforeMinimumAndRounding: number,
  quantity = 1,
): QuotationLineDraft {
  const commercialGroup = createCutVinylColorGroupPricing(
    CUT_VINYL_PRODUCT_ID,
    color,
    subtotalBeforeMinimumAndRounding,
  );

  if (commercialGroup === null) {
    throw new Error("Expected Cut vinyl group pricing.");
  }

  return {
    source: "area-product",
    title: "Vinilo de corte",
    quantity,
    details: [
      { label: "Producto", value: "Vinilo de corte" },
      { label: "Color", value: color.trim() },
    ],
    lineTotal: calculateCutVinylColorGroupPrice([
      subtotalBeforeMinimumAndRounding,
    ]).roundedTotal,
    commercialGroup,
  };
}

const FICTIONAL_DETAILS: TemporaryQuotationDetails = {
  customerName: "Empresa Ejemplo SAS",
  customerDocument: "900123456-7",
  customerPhoneCountryIso2: "CO",
  customerPhoneNumber: "3229699093",
  customerEmail: "cotizaciones@example.com",
  customerCity: "Fusagasugá",
  notes: "Entregar durante la próxima semana.",
};

const DETAIL_CASES: readonly (readonly [
  TemporaryQuotationTextDetailField,
  string,
])[] = [
  ["customerName", FICTIONAL_DETAILS.customerName],
  ["customerDocument", FICTIONAL_DETAILS.customerDocument],
  ["customerPhoneNumber", FICTIONAL_DETAILS.customerPhoneNumber],
  ["customerEmail", FICTIONAL_DETAILS.customerEmail],
  ["customerCity", FICTIONAL_DETAILS.customerCity],
  ["notes", FICTIONAL_DETAILS.notes],
];

describe("temporary quotation", () => {
  it("creates an empty quotation whose total is zero", () => {
    const quotation = createEmptyQuotation();

    expect(createEmptyQuotationDetails()).toEqual({
      customerName: "",
      customerDocument: "",
      customerPhoneCountryIso2: "CO",
      customerPhoneNumber: "",
      customerEmail: "",
      customerCity: "",
      notes: "",
    });
    expect(quotation).toEqual({
      lines: [],
      nextLineSequence: 1,
      details: createEmptyQuotationDetails(),
      quotationDate: null,
    });
    expect(calculateQuotationTotal(quotation)).toBe(0);
    expect(Object.isFrozen(quotation)).toBe(true);
    expect(Object.isFrozen(quotation.lines)).toBe(true);
    expect(Object.isFrozen(quotation.details)).toBe(true);
  });

  it.each(DETAIL_CASES)(
    "updates %s immutably and preserves every other field",
    (field, value) => {
      const quotation = createEmptyQuotation();
      const updated = updateQuotationDetail(quotation, field, value);

      expect(updated.details).toEqual({
        ...createEmptyQuotationDetails(),
        [field]: value,
      });
      expect(updated).not.toBe(quotation);
      expect(updated.details).not.toBe(quotation.details);
      expect(quotation.details).toEqual(createEmptyQuotationDetails());
      expect(updated.lines).toEqual(quotation.lines);
      expect(updated.nextLineSequence).toBe(quotation.nextLineSequence);
      expect(updated.quotationDate).toBeNull();
    },
  );

  it("updates several details together without changing existing lines", () => {
    const withLine = addQuotationLine(createEmptyQuotation(), createDraft());
    const updated = updateQuotationDetails(withLine, FICTIONAL_DETAILS);

    expect(updated.details).toEqual(FICTIONAL_DETAILS);
    expect(updated.lines).toEqual(withLine.lines);
    expect(updated.lines[0]).toBe(withLine.lines[0]);
    expect(withLine.details).toEqual(createEmptyQuotationDetails());
    expect(Object.isFrozen(updated.details)).toBe(true);
  });

  it("changes the phone country without modifying the national number", () => {
    const quotation = updateQuotationDetail(
      createEmptyQuotation(),
      "customerPhoneNumber",
      "3229699093",
    );
    const updated = updateQuotationPhoneCountry(quotation, "ES");

    expect(updated.details.customerPhoneCountryIso2).toBe("ES");
    expect(updated.details.customerPhoneNumber).toBe("3229699093");
  });

  it("changes the national number without modifying the phone country", () => {
    const quotation = updateQuotationPhoneCountry(
      createEmptyQuotation(),
      "ES",
    );
    const updated = updateQuotationDetail(
      quotation,
      "customerPhoneNumber",
      "612345678",
    );

    expect(updated.details.customerPhoneCountryIso2).toBe("ES");
    expect(updated.details.customerPhoneNumber).toBe("612345678");
  });

  it("preserves leading zeros, document formatting and multiline notes", () => {
    const updated = updateQuotationDetails(createEmptyQuotation(), {
      customerPhoneNumber: "03229699093",
      customerDocument: "0900123456-7",
      notes: "Primera línea.\nSegunda línea.\n\nÚltima línea.",
    });

    expect(updated.details.customerPhoneNumber).toBe("03229699093");
    expect(updated.details.customerDocument).toBe("0900123456-7");
    expect(updated.details.notes).toBe(
      "Primera línea.\nSegunda línea.\n\nÚltima línea.",
    );
  });

  it("treats whitespace-only details as empty information", () => {
    const quotation = updateQuotationDetails(createEmptyQuotation(), {
      customerName: "   ",
      customerDocument: "\n\t",
      notes: " \n \n ",
    });

    expect(hasQuotationDetailsInformation(quotation.details)).toBe(false);
    expect(hasQuotationInformation(quotation)).toBe(false);
  });

  it("detects a quotation line as information", () => {
    const quotation = addQuotationLine(createEmptyQuotation(), createDraft());

    expect(hasQuotationInformation(createEmptyQuotation())).toBe(false);
    expect(hasQuotationInformation(quotation)).toBe(true);
  });

  it.each(["CO", "ES"] as const)(
    "does not treat %s without a national number as information",
    (countryIso2) => {
      const quotation = updateQuotationPhoneCountry(
        createEmptyQuotation(),
        countryIso2,
      );

      expect(hasQuotationDetailsInformation(quotation.details)).toBe(false);
      expect(hasQuotationInformation(quotation)).toBe(false);
    },
  );

  it("treats a national number as information", () => {
    const quotation = updateQuotationDetail(
      createEmptyQuotation(),
      "customerPhoneNumber",
      "3229699093",
    );

    expect(hasQuotationDetailsInformation(quotation.details)).toBe(true);
    expect(hasQuotationInformation(quotation)).toBe(true);
  });

  it.each(DETAIL_CASES)("detects useful information in %s", (field, value) => {
    const quotation = updateQuotationDetail(
      createEmptyQuotation(),
      field,
      value,
    );

    expect(hasQuotationDetailsInformation(quotation.details)).toBe(true);
    expect(hasQuotationInformation(quotation)).toBe(true);
  });

  it("keeps an over-limit raw value without silently truncating it", () => {
    const value = "x".repeat(1_001);
    const updated = updateQuotationDetail(
      createEmptyQuotation(),
      "notes",
      value,
    );

    expect(updated.details.notes).toBe(value);
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

  it("freezes the browser-local date when the first line is added", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createDraft(),
      new Date(2026, 7, 9, 23, 59, 59),
    );

    expect(quotation.quotationDate).toEqual({
      year: 2026,
      month: 8,
      day: 9,
    });
    expect(Object.isFrozen(quotation.quotationDate)).toBe(true);
  });

  it("does not replace the frozen date when additional lines are added", () => {
    const first = addQuotationLine(
      createEmptyQuotation(),
      createDraft(),
      new Date(2026, 7, 9, 23, 59, 59),
    );
    const second = addQuotationLine(
      first,
      createDraft({ title: "Servicio" }),
      new Date(2026, 7, 10, 0, 0, 1),
    );

    expect(second.quotationDate).toBe(first.quotationDate);
    expect(second.quotationDate).toEqual({
      year: 2026,
      month: 8,
      day: 9,
    });
  });

  it("allows duplicate lines as independent entries", () => {
    const draft = createDraft();
    const first = addQuotationLine(createEmptyQuotation(), draft);
    const second = addQuotationLine(first, draft);

    expect(second.lines).toHaveLength(2);
    expect(second.lines[0].id).not.toBe(second.lines[1].id);
    expect(second.lines[0].lineTotal).toBe(second.lines[1].lineTotal);
  });

  it("adds a custom line snapshot and includes its exact total", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createCustomQuotationLineDraft({
        description: " Medio metro de lámina sublimada ",
        quantity: 3,
        unitPriceCop: 58_000,
      }),
    );

    expect(quotation.lines[0]).toEqual({
      id: "quotation-line-1",
      source: "custom",
      title: "Medio metro de lámina sublimada",
      description: "Medio metro de lámina sublimada",
      quantity: 3,
      unitPriceCop: 58_000,
      details: [],
      lineTotal: 174_000,
    });
    expect(calculateQuotationTotal(quotation)).toBe(174_000);
  });

  it("rejects a custom draft whose stored total is not exact multiplication", () => {
    const validDraft = createCustomQuotationLineDraft({
      description: "Ítem protegido",
      quantity: 3,
      unitPriceCop: 58_000,
    });

    expect(() =>
      addQuotationLine(createEmptyQuotation(), {
        ...validDraft,
        lineTotal: 174_500,
      }),
    ).toThrowError("must equal quantity times unit price");
  });

  it("coexists with existing line types and preserves their stored totals", () => {
    const existing = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ lineTotal: 768_000 }),
    );
    const quotation = addQuotationLine(
      existing,
      createCustomQuotationLineDraft({
        description: "Medio metro de lámina sublimada",
        quantity: 3,
        unitPriceCop: 58_000,
      }),
    );

    expect(quotation.lines.map((line) => line.source)).toEqual([
      "area-product",
      "custom",
    ]);
    expect(quotation.lines[0]).toBe(existing.lines[0]);
    expect(calculateQuotationTotal(quotation)).toBe(942_000);
  });

  it("edits only the selected custom snapshot and recalculates exactly", () => {
    const existing = addQuotationLine(createEmptyQuotation(), createDraft());
    const withFirstCustom = addQuotationLine(
      existing,
      createCustomQuotationLineDraft({
        description: "Primer ítem",
        quantity: 3,
        unitPriceCop: 58_000,
      }),
    );
    const quotation = addQuotationLine(
      withFirstCustom,
      createCustomQuotationLineDraft({
        description: "Segundo ítem",
        quantity: 1,
        unitPriceCop: 20_000,
      }),
    );
    const updated = updateCustomQuotationLine(
      quotation,
      "quotation-line-2",
      createCustomQuotationLineDraft({
        description: "Medio metro de lámina sublimada editada",
        quantity: 2,
        unitPriceCop: 58_350,
      }),
    );

    expect(updated.lines[0]).toBe(quotation.lines[0]);
    expect(updated.lines[2]).toBe(quotation.lines[2]);
    expect(updated.lines[1]).toEqual({
      id: "quotation-line-2",
      source: "custom",
      title: "Medio metro de lámina sublimada editada",
      description: "Medio metro de lámina sublimada editada",
      quantity: 2,
      unitPriceCop: 58_350,
      details: [],
      lineTotal: 116_700,
    });
    expect(calculateQuotationTotal(updated)).toBe(904_700);
  });

  it("recalculates the manual QA sequence when quantity and unit price change", () => {
    const original = addQuotationLine(
      createEmptyQuotation(),
      createCustomQuotationLineDraft({
        description: "Medio metro de lámina sublimada",
        quantity: 3,
        unitPriceCop: 58_000,
      }),
    );
    const quantityEdited = updateCustomQuotationLine(
      original,
      "quotation-line-1",
      createCustomQuotationLineDraft({
        description: "Medio metro de lámina sublimada",
        quantity: 2,
        unitPriceCop: 58_000,
      }),
    );
    const unitPriceEdited = updateCustomQuotationLine(
      quantityEdited,
      "quotation-line-1",
      createCustomQuotationLineDraft({
        description: "Medio metro de lámina sublimada",
        quantity: 2,
        unitPriceCop: 58_350,
      }),
    );
    const descriptionEdited = updateCustomQuotationLine(
      unitPriceEdited,
      "quotation-line-1",
      createCustomQuotationLineDraft({
        description: "Lámina sublimada personalizada",
        quantity: 2,
        unitPriceCop: 58_350,
      }),
    );

    expect(original.lines[0]).toMatchObject({
      description: "Medio metro de lámina sublimada",
      quantity: 3,
      unitPriceCop: 58_000,
      lineTotal: 174_000,
    });
    expect(quantityEdited.lines[0]).toMatchObject({
      quantity: 2,
      unitPriceCop: 58_000,
      lineTotal: 116_000,
    });
    expect(unitPriceEdited.lines[0]).toMatchObject({
      quantity: 2,
      unitPriceCop: 58_350,
      lineTotal: 116_700,
    });
    expect(descriptionEdited.lines[0]).toMatchObject({
      title: "Lámina sublimada personalizada",
      description: "Lámina sublimada personalizada",
      lineTotal: 116_700,
    });
  });

  it("preserves the original custom line when an edit is canceled", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createCustomQuotationLineDraft({
        description: "Medio metro de lámina sublimada",
        quantity: 3,
        unitPriceCop: 58_000,
      }),
    );
    const detachedEditDraft = createCustomQuotationLineDraft({
      description: "Cambio no guardado",
      quantity: 2,
      unitPriceCop: 70_000,
    });

    expect(detachedEditDraft.lineTotal).toBe(140_000);
    expect(quotation.lines[0]).toMatchObject({
      description: "Medio metro de lámina sublimada",
      quantity: 3,
      unitPriceCop: 58_000,
      lineTotal: 174_000,
    });
    expect(calculateQuotationTotal(quotation)).toBe(174_000);
  });

  it("removes a custom line without affecting existing lines", () => {
    const existing = addQuotationLine(createEmptyQuotation(), createDraft());
    const quotation = addQuotationLine(
      existing,
      createCustomQuotationLineDraft({
        description: "Ítem removible",
        quantity: 1,
        unitPriceCop: 58_350,
      }),
    );
    const removed = removeQuotationLine(quotation, "quotation-line-2");

    expect(removed.lines).toEqual(existing.lines);
    expect(removed.lines[0]).toBe(existing.lines[0]);
    expect(calculateQuotationTotal(removed)).toBe(768_000);
  });

  it("does not update a non-custom line or an unknown id", () => {
    const quotation = addQuotationLine(createEmptyQuotation(), createDraft());
    const customDraft = createCustomQuotationLineDraft({
      description: "Ítem no aplicado",
      quantity: 1,
      unitPriceCop: 58_000,
    });

    expect(
      updateCustomQuotationLine(quotation, "quotation-line-1", customDraft),
    ).toBe(quotation);
    expect(
      updateCustomQuotationLine(quotation, "quotation-line-99", customDraft),
    ).toBe(quotation);
  });

  it("applies COP 15,000 to one Cut vinyl piece below the group minimum", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft("Rojo", 4_000),
    );

    expect(quotation.lines[0].lineTotal).toBe(15_000);
    expect(calculateQuotationTotal(quotation)).toBe(15_000);
  });

  it("does not apply the minimum per piece when one color exceeds it together", () => {
    const first = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft("Rojo", 4_000),
    );
    const second = addQuotationLine(
      first,
      createCutVinylDraft("rojo", 6_000),
    );
    const quotation = addQuotationLine(
      second,
      createCutVinylDraft(" ROJO ", 6_000),
    );

    expect(quotation.lines).toHaveLength(3);
    expect(quotation.lines.map((line) => line.lineTotal)).toEqual([
      4_000, 6_000, 6_000,
    ]);
    expect(calculateQuotationTotal(quotation)).toBe(16_000);
  });

  it("applies the minimum once when a same-color group remains below it", () => {
    const first = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft("Rojo", 4_000),
    );
    const second = addQuotationLine(
      first,
      createCutVinylDraft("Rojo", 6_000),
    );
    const quotation = addQuotationLine(
      second,
      createCutVinylDraft("Rojo", 3_000),
    );

    expect(calculateQuotationTotal(quotation)).toBe(15_000);
    expect(
      quotation.lines.reduce((total, line) => total + line.lineTotal, 0),
    ).toBe(15_000);
  });

  it("keeps different Cut vinyl colors as independent minimum groups", () => {
    const red = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft("Rojo", 10_000),
    );
    const quotation = addQuotationLine(
      red,
      createCutVinylDraft("Azul", 8_000),
    );

    expect(quotation.lines.map((line) => line.lineTotal)).toEqual([
      15_000, 15_000,
    ]);
    expect(calculateQuotationTotal(quotation)).toBe(30_000);
  });

  it("keeps a Cut vinyl color group above the minimum", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft("Rojo", 20_000),
    );

    expect(calculateQuotationTotal(quotation)).toBe(20_000);
  });

  it("groups same-color pieces after quantity has affected each subtotal", () => {
    const onePiece = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft("Verde", 4_000, 1),
    );
    const quotation = addQuotationLine(
      onePiece,
      createCutVinylDraft("Verde", 12_000, 3),
    );

    expect(quotation.lines.map((line) => line.quantity)).toEqual([1, 3]);
    expect(quotation.lines.map((line) => line.lineTotal)).toEqual([
      4_000, 12_000,
    ]);
    expect(calculateQuotationTotal(quotation)).toBe(16_000);
  });

  it("recalculates the remaining color group after deleting one of its lines", () => {
    const first = addQuotationLine(
      createEmptyQuotation(),
      createCutVinylDraft("Rojo", 4_000),
    );
    const second = addQuotationLine(
      first,
      createCutVinylDraft("Rojo", 12_000),
    );
    const removed = removeQuotationLine(second, "quotation-line-2");

    expect(calculateQuotationTotal(second)).toBe(16_000);
    expect(removed.lines).toHaveLength(1);
    expect(removed.lines[0].lineTotal).toBe(15_000);
    expect(calculateQuotationTotal(removed)).toBe(15_000);
    expect(second.lines[0].lineTotal).toBe(4_000);
  });

  it.each([
    ["Vinilo impreso", 8_000],
    ["Banner", 8_000],
    ["Panaflex", 8_000],
  ])("does not group %s by a color detail", (title, lineTotal) => {
    const draft = createDraft({
      title,
      details: [{ label: "Color", value: "Rojo" }],
      lineTotal,
    });
    const first = addQuotationLine(createEmptyQuotation(), draft);
    const quotation = addQuotationLine(first, draft);

    expect(quotation.lines.map((line) => line.lineTotal)).toEqual([
      lineTotal,
      lineTotal,
    ]);
    expect(calculateQuotationTotal(quotation)).toBe(lineTotal * 2);
  });

  it("preserves quotation details while adding and removing lines", () => {
    const withDetails = updateQuotationDetails(
      createEmptyQuotation(),
      FICTIONAL_DETAILS,
    );
    const added = addQuotationLine(withDetails, createDraft());
    const removed = removeQuotationLine(added, "quotation-line-1");

    expect(added.details).toEqual(FICTIONAL_DETAILS);
    expect(removed.details).toEqual(FICTIONAL_DETAILS);
    expect(withDetails.details).toEqual(FICTIONAL_DETAILS);
    expect(added.nextLineSequence).toBe(2);
    expect(removed.nextLineSequence).toBe(2);
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

  it("clears lines, details and date without resetting the sequence", () => {
    const withDetails = updateQuotationDetails(
      createEmptyQuotation(),
      FICTIONAL_DETAILS,
    );
    const quotation = addQuotationLine(
      withDetails,
      createDraft(),
      new Date(2026, 7, 9),
    );
    const cleared = clearQuotation(quotation);
    const next = addQuotationLine(
      cleared,
      createDraft(),
      new Date(2026, 7, 10),
    );

    expect(cleared).toEqual({
      lines: [],
      nextLineSequence: 2,
      details: createEmptyQuotationDetails(),
      quotationDate: null,
    });
    expect(next.lines[0].id).toBe("quotation-line-2");
    expect(next.quotationDate).toEqual({
      year: 2026,
      month: 8,
      day: 10,
    });
    expect(quotation.quotationDate).toEqual({
      year: 2026,
      month: 8,
      day: 9,
    });
    expect(quotation.lines).toHaveLength(1);
    expect(quotation.details).toEqual(FICTIONAL_DETAILS);
  });

  it("restores Colombia and an empty number when clearing", () => {
    const quotation = updateQuotationDetails(createEmptyQuotation(), {
      customerPhoneCountryIso2: "ES",
      customerPhoneNumber: "612345678",
    });
    const cleared = clearQuotation(quotation);

    expect(cleared.details.customerPhoneCountryIso2).toBe("CO");
    expect(cleared.details.customerPhoneNumber).toBe("");
    expect(cleared.nextLineSequence).toBe(quotation.nextLineSequence);
  });

  it("clears stored whitespace even though it is not useful information", () => {
    const quotation = updateQuotationDetail(
      createEmptyQuotation(),
      "notes",
      " \n ",
    );

    expect(hasQuotationInformation(quotation)).toBe(false);
    expect(clearQuotation(quotation).details).toEqual(
      createEmptyQuotationDetails(),
    );
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
    expect(empty.details).toEqual(createEmptyQuotationDetails());
    expect(added.details).toEqual(createEmptyQuotationDetails());
    expect(removed.details).toEqual(createEmptyQuotationDetails());
    expect(added.quotationDate).not.toBeNull();
    expect(removed.quotationDate).toBe(added.quotationDate);
  });

  it("keeps the quotation date after removing the final line until complete clearing", () => {
    const added = addQuotationLine(
      createEmptyQuotation(),
      createDraft(),
      new Date(2026, 7, 9),
    );
    const removed = removeQuotationLine(added, "quotation-line-1");

    expect(removed.lines).toEqual([]);
    expect(removed.quotationDate).toBe(added.quotationDate);
    expect(hasQuotationInformation(removed)).toBe(true);
    expect(clearQuotation(removed).quotationDate).toBeNull();
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

  it("does not change stored line totals or quotation total when editing details", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ lineTotal: 768_000 }),
    );
    const updated = updateQuotationDetails(quotation, FICTIONAL_DETAILS);

    expect(calculateQuotationTotal(updated)).toBe(768_000);
    expect(updated.lines[0]).toBe(quotation.lines[0]);
    expect(updated.lines[0].lineTotal).toBe(quotation.lines[0].lineTotal);
    expect(quotation.details).toEqual(createEmptyQuotationDetails());
  });

  it("keeps a calculated Banner and its total while editing phone data", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createDraft({ lineTotal: 768_000 }),
    );
    const withCountry = updateQuotationPhoneCountry(quotation, "ES");
    const withNumber = updateQuotationDetail(
      withCountry,
      "customerPhoneNumber",
      "612345678",
    );

    expect(withNumber.lines).toEqual(quotation.lines);
    expect(withNumber.lines[0]).toBe(quotation.lines[0]);
    expect(calculateQuotationTotal(withNumber)).toBe(768_000);
    expect(withNumber.nextLineSequence).toBe(quotation.nextLineSequence);
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
