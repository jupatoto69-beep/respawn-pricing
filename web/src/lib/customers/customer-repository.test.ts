import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { CustomerInput } from "./customer";
import {
  createSupabaseCustomerRepository,
  CUSTOMER_CREATE_FAILURE_MESSAGE,
  CUSTOMER_SESSION_FAILURE_MESSAGE,
  CUSTOMER_UPDATE_FAILURE_MESSAGE,
  mapCustomerRow,
} from "./customer-repository";

const ROW = {
  id: "30000000-0000-4000-8000-000000000001",
  name: "Órbita Creativa SAS",
  document: "900777666-5",
  phone_country_iso2: "CO",
  phone_number: "3005550103",
  email: "equipo@orbita-creativa.example",
  city: "Villa Ficción",
  created_at: "2026-09-15T12:00:00.000Z",
  updated_at: "2026-09-15T12:00:00.000Z",
};

const INPUT: CustomerInput = {
  name: "Órbita Creativa SAS",
  document: "900777666-5",
  phoneCountryIso2: "CO",
  phoneNumber: "3005550103",
  email: "equipo@orbita-creativa.example",
  city: "Villa Ficción",
};

function clientWithFrom(from: ReturnType<typeof vi.fn>) {
  return {
    auth: {
      getClaims: vi.fn(async () => ({
        data: { claims: { sub: "fictional-employee" } },
        error: null,
      })),
    },
    from,
  } as unknown as Pick<SupabaseClient, "auth" | "from">;
}

function mutationClient(
  operation: "insert" | "update",
  response: Readonly<{ data: unknown; error: unknown }>,
) {
  const single = vi.fn(async () => response);
  const select = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ select }));
  const mutation = vi.fn(() =>
    operation === "insert" ? { select } : { eq },
  );
  const from = vi.fn(() => ({ [operation]: mutation }));

  return { client: clientWithFrom(from), from, mutation, eq };
}

describe("customer row mapping", () => {
  it("maps database snake_case fields to the customer model", () => {
    expect(mapCustomerRow(ROW)).toEqual({
      id: ROW.id,
      name: ROW.name,
      document: ROW.document,
      phoneCountryIso2: ROW.phone_country_iso2,
      phoneNumber: ROW.phone_number,
      email: ROW.email,
      city: ROW.city,
      createdAt: ROW.created_at,
      updatedAt: ROW.updated_at,
    });
  });

  it("rejects malformed or unsupported customer rows", () => {
    expect(() => mapCustomerRow({ ...ROW, phone_country_iso2: "ZZ" })).toThrow();
    expect(() => mapCustomerRow({ ...ROW, name: null })).toThrow();
  });
});

describe("Supabase customer repository", () => {
  it("lists and maps authenticated customer rows", async () => {
    const secondOrder = vi.fn(async () => ({ data: [ROW], error: null }));
    const firstOrder = vi.fn(() => ({ order: secondOrder }));
    const select = vi.fn(() => ({ order: firstOrder }));
    const from = vi.fn(() => ({ select }));
    const repository = createSupabaseCustomerRepository(clientWithFrom(from));

    const result = await repository.list();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([mapCustomerRow(ROW)]);
    }
    expect(from).toHaveBeenCalledWith("customers");
  });

  it("returns a safe list failure without provider details", async () => {
    const secondOrder = vi.fn(async () => ({
      data: null,
      error: new Error("postgres-private-list-detail"),
    }));
    const firstOrder = vi.fn(() => ({ order: secondOrder }));
    const select = vi.fn(() => ({ order: firstOrder }));
    const repository = createSupabaseCustomerRepository(
      clientWithFrom(vi.fn(() => ({ select }))),
    );

    const result = await repository.list();

    expect(result).toMatchObject({ ok: false, kind: "load" });
    expect(JSON.stringify(result)).not.toContain("postgres-private");
  });

  it("creates a customer and converts empty optional fields to null", async () => {
    const fixture = mutationClient("insert", { data: ROW, error: null });
    const repository = createSupabaseCustomerRepository(fixture.client);

    const result = await repository.create({
      ...INPUT,
      document: "",
      phoneNumber: "",
      email: "",
      city: "",
    });

    expect(result).toEqual({ ok: true, value: mapCustomerRow(ROW) });
    expect(fixture.mutation).toHaveBeenCalledWith({
      name: INPUT.name,
      document: null,
      phone_country_iso2: null,
      phone_number: null,
      email: null,
      city: null,
    });
  });

  it("returns a safe create failure without provider details", async () => {
    const fixture = mutationClient("insert", {
      data: null,
      error: new Error("postgres-private-create-detail"),
    });
    const repository = createSupabaseCustomerRepository(fixture.client);

    const result = await repository.create(INPUT);

    expect(result).toEqual({
      ok: false,
      kind: "create",
      message: CUSTOMER_CREATE_FAILURE_MESSAGE,
    });
    expect(JSON.stringify(result)).not.toContain("postgres-private");
  });

  it("updates a customer by id and maps the returned row", async () => {
    const updatedRow = {
      ...ROW,
      name: "Órbita Creativa Renovada SAS",
      updated_at: "2026-09-15T14:00:00.000Z",
    };
    const fixture = mutationClient("update", {
      data: updatedRow,
      error: null,
    });
    const repository = createSupabaseCustomerRepository(fixture.client);

    const result = await repository.update(ROW.id, {
      ...INPUT,
      name: updatedRow.name,
    });

    expect(result).toEqual({ ok: true, value: mapCustomerRow(updatedRow) });
    expect(fixture.eq).toHaveBeenCalledWith("id", ROW.id);
  });

  it("returns a safe update failure without provider details", async () => {
    const fixture = mutationClient("update", {
      data: null,
      error: new Error("postgres-private-update-detail"),
    });
    const repository = createSupabaseCustomerRepository(fixture.client);

    const result = await repository.update(ROW.id, INPUT);

    expect(result).toEqual({
      ok: false,
      kind: "update",
      message: CUSTOMER_UPDATE_FAILURE_MESSAGE,
    });
    expect(JSON.stringify(result)).not.toContain("postgres-private");
  });

  it("handles an expired session before customer access", async () => {
    const from = vi.fn();
    const client = {
      auth: {
        getClaims: vi.fn(async () => ({
          data: { claims: null },
          error: new Error("expired-token-detail"),
        })),
      },
      from,
    } as unknown as Pick<SupabaseClient, "auth" | "from">;
    const repository = createSupabaseCustomerRepository(client);

    const result = await repository.list();

    expect(result).toEqual({
      ok: false,
      kind: "unauthenticated",
      message: CUSTOMER_SESSION_FAILURE_MESSAGE,
    });
    expect(from).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("expired-token");
  });
});
