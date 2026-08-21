import { CUT_VINYL_PRODUCT_ID } from "./area-product-catalog";
import { roundUpToCop500 } from "./round-up-to-cop-500";

export const CUT_VINYL_COLOR_GROUP_MINIMUM_COP = 15_000;
export const CUT_VINYL_COLOR_GROUP_PRICING_KIND = "cut-vinyl-color-group";

export type NormalizedCutVinylColor = Readonly<{
  displayValue: string;
  comparisonKey: string;
}>;

export type CutVinylColorGroupPricing = Readonly<{
  kind: typeof CUT_VINYL_COLOR_GROUP_PRICING_KIND;
  productId: typeof CUT_VINYL_PRODUCT_ID;
  groupKey: string;
  subtotalBeforeMinimumAndRounding: number;
}>;

export type CutVinylColorGroupCalculation = Readonly<{
  subtotalBeforeMinimumAndRounding: number;
  protectedSubtotal: number;
  roundedTotal: number;
}>;

type CutVinylColorGroupItem = Readonly<{
  lineId: string;
  pricing: CutVinylColorGroupPricing;
}>;

export type CutVinylColorGroupAllocation = Readonly<{
  lineId: string;
  lineTotal: number;
}>;

function assertValidSubtotal(subtotal: number): void {
  if (!Number.isFinite(subtotal)) {
    throw new RangeError("Cut vinyl commercial subtotal must be finite.");
  }

  if (subtotal < 0) {
    throw new RangeError(
      "Cut vinyl commercial subtotal must not be negative.",
    );
  }
}

function addSafeSubtotals(currentTotal: number, subtotal: number): number {
  const nextTotal = currentTotal + subtotal;

  if (!Number.isFinite(nextTotal) || nextTotal > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(
      "Cut vinyl color-group subtotal is outside the safe range.",
    );
  }

  return nextTotal;
}

export function normalizeCutVinylColor(
  color: string,
): NormalizedCutVinylColor {
  const displayValue = color.normalize("NFC").trim().replace(/\s+/gu, " ");

  if (displayValue.length === 0) {
    throw new RangeError("Cut vinyl color is required.");
  }

  return Object.freeze({
    displayValue,
    comparisonKey: displayValue.toLocaleLowerCase("es-CO"),
  });
}

export function createCutVinylColorGroupPricing(
  productId: string,
  color: string,
  subtotalBeforeMinimumAndRounding: number,
): CutVinylColorGroupPricing | null {
  if (productId !== CUT_VINYL_PRODUCT_ID) {
    return null;
  }

  assertValidSubtotal(subtotalBeforeMinimumAndRounding);
  const normalizedColor = normalizeCutVinylColor(color);

  return Object.freeze({
    kind: CUT_VINYL_COLOR_GROUP_PRICING_KIND,
    productId: CUT_VINYL_PRODUCT_ID,
    groupKey: `${CUT_VINYL_PRODUCT_ID}:${normalizedColor.comparisonKey}`,
    subtotalBeforeMinimumAndRounding,
  });
}

export function calculateCutVinylColorGroupPrice(
  subtotalsBeforeMinimumAndRounding: readonly number[],
): CutVinylColorGroupCalculation {
  if (subtotalsBeforeMinimumAndRounding.length === 0) {
    throw new RangeError("Cut vinyl color group must contain at least one item.");
  }

  const subtotalBeforeMinimumAndRounding =
    subtotalsBeforeMinimumAndRounding.reduce((total, subtotal) => {
      assertValidSubtotal(subtotal);
      return addSafeSubtotals(total, subtotal);
    }, 0);
  const protectedSubtotal = Math.max(
    subtotalBeforeMinimumAndRounding,
    CUT_VINYL_COLOR_GROUP_MINIMUM_COP,
  );
  const roundedTotal = roundUpToCop500(protectedSubtotal);

  if (!Number.isSafeInteger(roundedTotal)) {
    throw new RangeError(
      "Cut vinyl color-group total is outside the safe range.",
    );
  }

  return Object.freeze({
    subtotalBeforeMinimumAndRounding,
    protectedSubtotal,
    roundedTotal,
  });
}

function allocateRoundedGroupTotal(
  items: readonly CutVinylColorGroupItem[],
  groupTotal: number,
  groupSubtotal: number,
): readonly CutVinylColorGroupAllocation[] {
  const proportionalShares = items.map((item, index) => {
    const exactShare =
      groupSubtotal === 0
        ? groupTotal / items.length
        : (item.pricing.subtotalBeforeMinimumAndRounding / groupSubtotal) *
          groupTotal;
    const floorShare = Math.floor(exactShare);

    return {
      index,
      lineId: item.lineId,
      floorShare,
      fractionalRemainder: exactShare - floorShare,
    };
  });
  const allocatedFloorTotal = proportionalShares.reduce(
    (total, share) => total + share.floorShare,
    0,
  );
  const remainingPesos = groupTotal - allocatedFloorTotal;
  const remainderOrder = [...proportionalShares].sort(
    (left, right) =>
      right.fractionalRemainder - left.fractionalRemainder ||
      left.index - right.index,
  );
  const extraPesoIndexes = new Set(
    remainderOrder.slice(0, remainingPesos).map((share) => share.index),
  );

  return Object.freeze(
    proportionalShares.map((share) =>
      Object.freeze({
        lineId: share.lineId,
        lineTotal:
          share.floorShare + (extraPesoIndexes.has(share.index) ? 1 : 0),
      }),
    ),
  );
}

export function allocateCutVinylColorGroupLineTotals(
  items: readonly CutVinylColorGroupItem[],
): readonly CutVinylColorGroupAllocation[] {
  const groups = new Map<string, CutVinylColorGroupItem[]>();

  for (const item of items) {
    assertValidSubtotal(item.pricing.subtotalBeforeMinimumAndRounding);
    const currentGroup = groups.get(item.pricing.groupKey) ?? [];
    currentGroup.push(item);
    groups.set(item.pricing.groupKey, currentGroup);
  }

  return Object.freeze(
    [...groups.values()].flatMap((groupItems) => {
      const calculation = calculateCutVinylColorGroupPrice(
        groupItems.map(
          (item) => item.pricing.subtotalBeforeMinimumAndRounding,
        ),
      );

      return allocateRoundedGroupTotal(
        groupItems,
        calculation.roundedTotal,
        calculation.subtotalBeforeMinimumAndRounding,
      );
    }),
  );
}
