import { describe, expect, it } from "vitest";

import {
  createCustomQuotationLineDraft,
  resolveCustomQuotationItemFormValues,
} from "./custom-quotation-line";

describe("custom quotation line", () => {
  it("creates an explicit immutable snapshot and trims its description", () => {
    const draft = createCustomQuotationLineDraft({
      description: "  Medio metro de lámina sublimada  ",
      quantity: 3,
      unitPriceCop: 58_000,
    });

    expect(draft).toEqual({
      source: "custom",
      title: "Medio metro de lámina sublimada",
      description: "Medio metro de lámina sublimada",
      quantity: 3,
      unitPriceCop: 58_000,
      details: [],
      lineTotal: 174_000,
    });
    expect(Object.isFrozen(draft)).toBe(true);
    expect(Object.isFrozen(draft.details)).toBe(true);
  });

  it.each(["", "   ", "\n\t"])(
    "rejects the empty description %j",
    (description) => {
      expect(() =>
        createCustomQuotationLineDraft({
          description,
          quantity: 1,
          unitPriceCop: 1,
        }),
      ).toThrowError("description is required");
    },
  );

  it.each([1, 2, 10])("accepts positive integer quantity %s", (quantity) => {
    expect(
      createCustomQuotationLineDraft({
        description: "Ítem válido",
        quantity,
        unitPriceCop: 100,
      }).quantity,
    ).toBe(quantity);
  });

  it.each([0, -1, 1.5, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid quantity %s",
    (quantity) => {
      expect(() =>
        createCustomQuotationLineDraft({
          description: "Ítem inválido",
          quantity,
          unitPriceCop: 100,
        }),
      ).toThrowError("quantity");
    },
  );

  it("accepts an exact positive COP unit price", () => {
    expect(
      createCustomQuotationLineDraft({
        description: "Ítem válido",
        quantity: 1,
        unitPriceCop: 58_350,
      }).unitPriceCop,
    ).toBe(58_350);
  });

  it.each([0, -1, 58_350.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid unit price %s",
    (unitPriceCop) => {
      expect(() =>
        createCustomQuotationLineDraft({
          description: "Ítem inválido",
          quantity: 1,
          unitPriceCop,
        }),
      ).toThrowError("unit price");
    },
  );

  it("multiplies quantity by unit price exactly without automatic rounding", () => {
    const draft = createCustomQuotationLineDraft({
      description: "Precio exacto",
      quantity: 3,
      unitPriceCop: 58_350,
    });

    expect(draft.lineTotal).toBe(175_050);
    expect(draft.unitPriceCop).toBe(58_350);
  });

  it("resolves the required manual QA example", () => {
    const resolution = resolveCustomQuotationItemFormValues({
      description: "Medio metro de lámina sublimada",
      quantity: "3",
      unitPriceCop: "58000",
    });

    expect(resolution.errors).toEqual({});
    expect(resolution.draft?.lineTotal).toBe(174_000);
  });

  it("returns safe Spanish required-field feedback", () => {
    const resolution = resolveCustomQuotationItemFormValues({
      description: " ",
      quantity: "",
      unitPriceCop: "",
    });

    expect(resolution.draft).toBeNull();
    expect(resolution.errors).toEqual({
      description: "La descripción es obligatoria.",
      quantity: "La cantidad es obligatoria.",
      unitPriceCop: "El precio unitario es obligatorio.",
    });
  });

  it.each([
    ["0", "1"],
    ["-1", "1"],
    ["1.5", "1"],
    ["0.5", "1"],
    ["1", "0"],
    ["1", "-1"],
    ["1", "58.5"],
    ["1", "texto"],
  ])(
    "rejects invalid form quantity %s or unit price %s",
    (quantity, unitPriceCop) => {
      const resolution = resolveCustomQuotationItemFormValues({
        description: "Ítem inválido",
        quantity,
        unitPriceCop,
      });

      expect(resolution.draft).toBeNull();
      expect(Object.keys(resolution.errors).length).toBeGreaterThan(0);
    },
  );

  it("rejects a multiplication outside the safe integer range", () => {
    const resolution = resolveCustomQuotationItemFormValues({
      description: "Ítem fuera de rango",
      quantity: "2",
      unitPriceCop: String(Number.MAX_SAFE_INTEGER),
    });

    expect(resolution.draft).toBeNull();
    expect(resolution.errors.total).toContain("fuera del rango permitido");
  });
});
