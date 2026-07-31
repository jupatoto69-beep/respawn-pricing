export const BANNER_PRODUCT_ID = "banner";

export const BANNER_STRUCTURE_OPTION_IDS = {
  materialOnly: "material-only",
  singleFace: "single-face",
  doubleFace: "double-face",
} as const;

export type BannerStructureOptionId =
  (typeof BANNER_STRUCTURE_OPTION_IDS)[keyof typeof BANNER_STRUCTURE_OPTION_IDS];

export type BannerStructureOption = Readonly<{
  id: BannerStructureOptionId;
  name: string;
}>;

export const DEFAULT_BANNER_STRUCTURE_OPTION_ID =
  BANNER_STRUCTURE_OPTION_IDS.materialOnly;

export const BANNER_STRUCTURE_OPTIONS: readonly BannerStructureOption[] = [
  {
    id: BANNER_STRUCTURE_OPTION_IDS.materialOnly,
    name: "Solo material",
  },
  {
    id: BANNER_STRUCTURE_OPTION_IDS.singleFace,
    name: "Estructura una cara",
  },
  {
    id: BANNER_STRUCTURE_OPTION_IDS.doubleFace,
    name: "Estructura doble cara",
  },
] as const;

export function getBannerStructureOption(
  optionId: BannerStructureOptionId,
): BannerStructureOption {
  return BANNER_STRUCTURE_OPTIONS.find((option) => option.id === optionId)!;
}
