export type QuotationCalendarDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

export type QuotationValidityConfig = Readonly<{
  days: number;
}>;

export const QUOTATION_VALIDITY = Object.freeze({
  days: 15,
} as const satisfies QuotationValidityConfig);

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function assertValidQuotationCalendarDate(
  date: QuotationCalendarDate,
): void {
  if (!Number.isInteger(date.year) || date.year < 1 || date.year > 9_999) {
    throw new RangeError("Quotation year must be between 1 and 9999.");
  }

  if (!Number.isInteger(date.month) || date.month < 1 || date.month > 12) {
    throw new RangeError("Quotation month must be between 1 and 12.");
  }

  const maximumDay = getDaysInMonth(date.year, date.month);

  if (!Number.isInteger(date.day) || date.day < 1 || date.day > maximumDay) {
    throw new RangeError("Quotation day is outside the selected month.");
  }
}

export function createQuotationCalendarDate(
  localMoment: Date,
): QuotationCalendarDate {
  if (Number.isNaN(localMoment.getTime())) {
    throw new RangeError("Quotation date must come from a valid moment.");
  }

  return Object.freeze({
    year: localMoment.getFullYear(),
    month: localMoment.getMonth() + 1,
    day: localMoment.getDate(),
  });
}

export function formatQuotationCalendarDate(
  date: QuotationCalendarDate,
): string {
  assertValidQuotationCalendarDate(date);

  return [date.day, date.month, date.year]
    .map((part, index) =>
      String(part).padStart(index === 2 ? 4 : 2, "0"),
    )
    .join("/");
}

export function formatQuotationValidity(
  config: QuotationValidityConfig = QUOTATION_VALIDITY,
): string {
  if (!Number.isSafeInteger(config.days) || config.days < 1) {
    throw new RangeError("Quotation validity must be a positive number of days.");
  }

  return `${config.days} días`;
}
