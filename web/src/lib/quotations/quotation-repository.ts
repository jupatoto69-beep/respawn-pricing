import type { SupabaseClient } from "@supabase/supabase-js";

import { isCustomerSafeLineDetail } from "@/lib/quotation/customer-safe-line-details";
import { isPhoneCountryIso2 } from "@/lib/pricing/phone-country-catalog";

import {
  isValidQuotationPersistenceSnapshot,
  type HistoricalQuotation,
  type HistoricalQuotationSummary,
  type QuotationPersistenceSnapshot,
  type QuotationSnapshotDetail,
  type QuotationSnapshotLine,
} from "./quotation-snapshot";

export const QUOTATION_HISTORY_LIMIT = 50;
export const QUOTATION_SAVE_FAILURE_MESSAGE =
  "No pudimos guardar la cotización. Inténtalo de nuevo.";
export const QUOTATION_LOAD_FAILURE_MESSAGE =
  "No pudimos cargar el historial de cotizaciones. Inténtalo de nuevo.";
export const QUOTATION_OPEN_FAILURE_MESSAGE =
  "No pudimos abrir la cotización guardada. Inténtalo de nuevo.";
export const QUOTATION_SESSION_FAILURE_MESSAGE =
  "Tu sesión venció o ya no es válida. Inicia sesión de nuevo.";

const QUOTATION_COLUMNS =
  "id,quotation_date,validity_days,customer_name,customer_document,customer_phone_country_iso2,customer_phone_number,customer_email,customer_city,notes,total_cop,created_at,created_by";
const QUOTATION_SUMMARY_COLUMNS =
  "id,quotation_date,customer_name,total_cop,created_at";
const QUOTATION_LINE_COLUMNS =
  "id,quotation_id,position,source,title,quantity,details,description,unit_price_cop,line_total_cop";

type QuotationFailureKind =
  | "unauthenticated"
  | "invalid"
  | "save"
  | "list"
  | "load";

export type QuotationRepositoryResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{
      ok: false;
      kind: QuotationFailureKind;
      message: string;
    }>;

export type QuotationRepository = Readonly<{
  save: (
    snapshot: QuotationPersistenceSnapshot,
  ) => Promise<QuotationRepositoryResult<string>>;
  list: () => Promise<
    QuotationRepositoryResult<readonly HistoricalQuotationSummary[]>
  >;
  load: (
    quotationId: string,
  ) => Promise<QuotationRepositoryResult<HistoricalQuotation>>;
}>;

type QuotationHeader = Readonly<{
  id: string;
  quotationDate: string;
  validityDays: number;
  customerName: string | null;
  customerDocument: string | null;
  customerPhoneCountryIso2: HistoricalQuotation["customerPhoneCountryIso2"];
  customerPhoneNumber: string | null;
  customerEmail: string | null;
  customerCity: string | null;
  notes: string | null;
  totalCop: number;
  createdAt: string;
  createdBy: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(
  row: Record<string, unknown>,
  field: string,
): string {
  const value = row[field];

  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`Invalid quotation row field: ${field}`);
  }

  return value;
}

function readOptionalString(
  row: Record<string, unknown>,
  field: string,
): string | null {
  const value = row[field];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`Invalid quotation row field: ${field}`);
  }

  return value;
}

function readSafeInteger(
  row: Record<string, unknown>,
  field: string,
  allowZero: boolean,
): number {
  const raw = row[field];
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && /^\d+$/u.test(raw)
        ? Number(raw)
        : Number.NaN;

  if (
    !Number.isSafeInteger(value) ||
    (allowZero ? value < 0 : value <= 0)
  ) {
    throw new TypeError(`Invalid quotation numeric field: ${field}`);
  }

  return value;
}

function readQuantity(row: Record<string, unknown>): number {
  const raw = row.quantity;
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim().length > 0
        ? Number(raw)
        : Number.NaN;

  if (!Number.isFinite(value) || value <= 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new TypeError("Invalid quotation line quantity.");
  }

  return value;
}

