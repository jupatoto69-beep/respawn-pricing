import {
  resolveBusinessCardAutomaticPricing,
  type BusinessCardAutomaticPricingResolution,
  type BusinessCardTypeId,
} from "./business-card-pricing";
import { validatePositiveWholeNumberCop } from "./negotiated-cop-price";

export const BUSINESS_CARD_CONFIRMATION_REQUIRED_ERROR =
  "Below-minimum business-card pricing requires confirmation.";

export type BusinessCardPriceSource = "automatic" | "negotiated";
export type BusinessCardConfirmationStatus = "not-required" | "confirmed";

export type BusinessCardPricingDecision =
  BusinessCardAutomaticPricingResolution &
    Readonly<{
      negotiatedUnitPrice: number | null;
      priceSource: BusinessCardPriceSource;
      resolvedUnitPrice: number;
      isBelowAuthorizedMinimum: boolean;
      requiresConfirmation: boolean;
    }>;

export type BusinessCardPriceCalculation = BusinessCardPricingDecision &
  Readonly<{
    confirmationStatus: BusinessCardConfirmationStatus;
    totalPrice: number;
  }>;

export type CalculateBusinessCardPriceInput = Readonly<{
  cardType: BusinessCardTypeId;
  quantityInThousands: number;
  negotiatedUnitPrice: number | null;
  belowMinimumConfirmed: boolean;
}>;

export function resolveBusinessCardPricingDecision(
  cardType: BusinessCardTypeId,
  quantityInThousands: number,
  negotiatedUnitPrice: number | null,
): BusinessCardPricingDecision {
  const automaticPricing = resolveBusinessCardAutomaticPricing(
    cardType,
    quantityInThousands,
  );
  const validNegotiatedUnitPrice =
    negotiatedUnitPrice === null
      ? null
      : validatePositiveWholeNumberCop(negotiatedUnitPrice);
  const priceSource: BusinessCardPriceSource =
    validNegotiatedUnitPrice === null ? "automatic" : "negotiated";
  const resolvedUnitPrice =
    validNegotiatedUnitPrice ?? automaticPricing.automaticUnitPrice;
  const isBelowAuthorizedMinimum =
    validNegotiatedUnitPrice !== null &&
    validNegotiatedUnitPrice < automaticPricing.applicableAuthorizedMinimum;

  return {
    ...automaticPricing,
    negotiatedUnitPrice: validNegotiatedUnitPrice,
    priceSource,
    resolvedUnitPrice,
    isBelowAuthorizedMinimum,
    requiresConfirmation: isBelowAuthorizedMinimum,
  };
}

export function calculateBusinessCardPrice({
  cardType,
  quantityInThousands,
  negotiatedUnitPrice,
  belowMinimumConfirmed,
}: CalculateBusinessCardPriceInput): BusinessCardPriceCalculation {
  const decision = resolveBusinessCardPricingDecision(
    cardType,
    quantityInThousands,
    negotiatedUnitPrice,
  );

  if (decision.requiresConfirmation && !belowMinimumConfirmed) {
    throw new RangeError(BUSINESS_CARD_CONFIRMATION_REQUIRED_ERROR);
  }

  const totalPrice = decision.quantityInThousands * decision.resolvedUnitPrice;

  if (!Number.isSafeInteger(totalPrice)) {
    throw new RangeError("Business-card total must be a safe integer.");
  }

  return {
    ...decision,
    confirmationStatus: decision.requiresConfirmation
      ? "confirmed"
      : "not-required",
    totalPrice,
  };
}
