const COP_ROUNDING_INCREMENT = 500;

export function roundUpToCop500(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError("Amount must be finite.");
  }

  if (amount < 0) {
    throw new RangeError("Amount must not be negative.");
  }

  if (amount === 0) {
    return 0;
  }

  return Math.ceil(amount / COP_ROUNDING_INCREMENT) * COP_ROUNDING_INCREMENT;
}