function mapDetails(value: unknown): readonly QuotationSnapshotDetail[] {
  if (!Array.isArray(value) || value.length > 100) {
    throw new TypeError("Invalid quotation line details.");
  }

  return Object.freeze(
    value.map((detail) => {
      if (!isRecord(detail)) {
        throw new TypeError("Invalid quotation line detail.");
      }

      const mapped = Object.freeze({
        label: readRequiredString(detail, "label"),
        value: readRequiredString(detail, "value"),
      });

      if (!isCustomerSafeLineDetail(mapped)) {
        throw new TypeError("Unsafe quotation line detail.");
      }

      return mapped;
    }),
  );
}

function mapQuotationHeader(row: unknown): QuotationHeader {
  if (!isRecord(row)) {
    throw new TypeError("Invalid quotation row.");
  }

  const phoneCountryIso2 = readOptionalString(
    row,
    "customer_phone_country_iso2",
  );

  if (phoneCountryIso2 !== null && !isPhoneCountryIso2(phoneCountryIso2)) {
    throw new TypeError("Invalid quotation customer phone country.");
  }

  const quotationDate = readRequiredString(row, "quotation_date");

  if (!/^\d{4}-\d{2}-\d{2}$/u.test(quotationDate)) {
    throw new TypeError("Invalid quotation date.");
  }

  return Object.freeze({
    id: readRequiredString(row, "id"),
    quotationDate,
    validityDays: readSafeInteger(row, "validity_days", false),
    customerName: readOptionalString(row, "customer_name"),
    customerDocument: readOptionalString(row, "customer_document"),
    customerPhoneCountryIso2: phoneCountryIso2,
    customerPhoneNumber: readOptionalString(row, "customer_phone_number"),
    customerEmail: readOptionalString(row, "customer_email"),
    customerCity: readOptionalString(row, "customer_city"),
    notes: readOptionalString(row, "notes"),
    totalCop: readSafeInteger(row, "total_cop", true),
    createdAt: readRequiredString(row, "created_at"),
    createdBy: readRequiredString(row, "created_by"),
  });
}

function mapQuotationLine(
  row: unknown,
  expectedPosition: number,
  expectedQuotationId: string,
): QuotationSnapshotLine {
  if (!isRecord(row)) {
    throw new TypeError("Invalid quotation line row.");
  }

  if (readSafeInteger(row, "position", false) !== expectedPosition) {
    throw new TypeError("Invalid quotation line ordering.");
  }

  readRequiredString(row, "id");

  if (readRequiredString(row, "quotation_id") !== expectedQuotationId) {
    throw new TypeError("Invalid quotation line ownership.");
  }

  const source = readRequiredString(row, "source");
  const title = readRequiredString(row, "title");
  const quantity = readQuantity(row);
  const details = mapDetails(row.details);
  const lineTotalCop = readSafeInteger(row, "line_total_cop", true);

  if (source === "custom") {
    const description = readRequiredString(row, "description");
    const unitPriceCop = readSafeInteger(row, "unit_price_cop", false);

    if (details.length !== 0) {
      throw new TypeError("Invalid custom quotation line details.");
    }

    return Object.freeze({
      source,
      title,
      description,
      quantity,
      unitPriceCop,
      details: Object.freeze([]) as readonly [],
      lineTotalCop,
    });
  }

  if (
    !["area-product", "service", "security-system"].includes(source) ||
    row.description !== null ||
    row.unit_price_cop !== null
  ) {
    throw new TypeError("Invalid standard quotation line row.");
  }

  return Object.freeze({
    source: source as Exclude<QuotationSnapshotLine["source"], "custom">,
    title,
    quantity,
    details,
    lineTotalCop,
  });
}

export function mapHistoricalQuotationRows(
  headerRow: unknown,
  lineRows: unknown,
): HistoricalQuotation {
  const header = mapQuotationHeader(headerRow);

  if (!Array.isArray(lineRows)) {
    throw new TypeError("Invalid quotation line collection.");
  }

  const lines = Object.freeze(
    lineRows.map((row, index) =>
      mapQuotationLine(row, index + 1, header.id),
    ),
  );
  const snapshot: QuotationPersistenceSnapshot = Object.freeze({
    quotationDate: header.quotationDate,
    validityDays: header.validityDays,
    customerName: header.customerName,
    customerDocument: header.customerDocument,
    customerPhoneCountryIso2: header.customerPhoneCountryIso2,
    customerPhoneNumber: header.customerPhoneNumber,
    customerEmail: header.customerEmail,
    customerCity: header.customerCity,
    notes: header.notes,
    totalCop: header.totalCop,
    lines,
  });

  if (!isValidQuotationPersistenceSnapshot(snapshot)) {
    throw new TypeError("Invalid stored quotation snapshot.");
  }

  return Object.freeze({
    id: header.id,
    ...snapshot,
    createdAt: header.createdAt,
    createdBy: header.createdBy,
  });
}

