import type { PanaflexMeasureClassification } from "./calculate-illuminated-panaflex-sign-price";
import { PANAFLEX_MEASURE_CLASSIFICATIONS } from "./calculate-illuminated-panaflex-sign-price";
import type { QuotationLineDraft } from "./temporary-quotation";

export type AreaProductQuotationLineInput = Readonly<{
  productName: string;
  variantName: string | null;
  lengthCm: number;
  widthCm: number;
  areaM2: number;
  quantity: number;
  customerFacingRatePerM2: number | null;
  usesCustomRate: boolean;
  bannerStructureName: string | null;
  panaflexPricingOptionName: string | null;
  panaflexMeasureClassification: PanaflexMeasureClassification | null;
  panaflexStructureRatePerCm2: number | null;
  finalPrice: number;
}>;

const numberFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MEASURE_CLASSIFICATION_LABELS: Readonly<
  Record<PanaflexMeasureClassification, string>
> = {
  [PANAFLEX_MEASURE_CLASSIFICATIONS.small]: "Medida pequeña",
  [PANAFLEX_MEASURE_CLASSIFICATIONS.standard]: "Medida estándar",
};

export function createAreaProductQuotationLineDraft(
  input: AreaProductQuotationLineInput,
): QuotationLineDraft {
  const details = [
    { label: "Producto", value: input.productName },
    ...(input.variantName
      ? [{ label: "Variante", value: input.variantName }]
      : []),
    {
      label: "Dimensiones",
      value: `${numberFormatter.format(input.lengthCm)} × ${numberFormatter.format(input.widthCm)} cm`,
    },
    {
      label: "Área por unidad",
      value: `${numberFormatter.format(input.areaM2)} m²`,
    },
    ...(input.customerFacingRatePerM2 === null
      ? []
      : [
          {
            label: "Tarifa visible",
            value: `${priceFormatter.format(input.customerFacingRatePerM2)}/m²`,
          },
        ]),
    ...(input.usesCustomRate
      ? [{ label: "Modalidad de tarifa", value: "Tarifa personalizada" }]
      : []),
    ...(input.bannerStructureName
      ? [{ label: "Estructura", value: input.bannerStructureName }]
      : []),
    ...(input.panaflexPricingOptionName
      ? [
          {
            label: "Opción de Panaflex",
            value: input.panaflexPricingOptionName,
          },
        ]
      : []),
    ...(input.panaflexMeasureClassification
      ? [
          {
            label: "Clasificación de medida",
            value:
              MEASURE_CLASSIFICATION_LABELS[
                input.panaflexMeasureClassification
              ],
          },
        ]
      : []),
    ...(input.panaflexStructureRatePerCm2 === null
      ? []
      : [
          {
            label: "Tarifa de estructura",
            value: `${priceFormatter.format(input.panaflexStructureRatePerCm2)}/cm²`,
          },
        ]),
  ] as const;

  return {
    source: "area-product",
    title: input.productName,
    quantity: input.quantity,
    details,
    lineTotal: input.finalPrice,
  };
}
