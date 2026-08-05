import {
  getBusinessCardAutomaticTier,
  getBusinessCardTypeDefinition,
} from "./business-card-pricing";
import type { BusinessCardPriceCalculation } from "./calculate-business-card-price";
import type { FixedPriceCalculation } from "./calculate-fixed-price-service";
import type { SoftwareInstallationPriceCalculation } from "./calculate-software-installation-price";
import { getSoftwareInstallationPricingTier } from "./calculate-software-installation-price";
import type { TabloidPriceCalculation } from "./calculate-tabloid-price";
import type { VideoEditingPriceCalculation } from "./calculate-video-editing-price";
import {
  MAINTENANCE_OPTIONS,
  type FixedPriceComputerService,
  type MaintenanceComputerService,
  type QuantityTierComputerService,
} from "./computer-service-catalog";
import type {
  BusinessCardService,
  TabloidService,
} from "./printed-service-catalog";
import type { MaintenancePriceCalculation } from "./resolve-maintenance-price";
import type {
  ServiceCategory,
  VideoEditingService,
} from "./service-catalog";
import {
  getTabloidAdhesiveFinishDefinition,
  getTabloidAutomaticTier,
  getTabloidTypeDefinition,
} from "./tabloid-pricing";
import type {
  QuotationLineDetail,
  QuotationLineDraft,
} from "./temporary-quotation";

type ResultBase = Readonly<{
  category: ServiceCategory;
}>;

export type MaintenanceServiceCalculationResult = ResultBase &
  Readonly<{
    pricingStrategy: "maintenance-selection";
    service: MaintenanceComputerService;
    calculation: MaintenancePriceCalculation;
  }>;

export type FixedPriceServiceCalculationResult = ResultBase &
  Readonly<{
    pricingStrategy: "fixed-price";
    service: FixedPriceComputerService;
    calculation: FixedPriceCalculation;
  }>;

export type QuantityTierServiceCalculationResult = ResultBase &
  Readonly<{
    pricingStrategy: "quantity-tier";
    service: QuantityTierComputerService;
    calculation: SoftwareInstallationPriceCalculation;
  }>;

export type DurationServiceCalculationResult = ResultBase &
  Readonly<{
    pricingStrategy: "duration";
    service: VideoEditingService;
    calculation: VideoEditingPriceCalculation;
  }>;

export type BusinessCardServiceCalculationResult = ResultBase &
  Readonly<{
    pricingStrategy: "business-card-pricing";
    service: BusinessCardService;
    calculation: BusinessCardPriceCalculation;
  }>;

export type TabloidServiceCalculationResult = ResultBase &
  Readonly<{
    pricingStrategy: "tabloid-pricing";
    service: TabloidService;
    calculation: TabloidPriceCalculation;
  }>;

export type ServiceCalculationResult =
  | MaintenanceServiceCalculationResult
  | FixedPriceServiceCalculationResult
  | QuantityTierServiceCalculationResult
  | DurationServiceCalculationResult
  | BusinessCardServiceCalculationResult
  | TabloidServiceCalculationResult;

function resolveNegotiatedPriceLabel(
  priceSource: "automatic" | "negotiated",
  isBelowAuthorizedMinimum: boolean,
): "Precio automático" | "Precio negociado" | "Precio negociado autorizado" {
  if (priceSource === "automatic") {
    return "Precio automático";
  }

  return isBelowAuthorizedMinimum
    ? "Precio negociado autorizado"
    : "Precio negociado";
}

function createBaseDetails(
  result: ServiceCalculationResult,
): QuotationLineDetail[] {
  return [
    { label: "Categoría", value: result.category.name },
    { label: "Servicio", value: result.service.name },
  ];
}

export function createServiceQuotationLineDraft(
  result: ServiceCalculationResult,
): QuotationLineDraft {
  const details = createBaseDetails(result);
  let quantity: number;

  switch (result.pricingStrategy) {
    case "maintenance-selection": {
      quantity = result.calculation.quantity;
      details.push({
        label: "Opción seleccionada",
        value: result.calculation.selectedOptionIds
          .map(
            (optionId) =>
              MAINTENANCE_OPTIONS.find((option) => option.id === optionId)!
                .name,
          )
          .join(" y "),
      });

      if (result.calculation.packageName) {
        details.push({
          label: "Paquete",
          value: result.calculation.packageName,
        });
      }
      break;
    }
    case "fixed-price":
      quantity = result.calculation.quantity;
      details.push({
        label: "Unidad",
        value: result.service.unit.singular,
      });
      break;
    case "quantity-tier":
      quantity = result.calculation.programCount;
      details.push(
        {
          label: "Cantidad de programas",
          value: String(result.calculation.programCount),
        },
        {
          label: "Nivel comercial",
          value: getSoftwareInstallationPricingTier(
            result.calculation.tierId,
          ).name,
        },
        { label: "Alcance", value: result.service.computerScope.name },
      );
      break;
    case "duration":
      quantity = 1;
      details.push(
        {
          label: "Duración ingresada",
          value: `${result.calculation.enteredMinutes}:${String(
            result.calculation.enteredSeconds,
          ).padStart(2, "0")}`,
        },
        {
          label: "Minutos facturables",
          value: String(result.calculation.billableMinutes),
        },
      );
      break;
    case "business-card-pricing":
      quantity = result.calculation.quantityInThousands;
      details.push(
        {
          label: "Tipo",
          value: getBusinessCardTypeDefinition(result.calculation.cardType)
            .name,
        },
        {
          label: "Cantidad en millares",
          value: String(result.calculation.quantityInThousands),
        },
        {
          label: "Nivel comercial",
          value: getBusinessCardAutomaticTier(
            result.calculation.cardType,
            result.calculation.automaticTierId,
          ).name,
        },
        {
          label: "Modalidad de precio",
          value: resolveNegotiatedPriceLabel(
            result.calculation.priceSource,
            result.calculation.isBelowAuthorizedMinimum,
          ),
        },
      );
      break;
    case "tabloid-pricing":
      quantity = result.calculation.quantity;
      details.push({
        label: "Tipo",
        value: getTabloidTypeDefinition(result.calculation.tabloidType).name,
      });

      if (result.calculation.adhesiveFinish !== null) {
        details.push({
          label: "Acabado adhesivo",
          value: getTabloidAdhesiveFinishDefinition(
            result.calculation.adhesiveFinish,
          ).name,
        });
      }

      details.push(
        {
          label: "Nivel comercial",
          value: getTabloidAutomaticTier(
            result.calculation.automaticTierId,
          ).name,
        },
        {
          label: "Laminado",
          value: result.calculation.isLaminated ? "Sí" : "No",
        },
        {
          label: "Modalidad de precio",
          value: resolveNegotiatedPriceLabel(
            result.calculation.basePriceSource,
            result.calculation.isBelowAuthorizedMinimum,
          ),
        },
      );
      break;
  }

  return {
    source: "service",
    title: result.service.name,
    quantity,
    details,
    lineTotal: result.calculation.totalPrice,
  };
}
