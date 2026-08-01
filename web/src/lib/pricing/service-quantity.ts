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
  if (value.trim() === "") {
    throw new RangeError("Quantity is required.");
  }

  return validatePositiveIntegerQuantity(Number(value));
}
