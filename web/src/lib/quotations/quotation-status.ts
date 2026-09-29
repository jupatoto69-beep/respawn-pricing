import type { QuotationStatus } from "./quotation-snapshot";

export const QUOTATION_STATUS_LABELS: Readonly<Record<QuotationStatus, string>> =
  Object.freeze({
    sent: "Enviada",
    accepted: "Aceptada",
    rejected: "Rechazada",
  });

export function isQuotationStatus(value: unknown): value is QuotationStatus {
  return value === "sent" || value === "accepted" || value === "rejected";
}

export function isQuotationNumber(value: unknown): value is string {
  return typeof value === "string" && /^DR-[0-9]{4}-[0-9]{4}$/u.test(value);
}

export function currentBogotaDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isQuotationExpired(
  status: QuotationStatus,
  quotationDate: string,
  validityDays: number,
  today: string = currentBogotaDate(),
): boolean {
  if (status !== "sent") {
    return false;
  }

  const expiry = new Date(`${quotationDate}T00:00:00.000Z`);
  expiry.setUTCDate(expiry.getUTCDate() + validityDays);
  return expiry.toISOString().slice(0, 10) < today;
}

export function quotationDisplayStatus(
  status: QuotationStatus,
  quotationDate: string,
  validityDays: number,
  today?: string,
): string {
  return isQuotationExpired(status, quotationDate, validityDays, today)
    ? "Vencida"
    : QUOTATION_STATUS_LABELS[status];
}
