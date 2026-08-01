import {
  getFixedPriceComputerService,
  type FixedPriceComputerServiceId,
} from "./computer-service-catalog";
import { validatePositiveIntegerQuantity } from "./service-quantity";

export type FixedPriceCalculation = Readonly<{
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}>;

export function calculateFixedPrice(
  unitPrice: number,
  quantity: number,
): FixedPriceCalculation {
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new RangeError("Fixed unit price must be a finite non-negative number.");
  }

  const validQuantity = validatePositiveIntegerQuantity(quantity);
  const totalPrice = unitPrice * validQuantity;

  if (!Number.isFinite(totalPrice)) {
    throw new RangeError("Fixed-price total must be finite.");
  }

  return {
    quantity: validQuantity,
    unitPrice,
    totalPrice,
  };
}

export function calculateFixedPriceService(
  serviceId: FixedPriceComputerServiceId,
  quantity: number,
): FixedPriceCalculation {
  const service = getFixedPriceComputerService(serviceId);

  return calculateFixedPrice(service.unitPrice, quantity);
}
