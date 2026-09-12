const SECURITY_SYSTEM_ROUNDING_INCREMENT_COP = 1_000;

export function roundUpSecuritySystemTotal(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError("Security system total must be finite.");
  }

  if (amount < 0) {
    throw new RangeError("Security system total must not be negative.");
  }

  if (amount === 0) {
    return 0;
  }

  const roundedAmount =
    Math.ceil(amount / SECURITY_SYSTEM_ROUNDING_INCREMENT_COP) *
    SECURITY_SYSTEM_ROUNDING_INCREMENT_COP;

  if (!Number.isSafeInteger(roundedAmount)) {
    throw new RangeError("Security system total must round to a safe integer.");
  }

  return roundedAmount;
}
