import {
  PANAFLEX_PRICING_OPTION_IDS,
  type IlluminatedPanaflexPricingOptionId,
} from "./panaflex-pricing-options";

const SMALL_SIGN_AREA_THRESHOLD_CM2 = 10_000;
const SMALL_SIGN_SINGLE_FACE_RATE_PER_CM2 = 45;
const LARGE_SIGN_SINGLE_FACE_RATE_PER_CM2 = 34;
const ADDITIONAL_FACE_RATE_PER_CM2 = 8.5;

export function calculateIlluminatedPanaflexSignPrice(
  lengthCm: number,
  widthCm: number,
  quantity: number,
  optionId: IlluminatedPanaflexPricingOptionId,
): number {
  if (!Number.isFinite(lengthCm)) {
    throw new RangeError("Length must be finite.");
  }

  if (lengthCm <= 0) {
    throw new RangeError("Length must be greater than zero.");
  }

  if (!Number.isFinite(widthCm)) {
    throw new RangeError("Width must be finite.");
  }

  if (widthCm <= 0) {
    throw new RangeError("Width must be greater than zero.");
  }

  if (!Number.isFinite(quantity)) {
    throw new RangeError("Quantity must be finite.");
  }

  if (!Number.isInteger(quantity)) {
    throw new RangeError("Quantity must be an integer.");
  }

  if (quantity <= 0) {
    throw new RangeError("Quantity must be greater than zero.");
  }

  if (
    optionId !== PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace &&
    optionId !== PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace
  ) {
    throw new RangeError("Panaflex sign pricing option must be valid.");
  }

  const areaCm2 = lengthCm * widthCm;

  if (!Number.isFinite(areaCm2)) {
    throw new RangeError("Panaflex sign area must be finite.");
  }

  const singleFaceRatePerCm2 =
    areaCm2 < SMALL_SIGN_AREA_THRESHOLD_CM2
      ? SMALL_SIGN_SINGLE_FACE_RATE_PER_CM2
      : LARGE_SIGN_SINGLE_FACE_RATE_PER_CM2;
  const singleFaceUnitPrice = areaCm2 * singleFaceRatePerCm2;
  const additionalFaceUnitPrice =
    optionId === PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace
      ? areaCm2 * ADDITIONAL_FACE_RATE_PER_CM2
      : 0;
  const unitSignPrice = singleFaceUnitPrice + additionalFaceUnitPrice;

  return unitSignPrice * quantity;
}