export function mapHistoricalQuotationSummary(
  row: unknown,
): HistoricalQuotationSummary {
  if (!isRecord(row)) {
    throw new TypeError("Invalid quotation summary row.");
  }

  const quotationDate = readRequiredString(row, "quotation_date");

  if (!/^\d{4}-\d{2}-\d{2}$/u.test(quotationDate)) {
    throw new TypeError("Invalid quotation summary date.");
  }

  return Object.freeze({
    id: readRequiredString(row, "id"),
    quotationDate,
    customerName: readOptionalString(row, "customer_name"),
    totalCop: readSafeInteger(row, "total_cop", true),
    createdAt: readRequiredString(row, "created_at"),
  });
}

function failure(
  kind: QuotationFailureKind,
  message: string,
): QuotationRepositoryResult<never> {
  return Object.freeze({ ok: false, kind, message });
}

export function createSupabaseQuotationRepository(
  supabase: Pick<SupabaseClient, "auth" | "from" | "rpc">,
): QuotationRepository {
  async function hasAuthenticatedSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getClaims();
      return !error && Boolean(data?.claims);
    } catch {
      return false;
    }
  }

  return Object.freeze({
    async save(snapshot) {
      if (!(await hasAuthenticatedSession())) {
        return failure("unauthenticated", QUOTATION_SESSION_FAILURE_MESSAGE);
      }

      if (!isValidQuotationPersistenceSnapshot(snapshot)) {
        return failure("invalid", QUOTATION_SAVE_FAILURE_MESSAGE);
      }

      try {
        const { data, error } = await supabase.rpc(
          "save_quotation_snapshot",
          { snapshot },
        );

        if (error || typeof data !== "string" || data.length === 0) {
          return failure("save", QUOTATION_SAVE_FAILURE_MESSAGE);
        }

        return Object.freeze({ ok: true as const, value: data });
      } catch {
        return failure("save", QUOTATION_SAVE_FAILURE_MESSAGE);
      }
    },

    async list() {
      if (!(await hasAuthenticatedSession())) {
        return failure("unauthenticated", QUOTATION_SESSION_FAILURE_MESSAGE);
      }

      try {
        const { data, error } = await supabase
          .from("quotations")
          .select(QUOTATION_SUMMARY_COLUMNS)
          .order("created_at", { ascending: false })
          .limit(QUOTATION_HISTORY_LIMIT);

        if (error || !Array.isArray(data)) {
          return failure("list", QUOTATION_LOAD_FAILURE_MESSAGE);
        }

        return Object.freeze({
          ok: true as const,
          value: Object.freeze(data.map(mapHistoricalQuotationSummary)),
        });
      } catch {
        return failure("list", QUOTATION_LOAD_FAILURE_MESSAGE);
      }
    },

    async load(quotationId) {
      if (!(await hasAuthenticatedSession())) {
        return failure("unauthenticated", QUOTATION_SESSION_FAILURE_MESSAGE);
      }

      if (quotationId.length === 0) {
        return failure("load", QUOTATION_OPEN_FAILURE_MESSAGE);
      }

      try {
        const { data: quotation, error: quotationError } = await supabase
          .from("quotations")
          .select(QUOTATION_COLUMNS)
          .eq("id", quotationId)
          .single();

        if (quotationError || quotation === null) {
          return failure("load", QUOTATION_OPEN_FAILURE_MESSAGE);
        }

        const { data: lines, error: linesError } = await supabase
          .from("quotation_lines")
          .select(QUOTATION_LINE_COLUMNS)
          .eq("quotation_id", quotationId)
          .order("position", { ascending: true });

        if (linesError || !Array.isArray(lines)) {
          return failure("load", QUOTATION_OPEN_FAILURE_MESSAGE);
        }

        return Object.freeze({
          ok: true as const,
          value: mapHistoricalQuotationRows(quotation, lines),
        });
      } catch {
        return failure("load", QUOTATION_OPEN_FAILURE_MESSAGE);
      }
    },
  });
}
