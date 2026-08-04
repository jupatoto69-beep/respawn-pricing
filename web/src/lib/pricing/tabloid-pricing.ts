import { validatePositiveIntegerQuantity } from "./service-quantity";

export const TABLOID_TYPE_IDS = {
  standard: "standard",
  adhesive: "adhesive",
} as const;

export type TabloidTypeId =
  (typeof TABLOID_TYPE_IDS)[keyof typeof TABLOID_TYPE_IDS];

export const TABLOID_ADHESIVE_FINISH_IDS = {
  standard: "standard-adhesive",
  preCut: "pre-cut-adhesive",
} as const;

export type TabloidAdhesiveFinishId =
  (typeof TABLOID_ADHESIVE_FINISH_IDS)[keyof typeof TABLOID_ADHESIVE_FINISH_IDS];

export const TABLOID_AUTOMATIC_TIER_IDS = {
  standardFromOne: "standard-1-to-14",
  standardFromFifteen: "standard-from-15",
  standardAdhesiveFromOne: "standard-adhesive-1-to-4",
  standardAdhesiveFromFive: "standard-adhesive-from-5",
  preCutAdhesiveFromOne: "pre-cut-adhesive-1-to-4",
  preCutAdhesiveFromFive: "pre-cut-adhesive-from-5",
} as const;

export type TabloidAutomaticTierId =
  (typeof TABLOID_AUTOMATIC_TIER_IDS)[keyof typeof TABLOID_AUTOMATIC_TIER_IDS];

export type TabloidTypeDefinition = Readonly<{
  id: TabloidTypeId;
  name: "Tabloide estándar" | "Tabloide adhesivo";
}>;

export type TabloidAdhesiveFinishDefinition = Readonly<{
  id: TabloidAdhesiveFinishId;
  name: "Adhesivo estándar" | "Adhesivo precortado";
}>;

export type TabloidAutomaticTier = Readonly<{
  id: TabloidAutomaticTierId;
  name:
    | "Precio estándar de 1 a 14 unidades"
    | "Precio por volumen desde 15 unidades"
    | "Precio estándar de 1 a 4 unidades"
    | "Precio por volumen desde 5 unidades";
  minimumQuantity: number;
  automaticBaseUnitPrice: number;
  authorizedMinimum: number;
}>;

const { standard, adhesive } = TABLOID_TYPE_IDS;
const { standard: standardAdhesive, preCut } =
  TABLOID_ADHESIVE_FINISH_IDS;
const {
  standardFromOne,
  standardFromFifteen,
  standardAdhesiveFromOne,
  standardAdhesiveFromFive,
  preCutAdhesiveFromOne,
  preCutAdhesiveFromFive,
} = TABLOID_AUTOMATIC_TIER_IDS;

export const TABLOID_TYPE_DEFINITIONS: Readonly<
  Record<TabloidTypeId, TabloidTypeDefinition>
> = {
  [standard]: { id: standard, name: "Tabloide estándar" },
  [adhesive]: { id: adhesive, name: "Tabloide adhesivo" },
};

export const TABLOID_TYPES: readonly TabloidTypeDefinition[] = [
  TABLOID_TYPE_DEFINITIONS[standard],
  TABLOID_TYPE_DEFINITIONS[adhesive],
];

export const TABLOID_ADHESIVE_FINISH_DEFINITIONS: Readonly<
  Record<TabloidAdhesiveFinishId, TabloidAdhesiveFinishDefinition>
> = {
  [standardAdhesive]: {
    id: standardAdhesive,
    name: "Adhesivo estándar",
  },
  [preCut]: { id: preCut, name: "Adhesivo precortado" },
};

export const TABLOID_ADHESIVE_FINISHES: readonly TabloidAdhesiveFinishDefinition[] = [
  TABLOID_ADHESIVE_FINISH_DEFINITIONS[standardAdhesive],
  TABLOID_ADHESIVE_FINISH_DEFINITIONS[preCut],
];

export const TABLOID_AUTOMATIC_TIERS: Readonly<
  Record<TabloidAutomaticTierId, TabloidAutomaticTier>
