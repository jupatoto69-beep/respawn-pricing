import {
  BANNER_PRODUCT_ID,
  DEFAULT_BANNER_STRUCTURE_OPTION_ID,
  type BannerStructureOptionId,
} from "./banner-structure-options";

export function changeBannerStructureSelection(
  currentProductId: string,
  nextProductId: string,
  currentOptionId: BannerStructureOptionId | null,
): BannerStructureOptionId | null {
  if (nextProductId !== BANNER_PRODUCT_ID) {
    return null;
  }

  if (currentProductId === BANNER_PRODUCT_ID && currentOptionId !== null) {
    return currentOptionId;
  }

  return DEFAULT_BANNER_STRUCTURE_OPTION_ID;
}
