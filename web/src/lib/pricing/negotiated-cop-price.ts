const WHOLE_NUMBER_PATTERN = /^\d+$/;

export function validatePositiveWholeNumberCop(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("Negotiated unit price must be a valid number.");
  }

  if (value <= 0) {
    throw new RangeError("Negotiated unit price must be greater than zero.");
  }

  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Negotiated unit price must be an integer.");
  }

  return value;
}

export function parseOptionalNegotiatedCopUnitPrice(
  value: string,
): number | null {
  const normalizedValue = value.trim();

  if (normalizedValue === "") {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    throw new RangeError("Negotiated unit price must be a valid number.");
  }

  if (parsedValue <= 0) {
    throw new RangeError("Negotiated unit price must be greater than zero.");
  }

  if (!WHOLE_NUMBER_PATTERN.test(normalizedValue)) {
    throw new RangeError("Negotiated unit price must be an integer.");
  }

  return validatePositiveWholeNumberCop(parsedValue);
}
