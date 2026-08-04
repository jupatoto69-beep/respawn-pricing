"use client";

import { type ChangeEvent, type FormEvent, useId, useState } from "react";

import {
  calculateEquivalentCardQuantity,
  getBusinessCardAutomaticTier,
  getBusinessCardTypeDefinition,
  isBusinessCardTypeId,
  resolveBusinessCardAutomaticPricing,
  type BusinessCardAutomaticPricingResolution,
} from "@/lib/pricing/business-card-pricing";
import {
  changeBusinessCardBelowMinimumConfirmation,
  changeBusinessCardNegotiatedUnitPrice,
  changeBusinessCardQuantity,
  changeBusinessCardTypeSelection,
  type BusinessCardPricingFormValues,
} from "@/lib/pricing/business-card-selection";
import {
  BUSINESS_CARD_CONFIRMATION_REQUIRED_ERROR,
  calculateBusinessCardPrice,
  resolveBusinessCardPricingDecision,
  type BusinessCardPriceCalculation,
  type BusinessCardPricingDecision,
} from "@/lib/pricing/calculate-business-card-price";
import {
  TABLOID_CONFIRMATION_REQUIRED_ERROR,
  calculateTabloidPrice,
  resolveTabloidPricingDecision,
  type TabloidPriceCalculation,
  type TabloidPricingDecision,
} from "@/lib/pricing/calculate-tabloid-price";
import {
  calculateFixedPriceService,
  type FixedPriceCalculation,
} from "@/lib/pricing/calculate-fixed-price-service";
import {
  calculateSoftwareInstallationPrice,
  getSoftwareInstallationPricingTier,
  type SoftwareInstallationPriceCalculation,
} from "@/lib/pricing/calculate-software-installation-price";
import {
  calculateVideoEditingPrice,
  type VideoEditingPriceCalculation,
  VIDEO_EDITING_PRICING,
} from "@/lib/pricing/calculate-video-editing-price";
import { changeMaintenanceSelection } from "@/lib/pricing/computer-service-selection";
import {
  MAINTENANCE_OPTION_IDS,
  MAINTENANCE_OPTIONS,
  type FixedPriceComputerService,
  type MaintenanceComputerService,
  type MaintenanceOptionId,
  type QuantityTierComputerService,
  SYSTEM_MAINTENANCE_INCLUSIONS,
} from "@/lib/pricing/computer-service-catalog";
import { parseOptionalNegotiatedCopUnitPrice } from "@/lib/pricing/negotiated-cop-price";
import type {
  BusinessCardService,
  TabloidService,
} from "@/lib/pricing/printed-service-catalog";
import {
  calculateMaintenancePrice,
  resolveMaintenancePrice,
  type MaintenancePriceCalculation,
} from "@/lib/pricing/resolve-maintenance-price";
import {
  AUDIOVISUAL_SERVICE_IDS,
  getService,
  getServiceCategory,
  getServicesForCategory,
  isServiceCategoryId,
  isServiceIdForCategory,
  SERVICE_CATEGORY_CATALOG,
  type ServiceCategory,
  type ServiceCategoryId,
  type ServiceId,
  type VideoEditingService,
} from "@/lib/pricing/service-catalog";
import {
  changeServiceCategorySelection,
  changeServiceSelection,
  createInitialServicesPricingFormState,
  type ServicesPricingFormState,
} from "@/lib/pricing/service-selection";
import { parsePositiveIntegerQuantity } from "@/lib/pricing/service-quantity";
import {
  changeTabloidAdhesiveFinishSelection,
  changeTabloidBelowMinimumConfirmation,
  changeTabloidLaminationSelection,
  changeTabloidNegotiatedBaseUnitPrice,
  changeTabloidQuantity,
  changeTabloidTypeSelection,
  type TabloidPricingFormValues,
} from "@/lib/pricing/tabloid-selection";
import {
  getTabloidAdhesiveFinishDefinition,
  getTabloidAutomaticTier,
  getTabloidTypeDefinition,
  isTabloidAdhesiveFinishId,
  isTabloidTypeId,
  resolveTabloidAutomaticPricing,
  TABLOID_TYPE_IDS,
  type TabloidAdhesiveFinishId,
  type TabloidAutomaticPricingResolution,
} from "@/lib/pricing/tabloid-pricing";
import { parseVideoDuration } from "@/lib/pricing/video-duration";

import formStyles from "./area-pricing-calculator.module.css";
import styles from "./services-pricing-calculator.module.css";

type ResultBase = Readonly<{
  category: ServiceCategory;
}>;

type MaintenanceServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "maintenance-selection";
    service: MaintenanceComputerService;
    calculation: MaintenancePriceCalculation;
  }>;

type FixedPriceServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "fixed-price";
    service: FixedPriceComputerService;
    calculation: FixedPriceCalculation;
  }>;

type QuantityTierServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "quantity-tier";
    service: QuantityTierComputerService;
    calculation: SoftwareInstallationPriceCalculation;
  }>;

type DurationServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "duration";
    service: VideoEditingService;
    calculation: VideoEditingPriceCalculation;
  }>;

type BusinessCardServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "business-card-pricing";
    service: BusinessCardService;
    calculation: BusinessCardPriceCalculation;
  }>;

type TabloidServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "tabloid-pricing";
    service: TabloidService;
    calculation: TabloidPriceCalculation;
  }>;

type ServiceCalculationResult =
  | MaintenanceServiceResult
  | FixedPriceServiceResult
  | QuantityTierServiceResult
  | DurationServiceResult
  | BusinessCardServiceResult
  | TabloidServiceResult;

type ServicesPricingCalculatorProps = Readonly<{
  initialCategoryId?: ServiceCategoryId;
  initialServiceId?: ServiceId;
}>;

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const quantityFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const BUSINESS_CARD_PRICE_SOURCE_LABELS = {
  automatic: "Automático",
  negotiated: "Negociado",
} as const;

const BUSINESS_CARD_MINIMUM_STATUS_LABELS = {
  withinRange: "Dentro del rango autorizado",
  belowMinimum: "Por debajo del mínimo autorizado",
} as const;

const BUSINESS_CARD_CONFIRMATION_STATUS_LABELS = {
  "not-required": "No requerida",
  confirmed: "Confirmada",
} as const;

const TABLOID_BASE_PRICE_SOURCE_LABELS = {
  automatic: "Automático",
  negotiated: "Negociado",
} as const;

const TABLOID_MINIMUM_STATUS_LABELS = {
  withinRange: "Dentro del rango autorizado",
  belowMinimum: "Por debajo del mínimo autorizado",
} as const;

const TABLOID_CONFIRMATION_STATUS_LABELS = {
  "not-required": "No requerida",
  confirmed: "Confirmada",
} as const;

