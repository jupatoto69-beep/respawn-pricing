import { validatePositiveIntegerQuantity } from "./service-quantity";

export const BUSINESS_CARD_TYPE_IDS = {
  glossy: "glossy",
  matteUv: "matte-uv",
} as const;

export type BusinessCardTypeId =
  (typeof BUSINESS_CARD_TYPE_IDS)[keyof typeof BUSINESS_CARD_TYPE_IDS];

export const BUSINESS_CARD_AUTOMATIC_TIER_IDS = {
  standard: "standard",
  volumeFromThree: "volume-from-three",
} as const;

export type BusinessCardAutomaticTierId =
  (typeof BUSINESS_CARD_AUTOMATIC_TIER_IDS)[keyof typeof BUSINESS_CARD_AUTOMATIC_TIER_IDS];

export type BusinessCardAutomaticTier = Readonly<{
  id: BusinessCardAutomaticTierId;
  name: "Precio estándar" | "Precio por volumen desde 3 millares";
  minimumQuantityInThousands: number;
  automaticUnitPrice: number;
  authorizedMinimum: number;
}>;

export type BusinessCardTypeDefinition = Readonly<{
  id: BusinessCardTypeId;
  name: "Brillantes" | "Mate UV";
  automaticTiers: Readonly<
    Record<BusinessCardAutomaticTierId, BusinessCardAutomaticTier>
  >;
}>;

const { glossy, matteUv } = BUSINESS_CARD_TYPE_IDS;
const { standard, volumeFromThree } = BUSINESS_CARD_AUTOMATIC_TIER_IDS;

export const BUSINESS_CARD_TYPE_DEFINITIONS: Readonly<
  Record<BusinessCardTypeId, BusinessCardTypeDefinition>
> = {
  [glossy]: {
    id: glossy,
    name: "Brillantes",
    automaticTiers: {
      [standard]: {
        id: standard,
        name: "Precio estándar",
        minimumQuantityInThousands: 1,
        automaticUnitPrice: 85_000,
        authorizedMinimum: 80_000,
      },
      [volumeFromThree]: {
        id: volumeFromThree,
        name: "Precio por volumen desde 3 millares",
        minimumQuantityInThousands: 3,
        automaticUnitPrice: 75_000,
        authorizedMinimum: 75_000,
      },
    },
  },
  [matteUv]: {
    id: matteUv,
    name: "Mate UV",
    automaticTiers: {
      [standard]: {
        id: standard,
        name: "Precio estándar",
        minimumQuantityInThousands: 1,
        automaticUnitPrice: 120_000,
        authorizedMinimum: 115_000,
      },
      [volumeFromThree]: {
        id: volumeFromThree,
        name: "Precio por volumen desde 3 millares",
        minimumQuantityInThousands: 3,
        automaticUnitPrice: 100_000,
        authorizedMinimum: 100_000,
      },
    },
  },
};

export const BUSINESS_CARD_TYPES: readonly BusinessCardTypeDefinition[] = [
  BUSINESS_CARD_TYPE_DEFINITIONS[glossy],
  BUSINESS_CARD_TYPE_DEFINITIONS[matteUv],
];

export type BusinessCardAutomaticPricingResolution = Readonly<{
  cardType: BusinessCardTypeId;
  quantityInThousands: number;
  equivalentCardQuantity: number;
  automaticTierId: BusinessCardAutomaticTierId;
  automaticUnitPrice: number;
  applicableAuthorizedMinimum: number;
}>;

export function isBusinessCardTypeId(
  value: string,
): value is BusinessCardTypeId {
  return BUSINESS_CARD_TYPES.some((cardType) => cardType.id === value);
}

export function getBusinessCardTypeDefinition(
  cardType: BusinessCardTypeId,
): BusinessCardTypeDefinition {
  return BUSINESS_CARD_TYPE_DEFINITIONS[cardType];
}

export function getBusinessCardAutomaticTier(
  cardType: BusinessCardTypeId,
  tierId: BusinessCardAutomaticTierId,
): BusinessCardAutomaticTier {
  return getBusinessCardTypeDefinition(cardType).automaticTiers[tierId];
}

export function calculateEquivalentCardQuantity(
  quantityInThousands: number,
): number {
  const validQuantity = validatePositiveIntegerQuantity(quantityInThousands);
  const equivalentCardQuantity = validQuantity * 1_000;

  if (!Number.isSafeInteger(equivalentCardQuantity)) {
    throw new RangeError("Equivalent card quantity must be a safe integer.");
  }

  return equivalentCardQuantity;
}

export function resolveBusinessCardAutomaticPricing(
  cardType: BusinessCardTypeId,
  quantityInThousands: number,
): BusinessCardAutomaticPricingResolution {
  const validQuantity = validatePositiveIntegerQuantity(quantityInThousands);
  const cardTypeDefinition = getBusinessCardTypeDefinition(cardType);
  const volumeTier = cardTypeDefinition.automaticTiers[volumeFromThree];
  const automaticTierId =
    validQuantity >= volumeTier.minimumQuantityInThousands
      ? volumeFromThree
      : standard;
  const automaticTier = cardTypeDefinition.automaticTiers[automaticTierId];

  return {
    cardType,
    quantityInThousands: validQuantity,
    equivalentCardQuantity: calculateEquivalentCardQuantity(validQuantity),
    automaticTierId,
    automaticUnitPrice: automaticTier.automaticUnitPrice,
    applicableAuthorizedMinimum: automaticTier.authorizedMinimum,
  };
}
