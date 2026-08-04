import { BUSINESS_CARD_TYPES } from "./business-card-pricing";

export const PRINTED_SERVICE_CATEGORY = {
  id: "printed-products",
  name: "Impresos",
} as const;

export const PRINTED_SERVICE_IDS = {
  businessCards: "business-cards",
} as const;

export type PrintedServiceId =
  (typeof PRINTED_SERVICE_IDS)[keyof typeof PRINTED_SERVICE_IDS];

export type BusinessCardService = Readonly<{
  id: typeof PRINTED_SERVICE_IDS.businessCards;
  name: "Tarjetas de presentación";
  description: string;
  pricingStrategy: "business-card-pricing";
  cardTypes: typeof BUSINESS_CARD_TYPES;
}>;

export type PrintedService = BusinessCardService;

export const BUSINESS_CARD_SERVICE: BusinessCardService = {
  id: PRINTED_SERVICE_IDS.businessCards,
  name: "Tarjetas de presentación",
  description:
    "Cotiza millares completos de tarjetas con precio automático o precio negociado por millar.",
  pricingStrategy: "business-card-pricing",
  cardTypes: BUSINESS_CARD_TYPES,
};

export const PRINTED_SERVICE_CATALOG: readonly PrintedService[] = [
  BUSINESS_CARD_SERVICE,
];
