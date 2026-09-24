import {
  formatQuotationPhoneDisplay,
  type QuotationLineDetail,
  type TemporaryQuotationState,
} from "@/lib/pricing/temporary-quotation";

import type { BusinessProfile } from "./business-profile";
import {
  formatQuotationCalendarDate,
  formatQuotationValidity,
} from "./quotation-metadata";

export type QuotationPreviewField = Readonly<{
  label: string;
  value: string;
}>;

export type QuotationPreviewLine = Readonly<{
  title: string;
  details: readonly QuotationPreviewField[];
  quantity: number;
  unitPriceCop?: number;
  formattedUnitPrice?: string;
  lineTotal: number;
  formattedLineTotal: string;
}>;

export type QuotationPreviewViewModel = Readonly<{
  businessName: string;
  logoOnDarkPath: string | null;
  logoOnLightPath: string | null;
  quotationFields: readonly QuotationPreviewField[];
  businessFields: readonly QuotationPreviewField[];
  customerFields: readonly QuotationPreviewField[];
  lines: readonly QuotationPreviewLine[];
  total: number;
  formattedTotal: string;
  notes: string | null;
}>;

type CreateQuotationPreviewViewModelInput = Readonly<{
  quotation: TemporaryQuotationState;
  total: number;
  businessProfile: BusinessProfile;
}>;

const quotationCopFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const CUSTOMER_SAFE_LINE_DETAIL_LABELS = new Set([
  "Producto",
  "Servicio",
  "Categoría",
  "Descripción",
  "Configuración",
  "Variante",
  "Color",
  "Dimensiones",
  "Área por unidad",
  "Estructura",
  "Opción de Panaflex",
  "Clasificación de medida",
  "Opción seleccionada",
  "Paquete",
  "Unidad",
  "Cantidad de programas",
  "Alcance",
  "Duración ingresada",
  "Minutos facturables",
  "Tipo",
  "Cantidad en millares",
  "Acabado adhesivo",
  "Laminado",
  "Material",
  "Gramos por unidad",
  "Tiempo de impresión por unidad",
  "Modelado",
  "Tipo de impresión",
  "Impresora",
  "Tamaño aproximado",
  "Producción",
  "Condición",
  "Sistema",
  "Presentación",
  "Cámaras",
  "Instalación",
  "Grabador",
  "Disco duro",
  "Configuración DVR/NVR",
  "Switch PoE",
  "Fuente centralizada",
  "Accesorio adicional",
  "Cableado",
]);

function hasUsefulText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function freezeField(label: string, value: string): QuotationPreviewField {
  return Object.freeze({ label, value });
}

function createBusinessFields(
  profile: BusinessProfile,
): readonly QuotationPreviewField[] {
  const configuredFields = [
    ["Razón social", profile.legalName],
    ["Documento o NIT", profile.document],
    ["Teléfono", profile.phone],
    ["Correo electrónico", profile.email],
    ["Dirección", profile.address],
    ["Ciudad", profile.city],
  ] as const;

  return Object.freeze(
    configuredFields.flatMap(([label, value]) =>
      hasUsefulText(value) ? [freezeField(label, value)] : [],
    ),
  );
}

function createQuotationFields(
  quotation: TemporaryQuotationState,
): readonly QuotationPreviewField[] {
  if (quotation.quotationDate === null) {
    return Object.freeze([]);
  }

  return Object.freeze([
    freezeField(
      "Fecha",
      formatQuotationCalendarDate(quotation.quotationDate),
    ),
    freezeField("Vigencia", formatQuotationValidity()),
  ]);
}

function createCustomerFields(
  quotation: TemporaryQuotationState,
): readonly QuotationPreviewField[] {
  const { details } = quotation;
  const phone = formatQuotationPhoneDisplay(details);
  const fields = [
    ["Nombre o empresa", details.customerName],
    ["Documento o NIT", details.customerDocument],
    ["Teléfono", phone],
    ["Correo electrónico", details.customerEmail],
    ["Ciudad", details.customerCity],
  ] as const;

  return Object.freeze(
    fields.flatMap(([label, value]) =>
      hasUsefulText(value) ? [freezeField(label, value)] : [],
    ),
  );
}

function isCustomerSafeLineDetail(detail: QuotationLineDetail): boolean {
  return (
    CUSTOMER_SAFE_LINE_DETAIL_LABELS.has(detail.label) &&
    hasUsefulText(detail.value)
  );
}

export function formatQuotationCop(value: number): string {
  return quotationCopFormatter.format(value);
}

export function createQuotationPreviewViewModel({
  quotation,
  total,
  businessProfile,
}: CreateQuotationPreviewViewModelInput): QuotationPreviewViewModel {
  const lines = quotation.lines.map((line) =>
    Object.freeze({
      title: line.title,
      details: Object.freeze(
        line.details
          .filter(isCustomerSafeLineDetail)
          .map((detail) => freezeField(detail.label, detail.value)),
      ),
      quantity: line.quantity,
      ...(line.source === "custom"
        ? {
            unitPriceCop: line.unitPriceCop,
            formattedUnitPrice: formatQuotationCop(line.unitPriceCop),
          }
        : {}),
      lineTotal: line.lineTotal,
      formattedLineTotal: formatQuotationCop(line.lineTotal),
    }),
  );

  return Object.freeze({
    businessName: businessProfile.businessName,
    logoOnDarkPath: hasUsefulText(businessProfile.logoOnDarkPath)
      ? businessProfile.logoOnDarkPath
      : null,
    logoOnLightPath: hasUsefulText(businessProfile.logoOnLightPath)
      ? businessProfile.logoOnLightPath
      : null,
    quotationFields: createQuotationFields(quotation),
    businessFields: createBusinessFields(businessProfile),
    customerFields: createCustomerFields(quotation),
    lines: Object.freeze(lines),
    total,
    formattedTotal: formatQuotationCop(total),
    notes: hasUsefulText(quotation.details.notes)
      ? quotation.details.notes
      : null,
  });
}
