import {
  DEFAULT_PANAFLEX_PRICING_OPTION_ID,
  PANAFLEX_PRODUCT_ID,
  type PanaflexPricingOptionId,
} from "./panaflex-pricing-options";

export function changePanaflexPricingSelection(
  currentProductId: string,
  nextProductId: string,
  currentOptionId: PanaflexPricingOptionId | null,
): PanaflexPricingOptionId | null {
  if (nextProductId !== PANAFLEX_PRODUCT_ID) {
    return null;
  }

  if (currentProductId === PANAFLEX_PRODUCT_ID && currentOptionId !== null) {
    return currentOptionId;
  }

  return DEFAULT_PANAFLEX_PRICING_OPTION_ID;
}
