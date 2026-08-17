import { roundUpToCop500 } from "./round-up-to-cop-500";

export const THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_REQUIRED_ERROR =
  "3D printing quick estimated total is required.";
export const THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_FINITE_ERROR =
  "3D printing quick estimated total must be a finite number.";
export const THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_POSITIVE_ERROR =
  "3D printing quick estimated total must be a finite positive number.";
export const THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_MINIMUM_ERROR =
  "3D printing quick estimated total must be at least COP 5,000.";
export const THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_RANGE_ERROR =
  "3D printing quick estimated total is outside the supported range.";

const QUICK_ESTIMATED_TOTAL_MINIMUM_COP = 5_000;

/**
 * Accepts the employee-entered total for the complete quick-estimate job.
 * Quantity is intentionally not part of this boundary: it must never multiply
 * an amount that already represents the whole requested job.
 */
export function acceptThreeDPrintingQuickEstimatedTotal(value: string): number {
  if (value.trim().length === 0) {
    throw new RangeError(
      THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_REQUIRED_ERROR,
    );
  }

  const enteredTotal = Number(value);

  if (!Number.isFinite(enteredTotal)) {
    throw new RangeError(
      THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_FINITE_ERROR,
    );
  }

  if (enteredTotal <= 0) {
    throw new RangeError(
      THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_POSITIVE_ERROR,
    );
  }

  if (enteredTotal < QUICK_ESTIMATED_TOTAL_MINIMUM_COP) {
    throw new RangeError(
      THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_MINIMUM_ERROR,
    );
  }

  const acceptedTotal = roundUpToCop500(enteredTotal);

  if (!Number.isSafeInteger(acceptedTotal)) {
    throw new RangeError(THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_RANGE_ERROR);
  }

  return acceptedTotal;
}
