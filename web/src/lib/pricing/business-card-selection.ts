import {
  type BusinessCardTypeId,
} from "./business-card-pricing";
import { parsePositiveIntegerQuantity } from "./service-quantity";

export type BusinessCardPricingFormValues = Readonly<{
  pricingStrategy: "business-card-pricing";
  cardType: BusinessCardTypeId | "";
  quantityInThousands: string;
  negotiatedUnitPrice: string;
  belowMinimumConfirmed: boolean;
}>;

export function createInitialBusinessCardPricingFormValues(): BusinessCardPricingFormValues {
  return {
    pricingStrategy: "business-card-pricing",
    cardType: "",
    quantityInThousands: "1",
    negotiatedUnitPrice: "",
    belowMinimumConfirmed: false,
  };
}

function keepValidQuantityOrDefault(quantityInThousands: string): string {
  try {
    parsePositiveIntegerQuantity(quantityInThousands);
    return quantityInThousands;
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return "1";
    }

    throw error;
  }
}

export function changeBusinessCardTypeSelection(
  values: BusinessCardPricingFormValues,
  cardType: BusinessCardTypeId | "",
): BusinessCardPricingFormValues {
  if (values.cardType === cardType) {
    return values;
  }

  return {
    ...values,
    cardType,
    quantityInThousands: keepValidQuantityOrDefault(
      values.quantityInThousands,
    ),
    negotiatedUnitPrice: "",
    belowMinimumConfirmed: false,
  };
}

export function changeBusinessCardQuantity(
  values: BusinessCardPricingFormValues,
  quantityInThousands: string,
): BusinessCardPricingFormValues {
  if (values.quantityInThousands === quantityInThousands) {
    return values;
  }

  return {
    ...values,
    quantityInThousands,
    belowMinimumConfirmed: false,
  };
}

export function changeBusinessCardNegotiatedUnitPrice(
  values: BusinessCardPricingFormValues,
  negotiatedUnitPrice: string,
): BusinessCardPricingFormValues {
  if (values.negotiatedUnitPrice === negotiatedUnitPrice) {
    return values;
  }

  return {
    ...values,
    negotiatedUnitPrice,
    belowMinimumConfirmed: false,
  };
}

export function changeBusinessCardBelowMinimumConfirmation(
  values: BusinessCardPricingFormValues,
  belowMinimumConfirmed: boolean,
): BusinessCardPricingFormValues {
  return {
    ...values,
    belowMinimumConfirmed,
  };
}
