import {
  createCustomerSafeLineDetails,
  isCustomerSafeLineDetail,
} from "@/lib/quotation/customer-safe-line-details";
import {
  QUOTATION_VALIDITY,
  type QuotationCalendarDate,
} from "@/lib/quotation/quotation-metadata";
import {
  calculateQuotationTotal,
  type QuotationLineSource,
  type TemporaryQuotationState,
} from "@/lib/pricing/temporary-quotation";
import { validateTemporaryQuotationDetails } from "@/lib/pricing/temporary-quotation-details-validation";
import {
  DEFAULT_PHONE_COUNTRY_ISO2,
  isPhoneCountryIso2,
  type PhoneCountryIso2,
} from "@/lib/pricing/phone-country-catalog";

export const QUOTATION_SNAPSHOT_INVALID_MESSAGE =
  "No pudimos preparar una copia histórica válida de la cotización. Revisa sus datos e inténtalo de nuevo.";
export const QUOTATION_SNAPSHOT_EMPTY_MESSAGE =
  "Agrega al menos una línea antes de guardar la cotización.";

export type QuotationSnapshotDetail = Readonly<{
  label: string;
  value: string;
}>;

export type StandardQuotationSnapshotLine = Readonly<{
  source: Exclude<QuotationLineSource, "custom">;
  title: string;
  quantity: number;
  details: readonly QuotationSnapshotDetail[];
  lineTotalCop: number;
}>;

export type CustomQuotationSnapshotLine = Readonly<{
  source: "custom";
  title: string;
  description: string;
  quantity: number;
  unitPriceCop: number;
  details: readonly [];
  lineTotalCop: number;
}>;

export type QuotationSnapshotLine =
  | StandardQuotationSnapshotLine
  | CustomQuotationSnapshotLine;

export type QuotationPersistenceSnapshot = Readonly<{
  quotationDate: string;
  validityDays: number;
  customerName: string | null;
  customerDocument: string | null;
  customerPhoneCountryIso2: PhoneCountryIso2 | null;
  customerPhoneNumber: string | null;
  customerEmail: string | null;
  customerCity: string | null;
  notes: string | null;
  totalCop: number;
  lines: readonly QuotationSnapshotLine[];
}>;

export type HistoricalQuotation = QuotationPersistenceSnapshot &
  Readonly<{
    id: string;
    createdAt: string;
    createdBy: string;
  }>;

export type HistoricalQuotationSummary = Readonly<{
  id: string;
  quotationDate: string;
  customerName: string | null;
  totalCop: number;
  createdAt: string;
}>;

export type QuotationSnapshotBuildResult =
  | Readonly<{ ok: true; value: QuotationPersistenceSnapshot }>
  | Readonly<{ ok: false; message: string }>;

const MAX_SAFE_COP = Number.MAX_SAFE_INTEGER;
const MAX_LINES = 500;
const MAX_DETAILS_PER_LINE = 100;

function optionalText(value: string): string | null {
  return value.length === 0 ? null : value;
}

function formatCalendarDateForStorage(date: QuotationCalendarDate): string {
  return [
    String(date.year).padStart(4, "0"),
    String(date.month).padStart(2, "0"),
    String(date.day).padStart(2, "0"),
  ].join("-");
}

function isValidCommercialNumber(value: number, allowZero: boolean): boolean {
  return (
    Number.isSafeInteger(value) &&
    (allowZero ? value >= 0 : value > 0) &&
    value <= MAX_SAFE_COP
  );
}

function isValidQuantity(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_SAFE_COP;
}

function isValidSnapshotDetail(detail: QuotationSnapshotDetail): boolean {
  return (
    typeof detail.label === "string" &&
    typeof detail.value === "string" &&
    detail.label.length >= 1 &&
    detail.label.length <= 100 &&
    detail.value.trim().length >= 1 &&
    detail.value.length <= 500 &&
    isCustomerSafeLineDetail(detail)
  );
}

function isValidStoredDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);

  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

function hasValidQuotationDetails(snapshot: QuotationPersistenceSnapshot): boolean {
  const optionalTextValues = [
    snapshot.customerName,
    snapshot.customerDocument,
    snapshot.customerPhoneNumber,
    snapshot.customerEmail,
    snapshot.customerCity,
    snapshot.notes,
  ];

  if (
    !optionalTextValues.every(
      (value) => value === null || typeof value === "string",
    ) ||
    (snapshot.customerPhoneCountryIso2 !== null &&
      !isPhoneCountryIso2(snapshot.customerPhoneCountryIso2)) ||
    (snapshot.customerPhoneNumber === null) !==
      (snapshot.customerPhoneCountryIso2 === null)
  ) {
    return false;
  }

  return (
    Object.keys(
      validateTemporaryQuotationDetails({
        customerName: snapshot.customerName ?? "",
        customerDocument: snapshot.customerDocument ?? "",
        customerPhoneCountryIso2:
          snapshot.customerPhoneCountryIso2 ?? DEFAULT_PHONE_COUNTRY_ISO2,
        customerPhoneNumber: snapshot.customerPhoneNumber ?? "",
        customerEmail: snapshot.customerEmail ?? "",
        customerCity: snapshot.customerCity ?? "",
        notes: snapshot.notes ?? "",
      }),
    ).length === 0
  );
}

