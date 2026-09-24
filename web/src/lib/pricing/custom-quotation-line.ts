import type { CustomQuotationLineDraft } from "./temporary-quotation";

export type CustomQuotationItemInput = Readonly<{
  description: string;
  quantity: number;
  unitPriceCop: number;
}>;

export type CustomQuotationItemFormValues = Readonly<{
  description: string;
  quantity: string;
  unitPriceCop: string;
}>;

export type CustomQuotationItemFormErrors = Readonly<
  Partial<Record<keyof CustomQuotationItemFormValues | "total", string>>
>;

export type CustomQuotationItemFormResolution = Readonly<{
  draft: CustomQuotationLineDraft | null;
  errors: CustomQuotationItemFormErrors;
}>;

const POSITIVE_INTEGER_PATTERN = /^\d+$/u;

export function createEmptyCustomQuotationItemFormValues(): CustomQuotationItemFormValues {
  return Object.freeze({
    description: "",
    quantity: "",
    unitPriceCop: "",
  });
}

function assertPositiveSafeInteger(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${fieldName} must be a valid number.`);
  }

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${fieldName} must be a positive safe integer.`);
  }
}

export function createCustomQuotationLineDraft({
  description,
  quantity,
  unitPriceCop,
}: CustomQuotationItemInput): CustomQuotationLineDraft {
  const normalizedDescription = description.trim();

  if (normalizedDescription.length === 0) {
    throw new RangeError("Custom item description is required.");
  }

  assertPositiveSafeInteger(quantity, "Custom item quantity");
  assertPositiveSafeInteger(unitPriceCop, "Custom item unit price");

  const lineTotal = quantity * unitPriceCop;

  if (!Number.isSafeInteger(lineTotal)) {
    throw new RangeError("Custom item total exceeds the safe integer range.");
  }

  return Object.freeze({
    source: "custom",
    title: normalizedDescription,
    description: normalizedDescription,
    quantity,
    unitPriceCop,
    details: Object.freeze([]),
    lineTotal,
  });
}

function parsePositiveInteger(
  value: string,
  requiredMessage: string,
  invalidMessage: string,
): Readonly<{ value: number | null; error?: string }> {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return Object.freeze({ value: null, error: requiredMessage });
  }

  if (!POSITIVE_INTEGER_PATTERN.test(normalizedValue)) {
    return Object.freeze({ value: null, error: invalidMessage });
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    return Object.freeze({ value: null, error: invalidMessage });
  }

  return Object.freeze({ value: parsedValue });
}

export function resolveCustomQuotationItemFormValues(
  values: CustomQuotationItemFormValues,
): CustomQuotationItemFormResolution {
  const errors: Partial<
    Record<keyof CustomQuotationItemFormValues | "total", string>
  > = {};
  const description = values.description.trim();

  if (description.length === 0) {
    errors.description = "La descripción es obligatoria.";
  }

  const quantity = parsePositiveInteger(
    values.quantity,
    "La cantidad es obligatoria.",
    "La cantidad debe ser un número entero mayor que cero.",
  );
  const unitPriceCop = parsePositiveInteger(
    values.unitPriceCop,
    "El precio unitario es obligatorio.",
    "El precio unitario debe ser un valor COP entero mayor que cero.",
  );

  if (quantity.error !== undefined) {
    errors.quantity = quantity.error;
  }

  if (unitPriceCop.error !== undefined) {
    errors.unitPriceCop = unitPriceCop.error;
  }

  if (
    Object.keys(errors).length > 0 ||
    quantity.value === null ||
    unitPriceCop.value === null
  ) {
    return Object.freeze({
      draft: null,
      errors: Object.freeze(errors),
    });
  }

  try {
    return Object.freeze({
      draft: createCustomQuotationLineDraft({
        description,
        quantity: quantity.value,
        unitPriceCop: unitPriceCop.value,
      }),
      errors: Object.freeze({}),
    });
  } catch {
    return Object.freeze({
      draft: null,
      errors: Object.freeze({
        total:
          "La cantidad y el precio unitario generan un total fuera del rango permitido.",
      }),
    });
  }
}
