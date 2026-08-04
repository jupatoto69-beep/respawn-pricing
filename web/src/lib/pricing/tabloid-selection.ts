import { parsePositiveIntegerQuantity } from "./service-quantity";
import {
  TABLOID_TYPE_IDS,
  type TabloidAdhesiveFinishId,
  type TabloidTypeId,
} from "./tabloid-pricing";

export type TabloidPricingFormValues = Readonly<{
  pricingStrategy: "tabloid-pricing";
  tabloidType: TabloidTypeId | "";
  adhesiveFinish: TabloidAdhesiveFinishId | "";
  quantity: string;
  negotiatedBaseUnitPrice: string;
  belowMinimumConfirmed: boolean;
  isLaminated: boolean;
}>;

export function createInitialTabloidPricingFormValues(): TabloidPricingFormValues {
  return {
    pricingStrategy: "tabloid-pricing",
    tabloidType: "",
    adhesiveFinish: "",
    quantity: "1",
    negotiatedBaseUnitPrice: "",
    belowMinimumConfirmed: false,
    isLaminated: false,
  };
}

function keepValidQuantityOrDefault(quantity: string): string {
  try {
    parsePositiveIntegerQuantity(quantity);
    return quantity;
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return "1";
    }

    throw error;
  }
}

export function changeTabloidTypeSelection(
  values: TabloidPricingFormValues,
  tabloidType: TabloidTypeId | "",
): TabloidPricingFormValues {
  if (values.tabloidType === tabloidType) {
    return values;
  }

  return {
    ...values,
    tabloidType,
    adhesiveFinish: "",
    quantity: keepValidQuantityOrDefault(values.quantity),
    negotiatedBaseUnitPrice: "",
    belowMinimumConfirmed: false,
  };
}

export function changeTabloidAdhesiveFinishSelection(
  values: TabloidPricingFormValues,
  adhesiveFinish: TabloidAdhesiveFinishId | "",
): TabloidPricingFormValues {
  const compatibleFinish =
    values.tabloidType === TABLOID_TYPE_IDS.adhesive ? adhesiveFinish : "";

  if (values.adhesiveFinish === compatibleFinish) {
    return values;
  }

  return {
    ...values,
    adhesiveFinish: compatibleFinish,
    negotiatedBaseUnitPrice: "",
    belowMinimumConfirmed: false,
  };
}

export function changeTabloidQuantity(
  values: TabloidPricingFormValues,
  quantity: string,
): TabloidPricingFormValues {
  if (values.quantity === quantity) {
    return values;
  }

  return {
    ...values,
    quantity,
    belowMinimumConfirmed: false,
  };
}

export function changeTabloidNegotiatedBaseUnitPrice(
  values: TabloidPricingFormValues,
  negotiatedBaseUnitPrice: string,
): TabloidPricingFormValues {
  if (values.negotiatedBaseUnitPrice === negotiatedBaseUnitPrice) {
    return values;
  }

  return {
    ...values,
    negotiatedBaseUnitPrice,
    belowMinimumConfirmed: false,
  };
}

export function changeTabloidLaminationSelection(
  values: TabloidPricingFormValues,
  isLaminated: boolean,
): TabloidPricingFormValues {
  if (values.isLaminated === isLaminated) {
    return values;
  }

  return {
    ...values,
    isLaminated,
    belowMinimumConfirmed: false,
  };
}

export function changeTabloidBelowMinimumConfirmation(
  values: TabloidPricingFormValues,
  belowMinimumConfirmed: boolean,
): TabloidPricingFormValues {
  return {
    ...values,
    belowMinimumConfirmed,
  };
}