export function isValidQuotationPersistenceSnapshot(
  snapshot: QuotationPersistenceSnapshot,
): boolean {
  if (
    typeof snapshot.quotationDate !== "string" ||
    !isValidStoredDate(snapshot.quotationDate) ||
    !Number.isSafeInteger(snapshot.validityDays) ||
    snapshot.validityDays < 1 ||
    snapshot.validityDays > 3650 ||
    !hasValidQuotationDetails(snapshot) ||
    !Array.isArray(snapshot.lines) ||
    snapshot.lines.length < 1 ||
    snapshot.lines.length > MAX_LINES ||
    !isValidCommercialNumber(snapshot.totalCop, true)
  ) {
    return false;
  }

  let calculatedTotal = 0;

  for (const line of snapshot.lines) {
    if (
      typeof line !== "object" ||
      line === null ||
      !["area-product", "service", "security-system", "custom"].includes(
        line.source,
      ) ||
      typeof line.title !== "string" ||
      line.title.trim().length < 1 ||
      line.title.length > 200 ||
      !isValidQuantity(line.quantity) ||
      !isValidCommercialNumber(line.lineTotalCop, true) ||
      !Array.isArray(line.details) ||
      line.details.length > MAX_DETAILS_PER_LINE ||
      !line.details.every(isValidSnapshotDetail)
    ) {
      return false;
    }

    if (line.source === "custom") {
      if (
        typeof line.description !== "string" ||
        line.description !== line.description.trim() ||
        line.description.length < 1 ||
        line.description.length > 200 ||
        line.title !== line.description ||
        !Number.isSafeInteger(line.quantity) ||
        !isValidCommercialNumber(line.unitPriceCop, false) ||
        line.details.length !== 0 ||
        line.quantity * line.unitPriceCop !== line.lineTotalCop
      ) {
        return false;
      }
    } else if ("description" in line || "unitPriceCop" in line) {
      return false;
    }

    if (line.lineTotalCop > MAX_SAFE_COP - calculatedTotal) {
      return false;
    }

    calculatedTotal += line.lineTotalCop;
  }

  return calculatedTotal === snapshot.totalCop;
}

export function createQuotationPersistenceSnapshot(
  quotation: TemporaryQuotationState,
): QuotationSnapshotBuildResult {
  if (quotation.lines.length === 0) {
    return Object.freeze({
      ok: false as const,
      message: QUOTATION_SNAPSHOT_EMPTY_MESSAGE,
    });
  }

  if (
    quotation.quotationDate === null ||
    Object.keys(validateTemporaryQuotationDetails(quotation.details)).length > 0
  ) {
    return Object.freeze({
      ok: false as const,
      message: QUOTATION_SNAPSHOT_INVALID_MESSAGE,
    });
  }

  try {
    const lines = quotation.lines.map((line): QuotationSnapshotLine => {
      const details = createCustomerSafeLineDetails(line.details);

      if (line.source === "custom") {
        return Object.freeze({
          source: "custom" as const,
          title: line.title,
          description: line.description,
          quantity: line.quantity,
          unitPriceCop: line.unitPriceCop,
          details: Object.freeze([]) as readonly [],
          lineTotalCop: line.lineTotal,
        });
      }

      return Object.freeze({
        source: line.source,
        title: line.title,
        quantity: line.quantity,
        details,
        lineTotalCop: line.lineTotal,
      });
    });
    const snapshot = Object.freeze({
      quotationDate: formatCalendarDateForStorage(quotation.quotationDate),
      validityDays: QUOTATION_VALIDITY.days,
      customerName: optionalText(quotation.details.customerName),
      customerDocument: optionalText(quotation.details.customerDocument),
      customerPhoneCountryIso2:
        quotation.details.customerPhoneNumber.length > 0
          ? quotation.details.customerPhoneCountryIso2
          : null,
      customerPhoneNumber: optionalText(
        quotation.details.customerPhoneNumber,
      ),
      customerEmail: optionalText(quotation.details.customerEmail),
      customerCity: optionalText(quotation.details.customerCity),
      notes: optionalText(quotation.details.notes),
      totalCop: calculateQuotationTotal(quotation),
      lines: Object.freeze(lines),
    }) satisfies QuotationPersistenceSnapshot;

    if (!isValidQuotationPersistenceSnapshot(snapshot)) {
      throw new RangeError("Invalid quotation persistence snapshot.");
    }

    return Object.freeze({ ok: true as const, value: snapshot });
  } catch {
    return Object.freeze({
      ok: false as const,
      message: QUOTATION_SNAPSHOT_INVALID_MESSAGE,
    });
  }
}
