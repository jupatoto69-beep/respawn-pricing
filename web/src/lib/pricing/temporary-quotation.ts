import {
  DEFAULT_PHONE_COUNTRY_ISO2,
  type PhoneCountryIso2,
} from "./phone-country-catalog";

export {
  getPhoneCountryDefinition,
  PHONE_COUNTRY_DEFINITIONS,
} from "./phone-country-catalog";
export type {
  PhoneCountryDefinition,
  PhoneCountryIso2,
} from "./phone-country-catalog";
export {
  formatQuotationPhoneDisplay,
  formatQuotationPhoneE164,
} from "./quotation-phone";

export type QuotationLineSource = "area-product" | "service";

export type QuotationLineDetail = Readonly<{
  label: string;
  value: string;
}>;

export type QuotationLineDraft = Readonly<{
  source: QuotationLineSource;
  title: string;
  quantity: number;
  details: readonly QuotationLineDetail[];
  lineTotal: number;
}>;

export type QuotationLine = QuotationLineDraft &
  Readonly<{
    id: string;
  }>;

export type TemporaryQuotationDetails = Readonly<{
  customerName: string;
  customerDocument: string;
  customerPhoneCountryIso2: PhoneCountryIso2;
  customerPhoneNumber: string;
  customerEmail: string;
  customerCity: string;
  notes: string;
}>;

export type TemporaryQuotationDetailField = keyof TemporaryQuotationDetails;
export type TemporaryQuotationTextDetailField = Exclude<
  TemporaryQuotationDetailField,
  "customerPhoneCountryIso2"
>;

export type TemporaryQuotationState = Readonly<{
  lines: readonly QuotationLine[];
  nextLineSequence: number;
  details: TemporaryQuotationDetails;
}>;

const TEMPORARY_QUOTATION_DETAIL_FIELDS = Object.freeze([
  "customerName",
  "customerDocument",
  "customerPhoneCountryIso2",
  "customerPhoneNumber",
  "customerEmail",
  "customerCity",
  "notes",
] as const satisfies readonly TemporaryQuotationDetailField[]);

const TEMPORARY_QUOTATION_INFORMATION_FIELDS = Object.freeze([
  "customerName",
  "customerDocument",
  "customerPhoneNumber",
  "customerEmail",
  "customerCity",
  "notes",
] as const satisfies readonly TemporaryQuotationTextDetailField[]);

function freezeDetails(
  details: TemporaryQuotationDetails,
): TemporaryQuotationDetails {
  return Object.freeze({
    customerName: details.customerName,
    customerDocument: details.customerDocument,
    customerPhoneCountryIso2: details.customerPhoneCountryIso2,
    customerPhoneNumber: details.customerPhoneNumber,
    customerEmail: details.customerEmail,
    customerCity: details.customerCity,
    notes: details.notes,
  });
}

function freezeState(
  lines: readonly QuotationLine[],
  nextLineSequence: number,
  details: TemporaryQuotationDetails,
): TemporaryQuotationState {
  return Object.freeze({
    lines: Object.freeze([...lines]),
    nextLineSequence,
    details: freezeDetails(details),
  });
}

function hasStoredQuotationDetails(
  details: TemporaryQuotationDetails,
): boolean {
  return (
    details.customerPhoneCountryIso2 !== DEFAULT_PHONE_COUNTRY_ISO2 ||
    TEMPORARY_QUOTATION_INFORMATION_FIELDS.some(
      (field) => details[field].length > 0,
    )
  );
}

function assertValidLineTotal(lineTotal: number): void {
  if (!Number.isFinite(lineTotal)) {
    throw new RangeError("Quotation line total must be finite.");
  }

  if (lineTotal < 0) {
    throw new RangeError("Quotation line total must not be negative.");
  }

  if (!Number.isSafeInteger(lineTotal)) {
    throw new RangeError("Quotation line total must be a safe integer.");
  }
}

function addSafeTotals(currentTotal: number, lineTotal: number): number {
  if (lineTotal > Number.MAX_SAFE_INTEGER - currentTotal) {
    throw new RangeError("Quotation total exceeds the safe integer range.");
  }

  return currentTotal + lineTotal;
}

