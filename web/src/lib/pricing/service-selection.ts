import {
  EMPTY_MAINTENANCE_SELECTION,
  type MaintenanceSelection,
} from "./resolve-maintenance-price";
import {
  getService,
  type ServiceCategoryId,
  type ServiceId,
} from "./service-catalog";
import {
  createInitialVideoDurationInput,
  type VideoDurationInput,
} from "./video-duration";
import {
  createInitialBusinessCardPricingFormValues,
  type BusinessCardPricingFormValues,
} from "./business-card-selection";

export type ServiceSpecificValues =
  | Readonly<{
      pricingStrategy: "none";
    }>
  | Readonly<{
      pricingStrategy: "maintenance-selection";
      quantity: string;
      maintenance: MaintenanceSelection;
    }>
  | Readonly<{
      pricingStrategy: "fixed-price";
      quantity: string;
    }>
  | Readonly<{
      pricingStrategy: "quantity-tier";
      quantity: string;
    }>
  | Readonly<{
      pricingStrategy: "duration";
      duration: VideoDurationInput;
    }>
  | BusinessCardPricingFormValues;

export type ServicesPricingFormState = Readonly<{
  categoryId: ServiceCategoryId | "";
  serviceId: ServiceId | "";
  specificValues: ServiceSpecificValues;
}>;

export function createInitialServicesPricingFormState(
  categoryId: ServiceCategoryId | "" = "",
): ServicesPricingFormState {
  return {
    categoryId,
    serviceId: "",
    specificValues: { pricingStrategy: "none" },
  };
}

export function changeServiceCategorySelection(
  selection: ServicesPricingFormState,
  categoryId: ServiceCategoryId | "",
): ServicesPricingFormState {
  if (selection.categoryId === categoryId) {
    return selection;
  }

  return createInitialServicesPricingFormState(categoryId);
}

export function changeServiceSelection(
  selection: ServicesPricingFormState,
  serviceId: ServiceId | "",
): ServicesPricingFormState {
  if (selection.serviceId === serviceId) {
    return selection;
  }

  const service = getService(selection.categoryId, serviceId);

  if (service === null) {
    return createInitialServicesPricingFormState(selection.categoryId);
  }

  switch (service.pricingStrategy) {
    case "maintenance-selection":
      return {
        ...selection,
        serviceId: service.id,
        specificValues: {
          pricingStrategy: service.pricingStrategy,
          quantity: "1",
          maintenance: EMPTY_MAINTENANCE_SELECTION,
        },
      };
    case "fixed-price":
    case "quantity-tier":
      return {
        ...selection,
        serviceId: service.id,
        specificValues: {
          pricingStrategy: service.pricingStrategy,
          quantity: "1",
        },
      };
    case "duration":
      return {
        ...selection,
        serviceId: service.id,
        specificValues: {
          pricingStrategy: service.pricingStrategy,
          duration: createInitialVideoDurationInput(),
        },
      };
    case "business-card-pricing":
      return {
        ...selection,
        serviceId: service.id,
        specificValues: createInitialBusinessCardPricingFormValues(),
      };
  }
}
