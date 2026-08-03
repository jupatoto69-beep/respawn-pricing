import { validatePositiveIntegerQuantity } from "./service-quantity";

export const SOFTWARE_INSTALLATION_PRICING_TIER_IDS = {
  singleProgram: "single-program",
  multiProgram: "multi-program",
} as const;

export type SoftwareInstallationPricingTierId =
  (typeof SOFTWARE_INSTALLATION_PRICING_TIER_IDS)[keyof typeof SOFTWARE_INSTALLATION_PRICING_TIER_IDS];

export type SoftwareInstallationPricingTier = Readonly<{
  id: SoftwareInstallationPricingTierId;
  name: string;
  minimumProgramCount: number;
  unitPrice: number;
}>;

const { singleProgram, multiProgram } = SOFTWARE_INSTALLATION_PRICING_TIER_IDS;

export const SOFTWARE_INSTALLATION_PRICING_TIERS: Readonly<
  Record<SoftwareInstallationPricingTierId, SoftwareInstallationPricingTier>
> = {
  [singleProgram]: {
    id: singleProgram,
    name: "Precio de un programa",
    minimumProgramCount: 1,
    unitPrice: 70_000,
  },
  [multiProgram]: {
    id: multiProgram,
    name: "Precio desde dos programas",
    minimumProgramCount: 2,
    unitPrice: 50_000,
  },
};

export type SoftwareInstallationPriceCalculation = Readonly<{
  programCount: number;
  tierId: SoftwareInstallationPricingTierId;
  unitPrice: number;
  totalPrice: number;
}>;

export function getSoftwareInstallationPricingTier(
  tierId: SoftwareInstallationPricingTierId,
): SoftwareInstallationPricingTier {
  return SOFTWARE_INSTALLATION_PRICING_TIERS[tierId];
}

export function calculateSoftwareInstallationPrice(
  programCount: number,
): SoftwareInstallationPriceCalculation {
  const validProgramCount = validatePositiveIntegerQuantity(programCount);
  const tierId =
    validProgramCount >=
    SOFTWARE_INSTALLATION_PRICING_TIERS[multiProgram].minimumProgramCount
      ? multiProgram
      : singleProgram;
  const unitPrice = SOFTWARE_INSTALLATION_PRICING_TIERS[tierId].unitPrice;
  const totalPrice = validProgramCount * unitPrice;

  if (!Number.isFinite(totalPrice)) {
    throw new RangeError("Software installation total must be finite.");
  }

  return {
    programCount: validProgramCount,
    tierId,
    unitPrice,
    totalPrice,
  };
}
