import { BUSINESS_CARD_TYPES } from "./business-card-pricing";
import {
  TABLOID_ADHESIVE_FINISHES,
  TABLOID_TYPES,
} from "./tabloid-pricing";

export const PRINTED_SERVICE_CATEGORY = {
  id: "printed-products",
  name: "Impresos",
} as const;

export const PRINTED_SERVICE_IDS = {
  businessCards: "business-cards",
  tabloids: "tabloids",
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

export type TabloidService = Readonly<{
  id: typeof PRINTED_SERVICE_IDS.tabloids;
  name: "Tabloides";
  description: string;
  pricingStrategy: "tabloid-pricing";
  tabloidTypes: typeof TABLOID_TYPES;
  adhesiveFinishes: typeof TABLOID_ADHESIVE_FINISHES;
}>;

export type PrintedService = BusinessCardService | TabloidService;

export const BUSINESS_CARD_SERVICE: BusinessCardService = {
  id: PRINTED_SERVICE_IDS.businessCards,
  name: "Tarjetas de presentación",
  description:
    "Cotiza millares completos de tarjetas con precio automático o precio negociado por millar.",
  pricingStrategy: "business-card-pricing",
  cardTypes: BUSINESS_CARD_TYPES,
};

export const TABLOID_SERVICE: TabloidService = {
  id: PRINTED_SERVICE_IDS.tabloids,
  name: "Tabloides",
  description:
    "Cotiza tabloides individuales con precio base automático o negociado y laminado opcional.",
  pricingStrategy: "tabloid-pricing",
  tabloidTypes: TABLOID_TYPES,
  adhesiveFinishes: TABLOID_ADHESIVE_FINISHES,
};

export const PRINTED_SERVICE_CATALOG: readonly PrintedService[] = [
  BUSINESS_CARD_SERVICE,
  TABLOID_SERVICE,
];