const SERVICE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  "Quantity is required.": "Ingresa la cantidad.",
  "Quantity must be a valid number.":
    "La cantidad debe ser un número válido.",
  "Quantity must be an integer.": "La cantidad debe ser un número entero.",
  "Quantity must be greater than zero.":
    "La cantidad debe ser mayor que cero.",
  "Fixed-price total must be finite.":
    "La cantidad ingresada produce un total fuera del rango permitido.",
  "Software installation total must be finite.":
    "La cantidad ingresada produce un total fuera del rango permitido.",
  "Minutes are required.": "Ingresa los minutos.",
  "Seconds are required.": "Ingresa los segundos.",
  "Minutes must be a valid number.":
    "Los minutos deben ser un número válido.",
  "Seconds must be a valid number.":
    "Los segundos deben ser un número válido.",
  "Minutes must be non-negative.":
    "Los minutos deben ser mayores o iguales que cero.",
  "Seconds must be non-negative.":
    "Los segundos deben ser mayores o iguales que cero.",
  "Minutes must be an integer.": "Los minutos deben ser un número entero.",
  "Seconds must be an integer.": "Los segundos deben ser un número entero.",
  "Seconds must be between 0 and 59.":
    "Los segundos deben estar entre 0 y 59.",
  "Duration must be greater than zero.":
    "La duración total debe ser mayor que 0:00.",
  "Duration must be within the supported range.":
    "La duración ingresada está fuera del rango permitido.",
  "Video editing total must be a safe integer.":
    "La duración ingresada produce un total fuera del rango permitido.",
  "Negotiated unit price must be a valid number.":
    "El precio negociado debe ser un número válido.",
  "Negotiated unit price must be greater than zero.":
    "El precio negociado debe ser mayor que cero.",
  "Negotiated unit price must be an integer.":
    "El precio negociado debe ser un valor COP entero.",
  "Equivalent card quantity must be a safe integer.":
    "La cantidad de millares está fuera del rango permitido.",
  "Business-card total must be a safe integer.":
    "Los datos ingresados producen un total fuera del rango permitido.",
  [BUSINESS_CARD_CONFIRMATION_REQUIRED_ERROR]:
    "Confirma que conoces la excepción bajo el mínimo antes de calcular.",
  "Adhesive tabloid finish is required.":
    "Selecciona un acabado para el tabloide adhesivo.",
  "Standard tabloid must not include an adhesive finish.":
    "El tabloide estándar no admite acabado adhesivo.",
  "Tabloid pricing total must be a safe integer.":
    "Los datos del tabloide producen un total fuera del rango permitido.",
  [TABLOID_CONFIRMATION_REQUIRED_ERROR]:
    "Confirma que conoces la excepción bajo el mínimo antes de calcular.",
};

function translateServiceError(error: RangeError): string {
  return (
    SERVICE_ERROR_MESSAGES[error.message] ??
    "Revisa los datos ingresados e inténtalo nuevamente."
  );
}

function resolveSoftwareInstallationPreview(
  quantity: string,
): SoftwareInstallationPriceCalculation | null {
  try {
    return calculateSoftwareInstallationPrice(
      parsePositiveIntegerQuantity(quantity),
    );
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return null;
    }

    throw error;
  }
}

type BusinessCardFormPreview = Readonly<{
  equivalentCardQuantity: number;
  automaticPricing: BusinessCardAutomaticPricingResolution | null;
  pricingDecision: BusinessCardPricingDecision | null;
}>;

function resolveBusinessCardFormPreview(
  values: BusinessCardPricingFormValues,
): BusinessCardFormPreview | null {
  try {
    const quantityInThousands = parsePositiveIntegerQuantity(
      values.quantityInThousands,
    );
    const equivalentCardQuantity =
      calculateEquivalentCardQuantity(quantityInThousands);

    if (values.cardType === "") {
      return {
        equivalentCardQuantity,
        automaticPricing: null,
        pricingDecision: null,
      };
    }

    const automaticPricing = resolveBusinessCardAutomaticPricing(
      values.cardType,
      quantityInThousands,
    );
    let pricingDecision: BusinessCardPricingDecision | null = null;

    try {
      pricingDecision = resolveBusinessCardPricingDecision(
        values.cardType,
        quantityInThousands,
        parseOptionalNegotiatedCopUnitPrice(values.negotiatedUnitPrice),
      );
    } catch (error: unknown) {
      if (!(error instanceof RangeError)) {
        throw error;
      }
    }

    return {
      equivalentCardQuantity,
      automaticPricing,
      pricingDecision,
    };
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return null;
    }

    throw error;
  }
}

type TabloidFormPreview = Readonly<{
  automaticPricing: TabloidAutomaticPricingResolution | null;
  pricingDecision: TabloidPricingDecision | null;
  calculation: TabloidPriceCalculation | null;
}>;

function resolveSelectedTabloidAdhesiveFinish(
  values: TabloidPricingFormValues,
): TabloidAdhesiveFinishId | null {
  if (values.tabloidType === TABLOID_TYPE_IDS.standard) {
    return null;
  }

  if (values.adhesiveFinish === "") {
    throw new RangeError("Adhesive tabloid finish is required.");
  }

  return values.adhesiveFinish;
}

function resolveTabloidFormPreview(
  values: TabloidPricingFormValues,
): TabloidFormPreview | null {
  try {
    const quantity = parsePositiveIntegerQuantity(values.quantity);

    if (values.tabloidType === "") {
      return {
        automaticPricing: null,
        pricingDecision: null,
        calculation: null,
      };
    }

    if (
      values.tabloidType === TABLOID_TYPE_IDS.adhesive &&
      values.adhesiveFinish === ""
    ) {
      return {
        automaticPricing: null,
        pricingDecision: null,
        calculation: null,
      };
    }

    const adhesiveFinish = resolveSelectedTabloidAdhesiveFinish(values);
    const automaticPricing = resolveTabloidAutomaticPricing(
      values.tabloidType,
      adhesiveFinish,
      quantity,
    );
    let pricingDecision: TabloidPricingDecision | null = null;
    let calculation: TabloidPriceCalculation | null = null;

    try {
      const negotiatedBaseUnitPrice = parseOptionalNegotiatedCopUnitPrice(
        values.negotiatedBaseUnitPrice,
      );
      pricingDecision = resolveTabloidPricingDecision(
        values.tabloidType,
        adhesiveFinish,
        quantity,
        negotiatedBaseUnitPrice,
        values.isLaminated,
      );

      try {
        calculation = calculateTabloidPrice({
          tabloidType: values.tabloidType,
          adhesiveFinish,
          quantity,
          negotiatedBaseUnitPrice,
          belowMinimumConfirmed: values.belowMinimumConfirmed,
          isLaminated: values.isLaminated,
        });
      } catch (error: unknown) {
        if (!(error instanceof RangeError)) {
          throw error;
        }
      }
    } catch (error: unknown) {
      if (!(error instanceof RangeError)) {
        throw error;
      }
    }

    return {
      automaticPricing,
      pricingDecision,
      calculation,
    };
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return null;
    }

    throw error;
  }
}

