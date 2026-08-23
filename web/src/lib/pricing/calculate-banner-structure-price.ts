import {
  BANNER_PRODUCT_ID,
  BANNER_STRUCTURE_OPTION_IDS,
  type BannerStructureOptionId,
} from "./banner-structure-options";
import {
  BANNER_LAMINATED_VARIANT_ID,
  BANNER_LAMINATION_RATE_PER_FACE_M2,
  BANNER_STANDARD_MATERIAL_RATE_PER_M2,
} from "./area-product-catalog";
import { CUSTOM_RATE_VARIANT_ID } from "./resolve-area-product-rate";

export function calculateBannerStructurePrice(
  areaM2: number,
  variantId: string,
  selectedRatePerSquareMeter: number,
  structureOptionId: BannerStructureOptionId,
): number {
  if (!Number.isFinite(areaM2)) {
    throw new RangeError("Banner area must be finite.");
  }

  if (areaM2 < 0) {
    throw new RangeError("Banner area must not be negative.");
  }

  if (
    !Number.isFinite(selectedRatePerSquareMeter) ||
    selectedRatePerSquareMeter < 0
  ) {
    throw new RangeError("Banner rate must be a finite non-negative number.");
  }

  const materialRate =
    variantId === CUSTOM_RATE_VARIANT_ID
      ? selectedRatePerSquareMeter
      : BANNER_STANDARD_MATERIAL_RATE_PER_M2;
  const standardMaterialPrice = areaM2 * materialRate;
  const laminationPerFace =
    variantId === BANNER_LAMINATED_VARIANT_ID
      ? areaM2 * BANNER_LAMINATION_RATE_PER_FACE_M2
      : 0;

  let structureMultiplier: 1 | 4 | 5;
  let laminatedFaces: 1 | 2;

  switch (structureOptionId) {
    case BANNER_STRUCTURE_OPTION_IDS.materialOnly:
      structureMultiplier = 1;
      laminatedFaces = 1;
      break;
    case BANNER_STRUCTURE_OPTION_IDS.singleFace:
      structureMultiplier = 4;
      laminatedFaces = 1;
      break;
    case BANNER_STRUCTURE_OPTION_IDS.doubleFace:
      structureMultiplier = 5;
      laminatedFaces = 2;
      break;
    default:
      throw new RangeError("Banner structure option must be valid.");
  }

  return (
    standardMaterialPrice * structureMultiplier +
    laminationPerFace * laminatedFaces
  );
}

export function applyBannerStructurePrice(
  productId: string,
  variantId: string,
  areaM2: number,
  areaBasePrice: number,
  selectedRatePerSquareMeter: number,
  structureOptionId: BannerStructureOptionId,
): number {
  return productId === BANNER_PRODUCT_ID
    ? calculateBannerStructurePrice(
        areaM2,
        variantId,
        selectedRatePerSquareMeter,
        structureOptionId,
      )
    : areaBasePrice;
}
