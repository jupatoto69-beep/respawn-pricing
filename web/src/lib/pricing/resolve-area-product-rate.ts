import {
  AREA_PRODUCT_CATALOG,
  type AreaProduct,
  type AreaProductVariant,
} from "./area-product-catalog";

export const CUSTOM_RATE_VARIANT_ID = "custom-rate";

export type AreaProductSelection = Readonly<{
  productId: string;
  variantId: string;
  customRate: string;
}>;

export function getAreaProducts(): readonly AreaProduct[] {
  return AREA_PRODUCT_CATALOG;
}

export function getAreaProductVariants(
  productId: string,
): readonly AreaProductVariant[] {
  return (
    AREA_PRODUCT_CATALOG.find((product) => product.id === productId)?.variants ??
    []
  );
}

export function changeAreaProduct(
  selection: AreaProductSelection,
  productId: string,
): AreaProductSelection {
  if (selection.productId === productId) {
    return selection;
  }

  return {
    productId,
    variantId: "",
    customRate: "",
  };
}

export function resolveAreaProductRate(
  productId: string,
  variantId: string,
  customRate?: number,
): number | null {
  if (!productId || !variantId) {
    return null;
  }

  const product = AREA_PRODUCT_CATALOG.find(
    (candidate) => candidate.id === productId,
  );

  if (!product) {
    return null;
  }

  if (variantId === CUSTOM_RATE_VARIANT_ID) {
    if (customRate === undefined || !Number.isFinite(customRate) || customRate < 0) {
      return null;
    }

    return customRate;
  }

  return (
    product.variants.find((variant) => variant.id === variantId)
      ?.ratePerSquareMeter ?? null
  );
}

