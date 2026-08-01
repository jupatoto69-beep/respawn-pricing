export const PANAFLEX_PRODUCT_ID = "panaflex";

export const PANAFLEX_PRICING_OPTION_IDS = {
  materialOnly: "material-only",
  illuminatedSingleFace: "illuminated-single-face",
  illuminatedDoubleFace: "illuminated-double-face",
} as const;

export type PanaflexPricingOptionId =
  (typeof PANAFLEX_PRICING_OPTION_IDS)[keyof typeof PANAFLEX_PRICING_OPTION_IDS];

export type IlluminatedPanaflexPricingOptionId =
  | typeof PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace
  | typeof PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace;

export type PanaflexPricingOption = Readonly<{
  id: PanaflexPricingOptionId;
  name: string;
}>;

export const DEFAULT_PANAFLEX_PRICING_OPTION_ID =
  PANAFLEX_PRICING_OPTION_IDS.materialOnly;

export const PANAFLEX_PRICING_OPTIONS: readonly PanaflexPricingOption[] = [
  {
    id: PANAFLEX_PRICING_OPTION_IDS.materialOnly,
    name: "Solo material",
  },
  {
    id: PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace,
    name: "Aviso luminoso una cara",
  },
  {
    id: PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace,
    name: "Aviso luminoso doble cara",
  },
] as const;

export function getPanaflexPricingOption(
  optionId: PanaflexPricingOptionId,
): PanaflexPricingOption {
  return PANAFLEX_PRICING_OPTIONS.find((option) => option.id === optionId)!;
}

export function usesIlluminatedPanaflexPricing(
  productId: string,
  optionId: PanaflexPricingOptionId | null,
): optionId is IlluminatedPanaflexPricingOptionId {
  return (
    productId === PANAFLEX_PRODUCT_ID &&
    (optionId === PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace ||
      optionId === PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace)
  );
}