> = {
  [standardFromOne]: {
    id: standardFromOne,
    name: "Precio estándar de 1 a 14 unidades",
    minimumQuantity: 1,
    automaticBaseUnitPrice: 15_000,
    authorizedMinimum: 10_000,
  },
  [standardFromFifteen]: {
    id: standardFromFifteen,
    name: "Precio por volumen desde 15 unidades",
    minimumQuantity: 15,
    automaticBaseUnitPrice: 8_000,
    authorizedMinimum: 8_000,
  },
  [standardAdhesiveFromOne]: {
    id: standardAdhesiveFromOne,
    name: "Precio estándar de 1 a 4 unidades",
    minimumQuantity: 1,
    automaticBaseUnitPrice: 20_000,
    authorizedMinimum: 15_000,
  },
  [standardAdhesiveFromFive]: {
    id: standardAdhesiveFromFive,
    name: "Precio por volumen desde 5 unidades",
    minimumQuantity: 5,
    automaticBaseUnitPrice: 15_000,
    authorizedMinimum: 15_000,
  },
  [preCutAdhesiveFromOne]: {
    id: preCutAdhesiveFromOne,
    name: "Precio estándar de 1 a 4 unidades",
    minimumQuantity: 1,
    automaticBaseUnitPrice: 25_000,
    authorizedMinimum: 20_000,
  },
  [preCutAdhesiveFromFive]: {
    id: preCutAdhesiveFromFive,
    name: "Precio por volumen desde 5 unidades",
    minimumQuantity: 5,
    automaticBaseUnitPrice: 20_000,
    authorizedMinimum: 20_000,
  },
};

export type TabloidAutomaticPricingResolution = Readonly<{
  tabloidType: TabloidTypeId;
  adhesiveFinish: TabloidAdhesiveFinishId | null;
  quantity: number;
  automaticTierId: TabloidAutomaticTierId;
  automaticBaseUnitPrice: number;
  applicableAuthorizedMinimum: number;
}>;

export function isTabloidTypeId(value: string): value is TabloidTypeId {
  return TABLOID_TYPES.some((tabloidType) => tabloidType.id === value);
}

export function isTabloidAdhesiveFinishId(
  value: string,
): value is TabloidAdhesiveFinishId {
  return TABLOID_ADHESIVE_FINISHES.some((finish) => finish.id === value);
}

export function getTabloidTypeDefinition(
  tabloidType: TabloidTypeId,
): TabloidTypeDefinition {
  return TABLOID_TYPE_DEFINITIONS[tabloidType];
}

export function getTabloidAdhesiveFinishDefinition(
  adhesiveFinish: TabloidAdhesiveFinishId,
): TabloidAdhesiveFinishDefinition {
  return TABLOID_ADHESIVE_FINISH_DEFINITIONS[adhesiveFinish];
}

export function getTabloidAutomaticTier(
  tierId: TabloidAutomaticTierId,
): TabloidAutomaticTier {
  return TABLOID_AUTOMATIC_TIERS[tierId];
}

export function resolveTabloidAutomaticPricing(
  tabloidType: TabloidTypeId,
  adhesiveFinish: TabloidAdhesiveFinishId | null,
  quantity: number,
): TabloidAutomaticPricingResolution {
  const validQuantity = validatePositiveIntegerQuantity(quantity);
  let automaticTierId: TabloidAutomaticTierId;

  if (tabloidType === standard) {
    if (adhesiveFinish !== null) {
      throw new RangeError(
        "Standard tabloid must not include an adhesive finish.",
      );
    }

    automaticTierId =
      validQuantity >= TABLOID_AUTOMATIC_TIERS[standardFromFifteen].minimumQuantity
        ? standardFromFifteen
        : standardFromOne;
  } else {
    if (adhesiveFinish === null) {
      throw new RangeError("Adhesive tabloid finish is required.");
    }

    if (adhesiveFinish === standardAdhesive) {
      automaticTierId =
        validQuantity >=
        TABLOID_AUTOMATIC_TIERS[standardAdhesiveFromFive].minimumQuantity
          ? standardAdhesiveFromFive
          : standardAdhesiveFromOne;
    } else {
      automaticTierId =
        validQuantity >=
        TABLOID_AUTOMATIC_TIERS[preCutAdhesiveFromFive].minimumQuantity
          ? preCutAdhesiveFromFive
          : preCutAdhesiveFromOne;
    }
  }

  const automaticTier = TABLOID_AUTOMATIC_TIERS[automaticTierId];

  return {
    tabloidType,
    adhesiveFinish,
    quantity: validQuantity,
    automaticTierId,
    automaticBaseUnitPrice: automaticTier.automaticBaseUnitPrice,
    applicableAuthorizedMinimum: automaticTier.authorizedMinimum,
  };
}
