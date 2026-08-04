const POSITIVE_INTEGER_PATTERN = /^\d+$/;

export function validatePositiveIntegerQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    throw new RangeError("Quantity must be a valid number.");
  }

  if (!Number.isSafeInteger(quantity)) {
    throw new RangeError("Quantity must be an integer.");
  }

  if (quantity <= 0) {
    throw new RangeError("Quantity must be greater than zero.");
  }

  return quantity;
}

export function parsePositiveIntegerQuantity(value: string): number {
  const normalizedValue = value.trim();

  if (normalizedValue === "") {
    throw new RangeError("Quantity is required.");
  }

  const quantity = validatePositiveIntegerQuantity(Number(normalizedValue));

  if (!POSITIVE_INTEGER_PATTERN.test(normalizedValue)) {
    throw new RangeError("Quantity must be an integer.");
  }

  return quantity;
}
