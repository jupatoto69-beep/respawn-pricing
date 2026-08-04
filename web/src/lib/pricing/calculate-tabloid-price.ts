import { validatePositiveWholeNumberCop } from "./negotiated-cop-price";
import {
  resolveTabloidAutomaticPricing,
  type TabloidAdhesiveFinishId,
  type TabloidAutomaticPricingResolution,
  type TabloidTypeId,
} from "./tabloid-pricing";

export const TABLOID_LAMINATION_UNIT_PRICE = 5_000;
export const TABLOID_CONFIRMATION_REQUIRED_ERROR =
  "Below-minimum tabloid pricing requires confirmation.";

export type TabloidBasePriceSource = "automatic" | "negotiated";
export type TabloidConfirmationStatus = "not-required" | "confirmed";

export type TabloidPricingDecision = TabloidAutomaticPricingResolution &
  Readonly<{
    negotiatedBaseUnitPrice: number | null;
    basePriceSource: TabloidBasePriceSource;
    resolvedBaseUnitPrice: number;
    isBelowAuthorizedMinimum: boolean;
    requiresConfirmation: boolean;
    isLaminated: boolean;
    laminationUnitPrice: number;
    resolvedFinalUnitPrice: number;
  }>;

export type TabloidPriceCalculation = TabloidPricingDecision &
  Readonly<{
    confirmationStatus: TabloidConfirmationStatus;
    baseSubtotal: number;
    laminationSubtotal: number;
    totalPrice: number;
  }>;

export type CalculateTabloidPriceInput = Readonly<{
  tabloidType: TabloidTypeId;
  adhesiveFinish: TabloidAdhesiveFinishId | null;
  quantity: number;
  negotiatedBaseUnitPrice: number | null;
  belowMinimumConfirmed: boolean;
  isLaminated: boolean;
}>;

function assertSafeTabloidPrice(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Tabloid pricing total must be a safe integer.");
  }

  return value;
}

export function resolveTabloidPricingDecision(
  tabloidType: TabloidTypeId,
  adhesiveFinish: TabloidAdhesiveFinishId | null,
  quantity: number,
  negotiatedBaseUnitPrice: number | null,
  isLaminated: boolean,
): TabloidPricingDecision {
  const automaticPricing = resolveTabloidAutomaticPricing(
    tabloidType,
    adhesiveFinish,
    quantity,
  );
  const validNegotiatedBaseUnitPrice =
    negotiatedBaseUnitPrice === null
      ? null
      : validatePositiveWholeNumberCop(negotiatedBaseUnitPrice);
  const basePriceSource: TabloidBasePriceSource =
    validNegotiatedBaseUnitPrice === null ? "automatic" : "negotiated";
  const resolvedBaseUnitPrice =
    validNegotiatedBaseUnitPrice ?? automaticPricing.automaticBaseUnitPrice;
  const isBelowAuthorizedMinimum =
    validNegotiatedBaseUnitPrice !== null &&
    validNegotiatedBaseUnitPrice <
      automaticPricing.applicableAuthorizedMinimum;
  const laminationUnitPrice = isLaminated
    ? TABLOID_LAMINATION_UNIT_PRICE
    : 0;
  const resolvedFinalUnitPrice = assertSafeTabloidPrice(
    resolvedBaseUnitPrice + laminationUnitPrice,
  );

  return {
    ...automaticPricing,
    negotiatedBaseUnitPrice: validNegotiatedBaseUnitPrice,
    basePriceSource,
    resolvedBaseUnitPrice,
    isBelowAuthorizedMinimum,
    requiresConfirmation: isBelowAuthorizedMinimum,
    isLaminated,
    laminationUnitPrice,
    resolvedFinalUnitPrice,
  };
}

export function calculateTabloidPrice({
  tabloidType,
  adhesiveFinish,
  quantity,
  negotiatedBaseUnitPrice,
  belowMinimumConfirmed,
  isLaminated,
}: CalculateTabloidPriceInput): TabloidPriceCalculation {
  const decision = resolveTabloidPricingDecision(
    tabloidType,
    adhesiveFinish,
    quantity,
    negotiatedBaseUnitPrice,
    isLaminated,
  );

  if (decision.requiresConfirmation && !belowMinimumConfirmed) {
    throw new RangeError(TABLOID_CONFIRMATION_REQUIRED_ERROR);
  }

  const baseSubtotal = assertSafeTabloidPrice(
    decision.quantity * decision.resolvedBaseUnitPrice,
  );
  const laminationSubtotal = assertSafeTabloidPrice(
    decision.quantity * decision.laminationUnitPrice,
  );
  const totalPrice = assertSafeTabloidPrice(
    baseSubtotal + laminationSubtotal,
  );

  return {
    ...decision,
    confirmationStatus: decision.requiresConfirmation
      ? "confirmed"
      : "not-required",
    baseSubtotal,
    laminationSubtotal,
    totalPrice,
  };
}