function copyDetails(
  details: readonly QuotationLineDetail[],
): readonly QuotationLineDetail[] {
  return Object.freeze(
    details.map((detail) =>
      Object.freeze({
        label: detail.label,
        value: detail.value,
      }),
    ),
  );
}

export function createEmptyQuotationDetails(): TemporaryQuotationDetails {
  return freezeDetails({
    customerName: "",
    customerDocument: "",
    customerPhoneCountryIso2: DEFAULT_PHONE_COUNTRY_ISO2,
    customerPhoneNumber: "",
    customerEmail: "",
    customerCity: "",
    notes: "",
  });
}

export function createEmptyQuotation(): TemporaryQuotationState {
  return freezeState([], 1, createEmptyQuotationDetails());
}

export function updateQuotationDetails(
  quotation: TemporaryQuotationState,
  updates: Readonly<Partial<TemporaryQuotationDetails>>,
): TemporaryQuotationState {
  const details = {
    ...quotation.details,
    ...updates,
  };

  if (
    TEMPORARY_QUOTATION_DETAIL_FIELDS.every(
      (field) => details[field] === quotation.details[field],
    )
  ) {
    return quotation;
  }

  return freezeState(
    quotation.lines,
    quotation.nextLineSequence,
    details,
  );
}

export function updateQuotationDetail(
  quotation: TemporaryQuotationState,
  field: TemporaryQuotationTextDetailField,
  value: string,
): TemporaryQuotationState {
  return updateQuotationDetails(quotation, { [field]: value });
}

export function updateQuotationPhoneCountry(
  quotation: TemporaryQuotationState,
  countryIso2: PhoneCountryIso2,
): TemporaryQuotationState {
  return updateQuotationDetails(quotation, {
    customerPhoneCountryIso2: countryIso2,
  });
}

export function hasQuotationDetailsInformation(
  details: TemporaryQuotationDetails,
): boolean {
  return TEMPORARY_QUOTATION_INFORMATION_FIELDS.some(
    (field) => details[field].trim().length > 0,
  );
}

export function hasQuotationInformation(
  quotation: TemporaryQuotationState,
): boolean {
  return (
    quotation.lines.length > 0 ||
    hasQuotationDetailsInformation(quotation.details)
  );
}

export function calculateQuotationTotal(
  quotation: TemporaryQuotationState,
): number {
  return quotation.lines.reduce((total, line) => {
    assertValidLineTotal(line.lineTotal);
    return addSafeTotals(total, line.lineTotal);
  }, 0);
}

export function addQuotationLine(
  quotation: TemporaryQuotationState,
  draft: QuotationLineDraft,
): TemporaryQuotationState {
  assertValidLineTotal(draft.lineTotal);
  addSafeTotals(calculateQuotationTotal(quotation), draft.lineTotal);

  if (
    !Number.isSafeInteger(quotation.nextLineSequence) ||
    quotation.nextLineSequence < 1 ||
    quotation.nextLineSequence === Number.MAX_SAFE_INTEGER
  ) {
    throw new RangeError("Quotation line sequence is outside the safe range.");
  }

  const line: QuotationLine = Object.freeze({
    id: `quotation-line-${quotation.nextLineSequence}`,
    source: draft.source,
    title: draft.title,
    quantity: draft.quantity,
    details: copyDetails(draft.details),
    lineTotal: draft.lineTotal,
  });

  return freezeState(
    [...quotation.lines, line],
    quotation.nextLineSequence + 1,
    quotation.details,
  );
}

export function removeQuotationLine(
  quotation: TemporaryQuotationState,
  lineId: string,
): TemporaryQuotationState {
  if (!quotation.lines.some((line) => line.id === lineId)) {
    return quotation;
  }

  return freezeState(
    quotation.lines.filter((line) => line.id !== lineId),
    quotation.nextLineSequence,
    quotation.details,
  );
}

export function clearQuotation(
  quotation: TemporaryQuotationState,
): TemporaryQuotationState {
  if (
    quotation.lines.length === 0 &&
    !hasStoredQuotationDetails(quotation.details)
  ) {
    return quotation;
  }

  return freezeState(
    [],
    quotation.nextLineSequence,
    createEmptyQuotationDetails(),
  );
}
