export const PRICING_MODE_IDS = {
  areaProducts: "area-products",
  services: "services",
  threeDPrinting: "three-d-printing",
} as const;

export type PricingModeId =
  (typeof PRICING_MODE_IDS)[keyof typeof PRICING_MODE_IDS];

export type PricingModeOption = Readonly<{
  id: PricingModeId;
  name: string;
  description: string;
}>;

export const PRICING_MODE_OPTIONS: readonly PricingModeOption[] = [
  {
    id: PRICING_MODE_IDS.areaProducts,
    name: "Productos por área",
    description: "Cotiza productos usando medidas, variantes y cantidad.",
  },
  {
    id: PRICING_MODE_IDS.services,
    name: "Servicios",
    description: "Cotiza servicios por categoría según su estrategia.",
  },
  {
    id: PRICING_MODE_IDS.threeDPrinting,
    name: "Impresión 3D",
    description: "Cotiza con material, tiempo, cantidad y modelado.",
  },
] as const;

export type PricingModeSelection = Readonly<{
  modeId: PricingModeId;
  areaProductsRevision: number;
  servicesRevision: number;
  threeDPrintingRevision: number;
}>;

export function createInitialPricingModeSelection(
  modeId: PricingModeId = PRICING_MODE_IDS.areaProducts,
): PricingModeSelection {
  return {
    modeId,
    areaProductsRevision: 0,
    servicesRevision: 0,
    threeDPrintingRevision: 0,
  };
}

export function isPricingModeId(value: string): value is PricingModeId {
  return PRICING_MODE_OPTIONS.some((option) => option.id === value);
}

export function changePricingMode(
  selection: PricingModeSelection,
  modeId: PricingModeId,
): PricingModeSelection {
  if (selection.modeId === modeId) {
    return selection;
  }

  return {
    modeId,
    areaProductsRevision:
      selection.areaProductsRevision +
      (modeId === PRICING_MODE_IDS.areaProducts ? 1 : 0),
    servicesRevision:
      selection.servicesRevision +
      (modeId === PRICING_MODE_IDS.services ? 1 : 0),
    threeDPrintingRevision:
      selection.threeDPrintingRevision +
      (modeId === PRICING_MODE_IDS.threeDPrinting ? 1 : 0),
  };
}