export function ServicesPricingCalculator({
  initialCategoryId,
  initialServiceId,
}: ServicesPricingCalculatorProps = {}) {
  const idPrefix = useId();
  const [values, setValues] = useState<ServicesPricingFormState>(() => {
    const initialValues = createInitialServicesPricingFormState(
      initialCategoryId ?? "",
    );

    return initialServiceId
      ? changeServiceSelection(initialValues, initialServiceId)
      : initialValues;
  });
  const [result, setResult] = useState<ServiceCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = getServiceCategory(values.categoryId);
  const categoryServices = getServicesForCategory(values.categoryId);
  const selectedService = getService(values.categoryId, values.serviceId);
  const maintenanceValues =
    values.specificValues.pricingStrategy === "maintenance-selection"
      ? values.specificValues
      : null;
  const quantityValues =
    values.specificValues.pricingStrategy === "maintenance-selection" ||
    values.specificValues.pricingStrategy === "fixed-price" ||
    values.specificValues.pricingStrategy === "quantity-tier"
      ? values.specificValues
      : null;
  const durationValues =
    values.specificValues.pricingStrategy === "duration"
      ? values.specificValues
      : null;
  const businessCardValues =
    values.specificValues.pricingStrategy === "business-card-pricing"
      ? values.specificValues
      : null;
  const tabloidValues =
    values.specificValues.pricingStrategy === "tabloid-pricing"
      ? values.specificValues
      : null;
  const maintenanceResolution =
    maintenanceValues !== null
      ? resolveMaintenancePrice(maintenanceValues.maintenance)
      : null;
  const softwareInstallationPreview =
    values.specificValues.pricingStrategy === "quantity-tier"
      ? resolveSoftwareInstallationPreview(values.specificValues.quantity)
      : null;
  const businessCardPreview =
    businessCardValues === null
      ? null
      : resolveBusinessCardFormPreview(businessCardValues);
  const businessCardAutomaticTier = businessCardPreview?.automaticPricing
    ? getBusinessCardAutomaticTier(
        businessCardPreview.automaticPricing.cardType,
        businessCardPreview.automaticPricing.automaticTierId,
      )
    : null;
  const businessCardPricingDecision =
    businessCardPreview?.pricingDecision ?? null;
  const tabloidPreview =
    tabloidValues === null ? null : resolveTabloidFormPreview(tabloidValues);
  const tabloidAutomaticTier = tabloidPreview?.automaticPricing
    ? getTabloidAutomaticTier(
        tabloidPreview.automaticPricing.automaticTierId,
      )
    : null;
  const tabloidPricingDecision = tabloidPreview?.pricingDecision ?? null;
  const tabloidCalculation = tabloidPreview?.calculation ?? null;
  const resolvedUnitPrice =
    selectedService?.pricingStrategy === "fixed-price"
      ? selectedService.unitPrice
      : selectedService?.pricingStrategy === "quantity-tier"
        ? softwareInstallationPreview?.unitPrice ?? null
        : selectedService?.pricingStrategy === "maintenance-selection"
          ? maintenanceResolution?.unitPrice ?? null
          : null;
  const resolvedTierName = softwareInstallationPreview
    ? getSoftwareInstallationPricingTier(softwareInstallationPreview.tierId)
        .name
    : null;

  function clearFeedback() {
    setResult(null);
    setError(null);
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value;
    const categoryId = isServiceCategoryId(value) ? value : "";

    setValues((currentValues) =>
      changeServiceCategorySelection(currentValues, categoryId),
    );
    clearFeedback();
  }

  function handleServiceChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value;
    const serviceId = isServiceIdForCategory(values.categoryId, value)
      ? value
      : "";

    setValues((currentValues) =>
      changeServiceSelection(currentValues, serviceId),
    );
    clearFeedback();
  }

  function handleQuantityChange(event: ChangeEvent<HTMLInputElement>) {
    const quantity = event.currentTarget.value;

    setValues((currentValues) => {
      const { specificValues } = currentValues;

      if (
        specificValues.pricingStrategy !== "maintenance-selection" &&
        specificValues.pricingStrategy !== "fixed-price" &&
        specificValues.pricingStrategy !== "quantity-tier"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: { ...specificValues, quantity },
      };
    });
    clearFeedback();
  }

  function handleBusinessCardTypeChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const value = event.currentTarget.value;
    const cardType = isBusinessCardTypeId(value) ? value : "";

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !==
        "business-card-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeBusinessCardTypeSelection(
          currentValues.specificValues,
          cardType,
        ),
      };
    });
    clearFeedback();
  }

  function handleBusinessCardQuantityChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const quantityInThousands = event.currentTarget.value;

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !==
        "business-card-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeBusinessCardQuantity(
          currentValues.specificValues,
          quantityInThousands,
        ),
      };
    });
    clearFeedback();
  }

  function handleBusinessCardNegotiatedPriceChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const negotiatedUnitPrice = event.currentTarget.value;

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !==
        "business-card-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeBusinessCardNegotiatedUnitPrice(
          currentValues.specificValues,
          negotiatedUnitPrice,
        ),
      };
    });
    clearFeedback();
  }

  function handleBusinessCardConfirmationChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const belowMinimumConfirmed = event.currentTarget.checked;

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !==
        "business-card-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeBusinessCardBelowMinimumConfirmation(
          currentValues.specificValues,
          belowMinimumConfirmed,
        ),
      };
    });
    clearFeedback();
  }

  function handleTabloidTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value;
    const tabloidType = isTabloidTypeId(value) ? value : "";

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !== "tabloid-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeTabloidTypeSelection(
          currentValues.specificValues,
          tabloidType,
        ),
      };
    });
    clearFeedback();
  }

  function handleTabloidAdhesiveFinishChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const value = event.currentTarget.value;
    const adhesiveFinish = isTabloidAdhesiveFinishId(value) ? value : "";

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !== "tabloid-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeTabloidAdhesiveFinishSelection(
          currentValues.specificValues,
          adhesiveFinish,
        ),
      };
    });
    clearFeedback();
  }

  function handleTabloidQuantityChange(event: ChangeEvent<HTMLInputElement>) {
    const quantity = event.currentTarget.value;

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !== "tabloid-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeTabloidQuantity(
          currentValues.specificValues,
          quantity,
        ),
      };
    });
    clearFeedback();
  }

  function handleTabloidNegotiatedPriceChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const negotiatedBaseUnitPrice = event.currentTarget.value;

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !== "tabloid-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeTabloidNegotiatedBaseUnitPrice(
          currentValues.specificValues,
          negotiatedBaseUnitPrice,
        ),
      };
    });
    clearFeedback();
  }

  function handleTabloidLaminationChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const isLaminated = event.currentTarget.value === "laminated";

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !== "tabloid-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeTabloidLaminationSelection(
          currentValues.specificValues,
          isLaminated,
        ),
      };
    });
    clearFeedback();
  }

  function handleTabloidConfirmationChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const belowMinimumConfirmed = event.currentTarget.checked;

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !== "tabloid-pricing"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: changeTabloidBelowMinimumConfirmation(
          currentValues.specificValues,
          belowMinimumConfirmed,
        ),
      };
    });
    clearFeedback();
  }

  function handleMaintenanceChange(event: ChangeEvent<HTMLInputElement>) {
    const optionId = event.currentTarget.value as MaintenanceOptionId;
    const selected = event.currentTarget.checked;

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !==
        "maintenance-selection"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: {
          ...currentValues.specificValues,
          maintenance: changeMaintenanceSelection(
            currentValues.specificValues.maintenance,
            optionId,
            selected,
          ),
        },
      };
    });
    clearFeedback();
  }

  function handleDurationChange(event: ChangeEvent<HTMLInputElement>) {
    const fieldName = event.currentTarget.name;
    const value = event.currentTarget.value;

    if (fieldName !== "minutes" && fieldName !== "seconds") {
      return;
    }

    setValues((currentValues) => {
      if (currentValues.specificValues.pricingStrategy !== "duration") {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: {
          ...currentValues.specificValues,
          duration: {
            ...currentValues.specificValues.duration,
            [fieldName]: value,
          },
        },
      };
    });
    clearFeedback();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedCategory === null) {
      setResult(null);
      setError("Selecciona una categoría.");
      return;
    }

    if (selectedService === null) {
      setResult(null);
      setError("Selecciona un servicio.");
      return;
    }

    try {
      switch (selectedService.pricingStrategy) {
        case "maintenance-selection": {
          if (
            values.specificValues.pricingStrategy !== "maintenance-selection"
          ) {
            throw new Error("Service state does not match its strategy.");
          }

          const calculation = calculateMaintenancePrice(
            values.specificValues.maintenance,
            parsePositiveIntegerQuantity(values.specificValues.quantity),
          );

          if (calculation === null) {
            setResult(null);
            setError("Selecciona al menos una opción de mantenimiento.");
            return;
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation,
          });
          break;
        }
        case "fixed-price": {
          if (values.specificValues.pricingStrategy !== "fixed-price") {
            throw new Error("Service state does not match its strategy.");
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation: calculateFixedPriceService(
              selectedService.id,
              parsePositiveIntegerQuantity(values.specificValues.quantity),
            ),
          });
          break;
        }
        case "quantity-tier": {
          if (values.specificValues.pricingStrategy !== "quantity-tier") {
            throw new Error("Service state does not match its strategy.");
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation: calculateSoftwareInstallationPrice(
              parsePositiveIntegerQuantity(values.specificValues.quantity),
            ),
          });
          break;
        }
        case "business-card-pricing": {
          if (
            values.specificValues.pricingStrategy !== "business-card-pricing"
          ) {
            throw new Error("Service state does not match its strategy.");
          }

          if (values.specificValues.cardType === "") {
            setResult(null);
            setError("Selecciona un tipo de tarjeta.");
            return;
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation: calculateBusinessCardPrice({
              cardType: values.specificValues.cardType,
              quantityInThousands: parsePositiveIntegerQuantity(
                values.specificValues.quantityInThousands,
              ),
              negotiatedUnitPrice: parseOptionalNegotiatedCopUnitPrice(
                values.specificValues.negotiatedUnitPrice,
              ),
              belowMinimumConfirmed:
                values.specificValues.belowMinimumConfirmed,
            }),
          });
          break;
        }
        case "tabloid-pricing": {
          if (values.specificValues.pricingStrategy !== "tabloid-pricing") {
            throw new Error("Service state does not match its strategy.");
          }

          if (values.specificValues.tabloidType === "") {
            setResult(null);
            setError("Selecciona un tipo de tabloide.");
            return;
          }

          if (
            values.specificValues.tabloidType ===
              TABLOID_TYPE_IDS.adhesive &&
            values.specificValues.adhesiveFinish === ""
          ) {
            setResult(null);
            setError("Selecciona un acabado adhesivo.");
            return;
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation: calculateTabloidPrice({
              tabloidType: values.specificValues.tabloidType,
              adhesiveFinish: resolveSelectedTabloidAdhesiveFinish(
                values.specificValues,
              ),
              quantity: parsePositiveIntegerQuantity(
                values.specificValues.quantity,
              ),
              negotiatedBaseUnitPrice: parseOptionalNegotiatedCopUnitPrice(
                values.specificValues.negotiatedBaseUnitPrice,
              ),
              belowMinimumConfirmed:
                values.specificValues.belowMinimumConfirmed,
              isLaminated: values.specificValues.isLaminated,
            }),
          });
          break;
        }
        case "duration": {
          if (values.specificValues.pricingStrategy !== "duration") {
            throw new Error("Service state does not match its strategy.");
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation: calculateVideoEditingPrice(
              parseVideoDuration(values.specificValues.duration),
            ),
          });
          break;
        }
      }

      setError(null);
    } catch (caughtError: unknown) {
      setResult(null);
      setError(
        caughtError instanceof RangeError
          ? translateServiceError(caughtError)
          : "No fue posible calcular el precio. Inténtalo de nuevo.",
      );
    }
  }

  function handleReset() {
    setValues(createInitialServicesPricingFormState());
    clearFeedback();
  }

  return (
    <div className={formStyles.calculator}>
      <form
        className={formStyles.form}
        onSubmit={handleSubmit}
        onReset={handleReset}
        noValidate
      >
        <div className={formStyles.formHeading}>
          <div>
            <p className={formStyles.kicker}>Datos de entrada</p>
            <h3>Categoría, servicio y datos</h3>
          </div>
          <p className={formStyles.requiredNote}>
            Completa los campos obligatorios
          </p>
        </div>

        <div className={formStyles.fields}>
          <div className={`${formStyles.field} ${styles.wideField}`}>
            <label htmlFor={`${idPrefix}-category`}>Categoría</label>
            <select
              id={`${idPrefix}-category`}
              name="categoryId"
              value={values.categoryId}
              onChange={handleCategoryChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              {SERVICE_CATEGORY_CATALOG.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`${formStyles.field} ${styles.wideField}`}>
            <label htmlFor={`${idPrefix}-service`}>Servicio</label>
            <select
              id={`${idPrefix}-service`}
              name="serviceId"
              value={values.serviceId}
              onChange={handleServiceChange}
              disabled={selectedCategory === null}
              required
            >
              <option value="">Selecciona un servicio</option>
              {categoryServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory ? (
            <div className={styles.categoryCard} aria-live="polite">
              <span>Categoría seleccionada</span>
              <strong>{selectedCategory.name}</strong>
            </div>
          ) : null}

          {selectedService ? (
            <p className={styles.serviceDescription}>
              {selectedService.description}
            </p>
          ) : null}

          {selectedService?.pricingStrategy === "maintenance-selection" &&
          maintenanceValues !== null ? (
            <>
              <fieldset className={formStyles.structureOptions}>
                <legend>Opciones de mantenimiento</legend>
                {MAINTENANCE_OPTIONS.map((option) => (
                  <label key={option.id}>
                    <input
                      type="checkbox"
                      name="maintenanceOptions"
                      value={option.id}
                      checked={
                        option.id === MAINTENANCE_OPTION_IDS.physical
                          ? maintenanceValues.maintenance.physical
                          : maintenanceValues.maintenance.system
                      }
                      onChange={handleMaintenanceChange}
                    />
                    <span>{option.name}</span>
                  </label>
                ))}
              </fieldset>

              {maintenanceValues.maintenance.system ? (
                <div className={styles.inclusions}>
                  <strong>El mantenimiento de sistema incluye:</strong>
                  <ul>
                    {SYSTEM_MAINTENANCE_INCLUSIONS.map((inclusion) => (
                      <li key={inclusion}>{inclusion}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {selectedService?.pricingStrategy === "business-card-pricing" &&
          businessCardValues !== null ? (
            <>
              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-business-card-type`}>
                  Tipo de tarjeta
                </label>
                <select
                  id={`${idPrefix}-business-card-type`}
                  name="cardType"
                  value={businessCardValues.cardType}
                  onChange={handleBusinessCardTypeChange}
                  required
                >
                  <option value="">Selecciona un tipo de tarjeta</option>
                  {selectedService.cardTypes.map((cardType) => (
                    <option key={cardType.id} value={cardType.id}>
                      {cardType.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-business-card-quantity`}>
                  Cantidad en millares
                </label>
                <div
                  className={`${formStyles.inputShell} ${styles.quantityShell}`}
                >
                  <input
                    id={`${idPrefix}-business-card-quantity`}
                    name="quantityInThousands"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={businessCardValues.quantityInThousands}
                    onChange={handleBusinessCardQuantityChange}
                    placeholder="1"
                    required
                  />
                  <span aria-hidden="true">millares</span>
                </div>
              </div>

              <div className={`${formStyles.field} ${styles.wideField}`}>
                <label htmlFor={`${idPrefix}-business-card-negotiated-price`}>
                  Precio negociado por millar (opcional)
                </label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-business-card-negotiated-price`}
                    name="negotiatedUnitPrice"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={businessCardValues.negotiatedUnitPrice}
                    onChange={handleBusinessCardNegotiatedPriceChange}
                    placeholder="Sin precio negociado"
                  />
                  <span aria-hidden="true">COP</span>
                </div>
              </div>

              <p className={styles.businessCardNotice}>
                Ingresa la cantidad en millares completos. 1 millar equivale a
                1.000 tarjetas. El precio negociado reemplaza el precio
                automático por millar.
              </p>
            </>
          ) : null}

          {selectedService?.pricingStrategy === "tabloid-pricing" &&
          tabloidValues !== null ? (
            <>
              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-tabloid-type`}>
                  Tipo de tabloide
                </label>
                <select
                  id={`${idPrefix}-tabloid-type`}
                  name="tabloidType"
                  value={tabloidValues.tabloidType}
                  onChange={handleTabloidTypeChange}
                  required
                >
                  <option value="">Selecciona un tipo de tabloide</option>
                  {selectedService.tabloidTypes.map((tabloidType) => (
                    <option key={tabloidType.id} value={tabloidType.id}>
                      {tabloidType.name}
                    </option>
                  ))}
                </select>
              </div>

              {tabloidValues.tabloidType === TABLOID_TYPE_IDS.adhesive ? (
                <div className={formStyles.field}>
                  <label htmlFor={`${idPrefix}-tabloid-adhesive-finish`}>
                    Acabado adhesivo
                  </label>
                  <select
                    id={`${idPrefix}-tabloid-adhesive-finish`}
                    name="adhesiveFinish"
                    value={tabloidValues.adhesiveFinish}
                    onChange={handleTabloidAdhesiveFinishChange}
                    required
                  >
                    <option value="">Selecciona un acabado adhesivo</option>
                    {selectedService.adhesiveFinishes.map((finish) => (
                      <option key={finish.id} value={finish.id}>
                        {finish.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-tabloid-quantity`}>
                  Cantidad de unidades
                </label>
                <div
                  className={`${formStyles.inputShell} ${styles.quantityShell}`}
                >
                  <input
                    id={`${idPrefix}-tabloid-quantity`}
                    name="quantity"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={tabloidValues.quantity}
                    onChange={handleTabloidQuantityChange}
                    placeholder="1"
                    required
                  />
                  <span aria-hidden="true">unidades</span>
                </div>
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-tabloid-negotiated-price`}>
                  Precio base negociado por unidad (opcional)
                </label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-tabloid-negotiated-price`}
                    name="negotiatedBaseUnitPrice"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={tabloidValues.negotiatedBaseUnitPrice}
                    onChange={handleTabloidNegotiatedPriceChange}
                    placeholder="Sin precio negociado"
                  />
                  <span aria-hidden="true">COP</span>
                </div>
              </div>

              <fieldset className={formStyles.structureOptions}>
                <legend>Laminado</legend>
                <label>
                  <input
                    type="radio"
                    name={`${idPrefix}-tabloid-lamination`}
                    value="not-laminated"
                    checked={!tabloidValues.isLaminated}
                    onChange={handleTabloidLaminationChange}
                  />
                  <span>Sin laminado</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name={`${idPrefix}-tabloid-lamination`}
                    value="laminated"
                    checked={tabloidValues.isLaminated}
                    onChange={handleTabloidLaminationChange}
                  />
                  <span>Laminado</span>
                </label>
              </fieldset>

              <p className={styles.tabloidNotice}>
                La cantidad representa tabloides individuales. El precio
                negociado reemplaza únicamente el precio base; el laminado se
                suma después. El mínimo se compara únicamente con el precio
                base.
              </p>
            </>
          ) : null}

          {selectedService !== null &&
          selectedService.pricingStrategy !== "duration" &&
          selectedService.pricingStrategy !== "business-card-pricing" &&
          selectedService.pricingStrategy !== "tabloid-pricing" &&
          quantityValues !== null ? (
            <div className={`${formStyles.field} ${styles.wideField}`}>
              <label htmlFor={`${idPrefix}-service-quantity`}>
                Cantidad de {selectedService.unit.plural}
              </label>
              <div
                className={`${formStyles.inputShell} ${styles.quantityShell}`}
              >
                <input
                  id={`${idPrefix}-service-quantity`}
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={quantityValues.quantity}
                  onChange={handleQuantityChange}
                  placeholder="1"
                  required
                />
                <span aria-hidden="true">{selectedService.unit.plural}</span>
              </div>
            </div>
          ) : null}

          {selectedService?.id ===
            AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing &&
          durationValues !== null ? (
            <>
              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-video-minutes`}>Minutos</label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-video-minutes`}
                    name="minutes"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={durationValues.duration.minutes}
                    onChange={handleDurationChange}
                    placeholder="0"
                    required
                  />
                  <span aria-hidden="true">min</span>
                </div>
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-video-seconds`}>Segundos</label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-video-seconds`}
                    name="seconds"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    step="1"
                    value={durationValues.duration.seconds}
                    onChange={handleDurationChange}
                    placeholder="0"
                    required
                  />
                  <span aria-hidden="true">s</span>
                </div>
              </div>

              <p className={styles.durationNotice}>
                Cada minuto iniciado o fracción se cobra como un minuto
                completo. El cobro mínimo corresponde a un minuto.
              </p>
            </>
          ) : null}
        </div>

        {selectedService?.pricingStrategy === "business-card-pricing" &&
        businessCardValues !== null ? (
          <>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Equivalencia aproximada en tarjetas</span>
              <strong>
                {businessCardPreview
                  ? `${quantityFormatter.format(
                      businessCardPreview.equivalentCardQuantity,
                    )} tarjetas`
                  : "Ingresa una cantidad válida"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Nivel automático aplicado</span>
              <strong>
                {businessCardAutomaticTier?.name ??
                  "Selecciona tipo y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Precio automático por millar</span>
              <strong>
                {businessCardPreview?.automaticPricing
                  ? priceFormatter.format(
                      businessCardPreview.automaticPricing.automaticUnitPrice,
                    )
                  : "Selecciona tipo y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Mínimo autorizado aplicable</span>
              <strong>
                {businessCardPreview?.automaticPricing
                  ? priceFormatter.format(
                      businessCardPreview.automaticPricing
                        .applicableAuthorizedMinimum,
                    )
                  : "Selecciona tipo y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Precio unitario resuelto</span>
              <strong>
                {businessCardPricingDecision
                  ? priceFormatter.format(
                      businessCardPricingDecision.resolvedUnitPrice,
                    )
                  : businessCardPreview?.automaticPricing
                    ? "Ingresa un precio negociado válido"
                    : "Selecciona tipo y cantidad válidos"}
              </strong>
            </div>

            {businessCardPricingDecision?.requiresConfirmation ? (
              <div
                className={styles.minimumWarning}
                role="alert"
                aria-live="assertive"
              >
                <strong>
                  El precio negociado está por debajo del mínimo autorizado
                  aplicable.
                </strong>
                <p>
                  Confirma que conoces esta excepción antes de calcular. Mínimo
                  autorizado aplicable: {" "}
                  {priceFormatter.format(
                    businessCardPricingDecision.applicableAuthorizedMinimum,
                  )}
                  .
                </p>
                <label>
                  <input
                    type="checkbox"
                    name="belowMinimumConfirmed"
                    checked={businessCardValues.belowMinimumConfirmed}
                    onChange={handleBusinessCardConfirmationChange}
                  />
                  <span>
                    Confirmo que conozco que este precio está por debajo del
                    mínimo autorizado.
                  </span>
                </label>
              </div>
            ) : null}
          </>
        ) : null}

        {selectedService?.pricingStrategy === "tabloid-pricing" &&
        tabloidValues !== null ? (
          <>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Nivel automático aplicado</span>
              <strong>
                {tabloidAutomaticTier?.name ??
                  "Selecciona tipo, acabado y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Precio base automático por unidad</span>
              <strong>
                {tabloidPreview?.automaticPricing
                  ? priceFormatter.format(
                      tabloidPreview.automaticPricing.automaticBaseUnitPrice,
                    )
                  : "Selecciona tipo, acabado y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Mínimo autorizado aplicable</span>
              <strong>
                {tabloidPreview?.automaticPricing
                  ? priceFormatter.format(
                      tabloidPreview.automaticPricing
                        .applicableAuthorizedMinimum,
                    )
                  : "Selecciona tipo, acabado y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Origen del precio base</span>
              <strong>
                {tabloidPricingDecision
                  ? TABLOID_BASE_PRICE_SOURCE_LABELS[
                      tabloidPricingDecision.basePriceSource
                    ]
                  : tabloidPreview?.automaticPricing
                    ? "Ingresa un precio negociado válido"
                    : "Selecciona tipo, acabado y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Precio base unitario resuelto</span>
              <strong>
                {tabloidPricingDecision
                  ? priceFormatter.format(
                      tabloidPricingDecision.resolvedBaseUnitPrice,
                    )
                  : tabloidPreview?.automaticPricing
                    ? "Ingresa un precio negociado válido"
                    : "Selecciona tipo, acabado y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Precio de laminado por unidad</span>
              <strong>
                {tabloidPricingDecision
                  ? priceFormatter.format(
                      tabloidPricingDecision.laminationUnitPrice,
                    )
                  : "Selecciona tipo, acabado y cantidad válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Precio unitario final</span>
              <strong>
                {tabloidPricingDecision
                  ? priceFormatter.format(
                      tabloidPricingDecision.resolvedFinalUnitPrice,
                    )
                  : "Selecciona tipo, acabado y cantidad válidos"}
              </strong>
            </div>

            {tabloidPricingDecision?.requiresConfirmation ? (
              <div
                className={styles.minimumWarning}
                role="alert"
                aria-live="assertive"
              >
                <strong>
                  El precio base negociado está por debajo del mínimo
                  autorizado aplicable.
                </strong>
                <p>
                  Confirma que conoces esta excepción antes de calcular. Mínimo
                  autorizado aplicable: {" "}
                  {priceFormatter.format(
                    tabloidPricingDecision.applicableAuthorizedMinimum,
                  )}
                  .
                </p>
                <label>
                  <input
                    type="checkbox"
                    name="tabloidBelowMinimumConfirmed"
                    checked={tabloidValues.belowMinimumConfirmed}
                    onChange={handleTabloidConfirmationChange}
                  />
                  <span>
                    Confirmo que conozco que este precio base está por debajo
                    del mínimo autorizado.
                  </span>
                </label>
              </div>
            ) : null}

            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Subtotal base</span>
              <strong>
                {tabloidCalculation
                  ? priceFormatter.format(tabloidCalculation.baseSubtotal)
                  : tabloidPricingDecision?.requiresConfirmation
                    ? "Confirma la excepción para calcular"
                    : "Completa datos válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Subtotal de laminado</span>
              <strong>
                {tabloidCalculation
                  ? priceFormatter.format(
                      tabloidCalculation.laminationSubtotal,
                    )
                  : tabloidPricingDecision?.requiresConfirmation
                    ? "Confirma la excepción para calcular"
                    : "Completa datos válidos"}
              </strong>
            </div>
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Total final</span>
              <strong>
                {tabloidCalculation
                  ? priceFormatter.format(tabloidCalculation.totalPrice)
                  : tabloidPricingDecision?.requiresConfirmation
                    ? "Confirma la excepción para calcular"
                    : "Completa datos válidos"}
              </strong>
            </div>
          </>
        ) : null}

        {selectedService?.pricingStrategy === "duration" ? (
          <>
            <div className={formStyles.rateSummary}>
              <span>Precio del primer minuto</span>
              <strong>
                {priceFormatter.format(VIDEO_EDITING_PRICING.basePrice)}
              </strong>
            </div>
            <div className={formStyles.rateSummary}>
              <span>Precio por minuto adicional iniciado</span>
              <strong>
                {priceFormatter.format(
                  VIDEO_EDITING_PRICING.additionalMinutePrice,
                )}
              </strong>
            </div>
          </>
        ) : selectedService?.pricingStrategy !== "business-card-pricing" &&
          selectedService?.pricingStrategy !== "tabloid-pricing" &&
          selectedService ? (
          <div className={formStyles.rateSummary} aria-live="polite">
            <span>Precio unitario resuelto</span>
            <strong>
              {resolvedUnitPrice === null
                ? selectedService.pricingStrategy === "maintenance-selection"
                  ? "Selecciona el mantenimiento"
                  : "Ingresa una cantidad válida"
                : priceFormatter.format(resolvedUnitPrice)}
            </strong>
          </div>
        ) : null}

        {selectedService?.pricingStrategy === "quantity-tier" ? (
          <div className={formStyles.rateSummary} aria-live="polite">
            <span>Nivel de precio aplicado</span>
            <strong>{resolvedTierName ?? "Ingresa una cantidad válida"}</strong>
          </div>
        ) : null}

        {selectedService ? (
          selectedService.pricingStrategy === "duration" ||
          selectedService.pricingStrategy === "business-card-pricing" ||
          selectedService.pricingStrategy === "tabloid-pricing" ? null : (
            <p className={formStyles.fieldHelp}>
              La cantidad debe ser un número entero mayor que cero.
            </p>
          )
        ) : null}

        <div className={formStyles.actions}>
          <button className={formStyles.primaryButton} type="submit">
            Calcular precio
          </button>
          <button className={formStyles.secondaryButton} type="reset">
            Limpiar
          </button>
        </div>

        <div
          className={formStyles.errorRegion}
          aria-live="assertive"
          aria-atomic="true"
        >
          {error ? (
            <p className={formStyles.error} role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          ) : null}
        </div>
      </form>

      <section
        className={formStyles.results}
        aria-label="Resultado del servicio"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={formStyles.resultHeading}>
          <p className={formStyles.kicker}>Resultado</p>
          <h3>Resumen comercial</h3>
        </div>

        {result ? (
          <dl className={formStyles.priceList}>
            <div className={formStyles.priceItem}>
              <dt>Categoría</dt>
              <dd className={styles.textValue}>{result.category.name}</dd>
            </div>
            <div className={formStyles.priceItem}>
              <dt>Servicio</dt>
              <dd className={styles.textValue}>{result.service.name}</dd>
            </div>

            {result.pricingStrategy === "duration" ? (
              <>
                <div className={formStyles.priceItem}>
                  <dt>Duración real</dt>
                  <dd className={styles.textValue}>
                    <data value={result.calculation.totalSeconds}>
                      {result.calculation.enteredMinutes} min{" "}
                      {result.calculation.enteredSeconds} s
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Minutos cobrables</dt>
                  <dd>{result.calculation.billableMinutes}</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio del primer minuto</dt>
                  <dd>
                    <data value={result.calculation.basePrice}>
                      {priceFormatter.format(result.calculation.basePrice)}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Minutos adicionales cobrables</dt>
                  <dd>{result.calculation.additionalBillableMinutes}</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Subtotal adicional</dt>
                  <dd>
                    <data value={result.calculation.additionalSubtotal}>
                      {priceFormatter.format(
                        result.calculation.additionalSubtotal,
                      )}
                    </data>
                  </dd>
                </div>
              </>
            ) : result.pricingStrategy === "business-card-pricing" ? (
              <>
                <div className={formStyles.priceItem}>
                  <dt>Tipo de tarjeta</dt>
                  <dd className={styles.textValue}>
                    {
                      getBusinessCardTypeDefinition(
                        result.calculation.cardType,
                      ).name
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Cantidad de millares</dt>
                  <dd>{result.calculation.quantityInThousands}</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Cantidad equivalente de tarjetas</dt>
                  <dd>
                    <data value={result.calculation.equivalentCardQuantity}>
                      {quantityFormatter.format(
                        result.calculation.equivalentCardQuantity,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Nivel aplicado</dt>
                  <dd className={styles.textValue}>
                    {
                      getBusinessCardAutomaticTier(
                        result.calculation.cardType,
                        result.calculation.automaticTierId,
                      ).name
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio automático por millar</dt>
                  <dd>
                    <data value={result.calculation.automaticUnitPrice}>
                      {priceFormatter.format(
                        result.calculation.automaticUnitPrice,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Origen del precio</dt>
                  <dd className={styles.textValue}>
                    {
                      BUSINESS_CARD_PRICE_SOURCE_LABELS[
                        result.calculation.priceSource
                      ]
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio unitario resuelto</dt>
                  <dd>
                    <data value={result.calculation.resolvedUnitPrice}>
                      {priceFormatter.format(
                        result.calculation.resolvedUnitPrice,
                      )}
                    </data>
                  </dd>
                  <dd className={formStyles.priceItemNote}>Por millar</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Mínimo autorizado aplicable</dt>
                  <dd>
                    <data
                      value={
                        result.calculation.applicableAuthorizedMinimum
                      }
                    >
                      {priceFormatter.format(
                        result.calculation.applicableAuthorizedMinimum,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Estado del mínimo</dt>
                  <dd
                    className={`${styles.textValue} ${
                      result.calculation.isBelowAuthorizedMinimum
                        ? styles.belowMinimumText
                        : ""
                    }`}
                  >
                    {result.calculation.isBelowAuthorizedMinimum
                      ? BUSINESS_CARD_MINIMUM_STATUS_LABELS.belowMinimum
                      : BUSINESS_CARD_MINIMUM_STATUS_LABELS.withinRange}
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Confirmación</dt>
                  <dd className={styles.textValue}>
                    {
                      BUSINESS_CARD_CONFIRMATION_STATUS_LABELS[
                        result.calculation.confirmationStatus
                      ]
                    }
                  </dd>
                </div>
              </>
            ) : result.pricingStrategy === "tabloid-pricing" ? (
              <>
                <div className={formStyles.priceItem}>
                  <dt>Tipo de tabloide</dt>
                  <dd className={styles.textValue}>
                    {
                      getTabloidTypeDefinition(
                        result.calculation.tabloidType,
                      ).name
                    }
                  </dd>
                </div>
                {result.calculation.adhesiveFinish !== null ? (
                  <div className={formStyles.priceItem}>
                    <dt>Acabado adhesivo</dt>
                    <dd className={styles.textValue}>
                      {
                        getTabloidAdhesiveFinishDefinition(
                          result.calculation.adhesiveFinish,
                        ).name
                      }
                    </dd>
                  </div>
                ) : null}
                <div className={formStyles.priceItem}>
                  <dt>Cantidad</dt>
                  <dd>{result.calculation.quantity}</dd>
                  <dd className={formStyles.priceItemNote}>
                    Unidades individuales
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Nivel aplicado</dt>
                  <dd className={styles.textValue}>
                    {
                      getTabloidAutomaticTier(
                        result.calculation.automaticTierId,
                      ).name
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio base automático por unidad</dt>
                  <dd>
                    <data value={result.calculation.automaticBaseUnitPrice}>
                      {priceFormatter.format(
                        result.calculation.automaticBaseUnitPrice,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Origen del precio base</dt>
                  <dd className={styles.textValue}>
                    {
                      TABLOID_BASE_PRICE_SOURCE_LABELS[
                        result.calculation.basePriceSource
                      ]
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio base negociado por unidad</dt>
                  {result.calculation.negotiatedBaseUnitPrice === null ? (
                    <dd className={styles.textValue}>No se utilizó</dd>
                  ) : (
                    <dd>
                      <data
                        value={result.calculation.negotiatedBaseUnitPrice}
                      >
                        {priceFormatter.format(
                          result.calculation.negotiatedBaseUnitPrice,
                        )}
                      </data>
                    </dd>
                  )}
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio base unitario resuelto</dt>
                  <dd>
                    <data value={result.calculation.resolvedBaseUnitPrice}>
                      {priceFormatter.format(
                        result.calculation.resolvedBaseUnitPrice,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Mínimo autorizado aplicable</dt>
                  <dd>
                    <data
                      value={
                        result.calculation.applicableAuthorizedMinimum
                      }
                    >
                      {priceFormatter.format(
                        result.calculation.applicableAuthorizedMinimum,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Estado del mínimo</dt>
                  <dd
                    className={`${styles.textValue} ${
                      result.calculation.isBelowAuthorizedMinimum
                        ? styles.belowMinimumText
                        : ""
                    }`}
                  >
                    {result.calculation.isBelowAuthorizedMinimum
                      ? TABLOID_MINIMUM_STATUS_LABELS.belowMinimum
                      : TABLOID_MINIMUM_STATUS_LABELS.withinRange}
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Confirmación</dt>
                  <dd className={styles.textValue}>
                    {
                      TABLOID_CONFIRMATION_STATUS_LABELS[
                        result.calculation.confirmationStatus
                      ]
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Laminado</dt>
                  <dd className={styles.textValue}>
                    {result.calculation.isLaminated ? "Sí" : "No"}
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio de laminado por unidad</dt>
                  <dd>
                    <data value={result.calculation.laminationUnitPrice}>
                      {priceFormatter.format(
                        result.calculation.laminationUnitPrice,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio unitario final</dt>
                  <dd>
                    <data value={result.calculation.resolvedFinalUnitPrice}>
                      {priceFormatter.format(
                        result.calculation.resolvedFinalUnitPrice,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Subtotal base</dt>
                  <dd>
                    <data value={result.calculation.baseSubtotal}>
                      {priceFormatter.format(
                        result.calculation.baseSubtotal,
                      )}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Subtotal de laminado</dt>
                  <dd>
                    <data value={result.calculation.laminationSubtotal}>
                      {priceFormatter.format(
                        result.calculation.laminationSubtotal,
                      )}
                    </data>
                  </dd>
                </div>
              </>
            ) : (
              <>
                {result.pricingStrategy === "maintenance-selection" ? (
                  <>
                    <div className={formStyles.priceItem}>
                      <dt>Opciones seleccionadas</dt>
                      <dd className={styles.textValue}>
                        {result.calculation.selectedOptionIds
                          .map(
                            (optionId) =>
                              MAINTENANCE_OPTIONS.find(
                                (option) => option.id === optionId,
                              )!.name,
                          )
                          .join(" y ")}
                      </dd>
                    </div>
                    {result.calculation.selectedOptionIds.includes(
                      MAINTENANCE_OPTION_IDS.system,
                    ) ? (
                      <div className={formStyles.priceItem}>
                        <dt>Inclusiones del mantenimiento de sistema</dt>
                        <dd className={styles.textValue}>
                          <ul className={styles.summaryList}>
                            {SYSTEM_MAINTENANCE_INCLUSIONS.map((inclusion) => (
                              <li key={inclusion}>{inclusion}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}
                    {result.calculation.packageName ? (
                      <div className={formStyles.priceItem}>
                        <dt>Paquete aplicado</dt>
                        <dd className={styles.textValue}>
                          {result.calculation.packageName}
                        </dd>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {result.pricingStrategy === "quantity-tier" ? (
                  <>
                    <div className={formStyles.priceItem}>
                      <dt>Alcance</dt>
                      <dd className={styles.textValue}>
                        {result.service.computerScope.name}
                      </dd>
                    </div>
                    <div className={formStyles.priceItem}>
                      <dt>Cantidad de programas</dt>
                      <dd>{result.calculation.programCount}</dd>
                    </div>
                    <div className={formStyles.priceItem}>
                      <dt>Nivel aplicado</dt>
                      <dd className={styles.textValue}>
                        {
                          getSoftwareInstallationPricingTier(
                            result.calculation.tierId,
                          ).name
                        }
                      </dd>
                    </div>
                    <div className={formStyles.priceItem}>
                      <dt>Precio unitario por programa</dt>
                      <dd>
                        <data value={result.calculation.unitPrice}>
                          {priceFormatter.format(result.calculation.unitPrice)}
                        </data>
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={formStyles.priceItem}>
                      <dt>Cantidad</dt>
                      <dd>{result.calculation.quantity}</dd>
                      <dd className={formStyles.priceItemNote}>
                        Unidad: {result.service.unit.singular}
                      </dd>
                    </div>
                    <div className={formStyles.priceItem}>
                      <dt>Precio unitario</dt>
                      <dd>
                        <data value={result.calculation.unitPrice}>
                          {priceFormatter.format(result.calculation.unitPrice)}
                        </data>
                      </dd>
                      <dd className={formStyles.priceItemNote}>
                        Por {result.service.unit.singular}
                      </dd>
                    </div>
                  </>
                )}
              </>
            )}

            <div className={formStyles.priceItemFeatured}>
              <dt>
                {result.pricingStrategy === "duration" ||
                result.pricingStrategy === "business-card-pricing" ||
                result.pricingStrategy === "tabloid-pricing"
                  ? "Total final"
                  : "Precio total"}
              </dt>
              <dd>
                <data value={result.calculation.totalPrice}>
                  {priceFormatter.format(result.calculation.totalPrice)}
                </data>
              </dd>
              <dd className={formStyles.priceItemNote}>
                Precio final exacto, sin redondeo comercial
              </dd>
            </div>
          </dl>
        ) : (
          <div className={formStyles.emptyResult}>
            <span aria-hidden="true">COP</span>
            <p>Selecciona un servicio y calcula para ver el resumen comercial.</p>
          </div>
        )}
      </section>
    </div>
  );
}
