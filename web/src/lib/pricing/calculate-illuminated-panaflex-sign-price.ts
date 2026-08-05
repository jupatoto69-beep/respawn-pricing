import {
  PANAFLEX_PRICING_OPTION_IDS,
  type IlluminatedPanaflexPricingOptionId,
} from "./panaflex-pricing-options";
import { roundUpToCop500 } from "./round-up-to-cop-500";

const SMALL_SIGN_AREA_THRESHOLD_CM2 = 10_000;
const SMALL_SIGN_SINGLE_FACE_RATE_PER_CM2 = 45;
const LARGE_SIGN_SINGLE_FACE_RATE_PER_CM2 = 34;
const ADDITIONAL_FACE_RATE_PER_CM2 = 8.5;

export const PANAFLEX_MEASURE_CLASSIFICATIONS = {
  small: "small",
  standard: "standard",
} as const;

export type PanaflexMeasureClassification =
  (typeof PANAFLEX_MEASURE_CLASSIFICATIONS)[keyof typeof PANAFLEX_MEASURE_CLASSIFICATIONS];

export type IlluminatedPanaflexSignPriceCalculation = Readonly<{
  areaCm2: number;
  measureClassification: PanaflexMeasureClassification;
  isSmallMeasure: boolean;
  structureRate: number;
  smallMeasureMultiplier: 1 | 2;
  oneFaceComponent: number;
  doubleFaceAdditionalComponent: number;
  normalPriceBeforeSmallMeasureAdjustment: number;
  priceAfterSmallMeasureAdjustment: number;
  priceBeforeCommercialRounding: number;
  commercialRoundedPrice: number;
}>;

export function calculateIlluminatedPanaflexSignPrice(
  lengthCm: number,
  widthCm: number,
  quantity: number,
  optionId: IlluminatedPanaflexPricingOptionId,
): IlluminatedPanaflexSignPriceCalculation {
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

  const isSmallMeasure = areaCm2 < SMALL_SIGN_AREA_THRESHOLD_CM2;
  const measureClassification = isSmallMeasure
    ? PANAFLEX_MEASURE_CLASSIFICATIONS.small
    : PANAFLEX_MEASURE_CLASSIFICATIONS.standard;
  const structureRate = isSmallMeasure
    ? SMALL_SIGN_SINGLE_FACE_RATE_PER_CM2
    : LARGE_SIGN_SINGLE_FACE_RATE_PER_CM2;
  const smallMeasureMultiplier = isSmallMeasure ? 2 : 1;
  const oneFaceComponent = areaCm2 * structureRate * quantity;
  const doubleFaceAdditionalComponent =
    optionId === PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace
      ? areaCm2 * ADDITIONAL_FACE_RATE_PER_CM2 * quantity
      : 0;
  const normalPriceBeforeSmallMeasureAdjustment =
    oneFaceComponent + doubleFaceAdditionalComponent;
  const priceAfterSmallMeasureAdjustment =
    normalPriceBeforeSmallMeasureAdjustment * smallMeasureMultiplier;
  const priceBeforeCommercialRounding = priceAfterSmallMeasureAdjustment;
  const commercialRoundedPrice = roundUpToCop500(
    priceBeforeCommercialRounding,
  );

  return {
    areaCm2,
    measureClassification,
    isSmallMeasure,
    structureRate,
    smallMeasureMultiplier,
    oneFaceComponent,
    doubleFaceAdditionalComponent,
    normalPriceBeforeSmallMeasureAdjustment,
    priceAfterSmallMeasureAdjustment,
    priceBeforeCommercialRounding,
    commercialRoundedPrice,
  };
}
