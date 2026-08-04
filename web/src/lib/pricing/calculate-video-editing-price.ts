import type { ParsedVideoDuration } from "./video-duration";

export const VIDEO_EDITING_PRICING = {
  basePrice: 50_000,
  additionalMinutePrice: 30_000,
} as const;

export type VideoEditingPriceCalculation = ParsedVideoDuration &
  Readonly<{
    billableMinutes: number;
    additionalBillableMinutes: number;
    basePrice: number;
    additionalSubtotal: number;
    totalPrice: number;
  }>;

function validateCalculationDuration(duration: ParsedVideoDuration): void {
  if (
    !Number.isSafeInteger(duration.enteredMinutes) ||
    duration.enteredMinutes < 0
  ) {
    throw new RangeError("Entered minutes must be a non-negative integer.");
  }

  if (
    !Number.isSafeInteger(duration.enteredSeconds) ||
    duration.enteredSeconds < 0 ||
    duration.enteredSeconds > 59
  ) {
    throw new RangeError("Entered seconds must be an integer from 0 to 59.");
  }

  const expectedTotalSeconds =
    duration.enteredMinutes * 60 + duration.enteredSeconds;

  if (
    !Number.isSafeInteger(duration.totalSeconds) ||
    duration.totalSeconds < 0 ||
    duration.totalSeconds !== expectedTotalSeconds
  ) {
    throw new RangeError("Total seconds must match the entered duration.");
  }
}

export function calculateVideoEditingPrice(
  duration: ParsedVideoDuration,
): VideoEditingPriceCalculation {
  validateCalculationDuration(duration);

  const billableMinutes = Math.max(1, Math.ceil(duration.totalSeconds / 60));
  const additionalBillableMinutes = Math.max(0, billableMinutes - 1);
  const additionalSubtotal =
    additionalBillableMinutes * VIDEO_EDITING_PRICING.additionalMinutePrice;
  const totalPrice = VIDEO_EDITING_PRICING.basePrice + additionalSubtotal;

  if (!Number.isSafeInteger(totalPrice)) {
    throw new RangeError("Video editing total must be a safe integer.");
  }

  return {
    ...duration,
    billableMinutes,
    additionalBillableMinutes,
    basePrice: VIDEO_EDITING_PRICING.basePrice,
    additionalSubtotal,
    totalPrice,
  };
}
