import type { SupabaseClient } from "@supabase/supabase-js";

import { isPhoneCountryIso2 } from "@/lib/pricing/phone-country-catalog";

import type { Customer, CustomerInput } from "./customer";
import {
  isCustomerInputValid,
  normalizeCustomerInput,
} from "./customer-validation";

export const CUSTOMER_LOAD_FAILURE_MESSAGE =
  "No pudimos cargar los clientes. Inténtalo de nuevo.";
export const CUSTOMER_CREATE_FAILURE_MESSAGE =
  "No pudimos guardar el cliente. Inténtalo de nuevo.";
export const CUSTOMER_UPDATE_FAILURE_MESSAGE =
  "No pudimos actualizar el cliente. Inténtalo de nuevo.";
export const CUSTOMER_SESSION_FAILURE_MESSAGE =
  "Tu sesión venció o ya no es válida. Inicia sesión de nuevo.";

const CUSTOMER_COLUMNS =
  "id,name,document,phone_country_iso2,phone_number,email,city,created_at,updated_at";

type CustomerFailureKind =
  | "unauthenticated"
  | "load"
  | "create"
  | "update";

export type CustomerRepositoryResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{
      ok: false;
      kind: CustomerFailureKind;
      message: string;
    }>;

export type CustomerRepository = Readonly<{
  list: () => Promise<CustomerRepositoryResult<readonly Customer[]>>;
  create: (
    input: CustomerInput,
  ) => Promise<CustomerRepositoryResult<Customer>>;
  update: (
    id: string,
    input: CustomerInput,
  ) => Promise<CustomerRepositoryResult<Customer>>;
}>;

type CustomerRow = Readonly<{
  id: string;
  name: string;
  document: string | null;
  phone_country_iso2: string | null;
  phone_number: string | null;
  email: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(
  row: Record<string, unknown>,
  field: string,
): string {
  const value = row[field];

  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`Invalid customer row field: ${field}`);
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
    throw new TypeError(`Invalid customer row field: ${field}`);
  }

  return value;
}

export function mapCustomerRow(row: unknown): Customer {
  if (!isRecord(row)) {
    throw new TypeError("Invalid customer row.");
  }

  const phoneCountryIso2 = readOptionalString(row, "phone_country_iso2");

  if (phoneCountryIso2 !== null && !isPhoneCountryIso2(phoneCountryIso2)) {
    throw new TypeError("Invalid customer phone country.");
  }

  return Object.freeze({
    id: readRequiredString(row, "id"),
    name: readRequiredString(row, "name"),
    document: readOptionalString(row, "document"),
    phoneCountryIso2,
    phoneNumber: readOptionalString(row, "phone_number"),
    email: readOptionalString(row, "email"),
    city: readOptionalString(row, "city"),
    createdAt: readRequiredString(row, "created_at"),
    updatedAt: readRequiredString(row, "updated_at"),
  });
}

function toCustomerPayload(input: CustomerInput) {
  const normalized = normalizeCustomerInput(input);
  const hasPhone = normalized.phoneNumber.length > 0;

  return {
    name: normalized.name,
    document: normalized.document || null,
    phone_country_iso2: hasPhone ? normalized.phoneCountryIso2 : null,
    phone_number: normalized.phoneNumber || null,
    email: normalized.email || null,
    city: normalized.city || null,
  } satisfies Omit<CustomerRow, "id" | "created_at" | "updated_at">;
}

function failure(
  kind: CustomerFailureKind,
  message: string,
): CustomerRepositoryResult<never> {
  return Object.freeze({ ok: false, kind, message });
}

export function createSupabaseCustomerRepository(
  supabase: Pick<SupabaseClient, "auth" | "from">,
): CustomerRepository {
  async function hasAuthenticatedSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getClaims();
      return !error && Boolean(data?.claims);
    } catch {
      return false;
    }
  }

  return Object.freeze({
    async list() {
      if (!(await hasAuthenticatedSession())) {
        return failure("unauthenticated", CUSTOMER_SESSION_FAILURE_MESSAGE);
      }

      try {
        const { data, error } = await supabase
          .from("customers")
          .select(CUSTOMER_COLUMNS)
          .order("name", { ascending: true })
          .order("created_at", { ascending: true });

        if (error || !Array.isArray(data)) {
          return failure("load", CUSTOMER_LOAD_FAILURE_MESSAGE);
        }

        return Object.freeze({
          ok: true as const,
          value: Object.freeze(data.map(mapCustomerRow)),
        });
      } catch {
        return failure("load", CUSTOMER_LOAD_FAILURE_MESSAGE);
      }
    },

    async create(input) {
      if (!(await hasAuthenticatedSession())) {
        return failure("unauthenticated", CUSTOMER_SESSION_FAILURE_MESSAGE);
      }

      if (!isCustomerInputValid(input)) {
        return failure("create", CUSTOMER_CREATE_FAILURE_MESSAGE);
      }

      try {
        const { data, error } = await supabase
          .from("customers")
          .insert(toCustomerPayload(input))
          .select(CUSTOMER_COLUMNS)
          .single();

        if (error || data === null) {
          return failure("create", CUSTOMER_CREATE_FAILURE_MESSAGE);
        }

        return Object.freeze({ ok: true as const, value: mapCustomerRow(data) });
      } catch {
        return failure("create", CUSTOMER_CREATE_FAILURE_MESSAGE);
      }
    },

    async update(id, input) {
      if (!(await hasAuthenticatedSession())) {
        return failure("unauthenticated", CUSTOMER_SESSION_FAILURE_MESSAGE);
      }

      if (!id || !isCustomerInputValid(input)) {
        return failure("update", CUSTOMER_UPDATE_FAILURE_MESSAGE);
      }

      try {
        const { data, error } = await supabase
          .from("customers")
          .update(toCustomerPayload(input))
          .eq("id", id)
          .select(CUSTOMER_COLUMNS)
          .single();

        if (error || data === null) {
          return failure("update", CUSTOMER_UPDATE_FAILURE_MESSAGE);
        }

        return Object.freeze({ ok: true as const, value: mapCustomerRow(data) });
      } catch {
        return failure("update", CUSTOMER_UPDATE_FAILURE_MESSAGE);
      }
    },
  });
}
