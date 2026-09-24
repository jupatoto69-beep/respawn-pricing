import {
  formatQuotationPhoneDisplay,
  type TemporaryQuotationState,
} from "@/lib/pricing/temporary-quotation";
import { getPhoneCountryDefinition } from "@/lib/pricing/phone-country-catalog";
import type { HistoricalQuotation } from "@/lib/quotations/quotation-snapshot";

import type { BusinessProfile } from "./business-profile";
import { createCustomerSafeLineDetails } from "./customer-safe-line-details";
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

type CreateHistoricalQuotationPreviewViewModelInput = Readonly<{
  quotation: HistoricalQuotation;
  businessProfile: BusinessProfile;
}>;

const quotationCopFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

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
        createCustomerSafeLineDetails(line.details).map((detail) =>
          freezeField(detail.label, detail.value),
        ),
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

function formatStoredQuotationDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function createHistoricalQuotationPreviewViewModel({
  quotation,
  businessProfile,
}: CreateHistoricalQuotationPreviewViewModelInput): QuotationPreviewViewModel {
  const phone =
    quotation.customerPhoneCountryIso2 === null ||
    quotation.customerPhoneNumber === null
      ? null
      : `${getPhoneCountryDefinition(quotation.customerPhoneCountryIso2).callingCode} ${quotation.customerPhoneNumber}`;
  const customerFields = [
    ["Nombre o empresa", quotation.customerName],
    ["Documento o NIT", quotation.customerDocument],
    ["Teléfono", phone],
    ["Correo electrónico", quotation.customerEmail],
    ["Ciudad", quotation.customerCity],
  ] as const;
  const lines = quotation.lines.map((line) =>
    Object.freeze({
      title: line.title,
      details: Object.freeze(
        line.details.map((detail) => freezeField(detail.label, detail.value)),
      ),
      quantity: line.quantity,
      ...(line.source === "custom"
        ? {
            unitPriceCop: line.unitPriceCop,
            formattedUnitPrice: formatQuotationCop(line.unitPriceCop),
          }
        : {}),
      lineTotal: line.lineTotalCop,
      formattedLineTotal: formatQuotationCop(line.lineTotalCop),
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
    quotationFields: Object.freeze([
      freezeField("Fecha", formatStoredQuotationDate(quotation.quotationDate)),
      freezeField("Vigencia", `${quotation.validityDays} días`),
    ]),
    businessFields: createBusinessFields(businessProfile),
    customerFields: Object.freeze(
      customerFields.flatMap(([label, value]) =>
        value !== null && hasUsefulText(value)
          ? [freezeField(label, value)]
          : [],
      ),
    ),
    lines: Object.freeze(lines),
    total: quotation.totalCop,
    formattedTotal: formatQuotationCop(quotation.totalCop),
    notes: quotation.notes,
  });
}
