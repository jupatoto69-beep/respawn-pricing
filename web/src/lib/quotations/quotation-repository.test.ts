import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  createSupabaseQuotationRepository,
  mapHistoricalQuotationRows,
  QUOTATION_HISTORY_LIMIT,
  QUOTATION_LOAD_FAILURE_MESSAGE,
  QUOTATION_OPEN_FAILURE_MESSAGE,
  QUOTATION_SAVE_FAILURE_MESSAGE,
  QUOTATION_SESSION_FAILURE_MESSAGE,
} from "./quotation-repository";
import type { QuotationPersistenceSnapshot } from "./quotation-snapshot";

const QUOTATION_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

const SNAPSHOT: QuotationPersistenceSnapshot = Object.freeze({
  quotationDate: "2026-09-24",
  validityDays: 15,
  customerName: "Empresa Ejemplo Histórica SAS",
  customerDocument: "900123456-7",
  customerPhoneCountryIso2: "CO",
  customerPhoneNumber: "3205550199",
  customerEmail: "historica@example.com",
  customerCity: "Ciudad Ejemplo",
  notes: "Cotización histórica ficticia.",
  totalCop: 200_000,
  lines: Object.freeze([
    Object.freeze({
      source: "area-product" as const,
      title: "Producto normal de ejemplo",
      quantity: 1.5,
      details: Object.freeze([
        Object.freeze({ label: "Dimensiones", value: "50 × 70 cm" }),
      ]),
      lineTotalCop: 83_300,
    }),
    Object.freeze({
      source: "custom" as const,
      title: "Medio metro de lámina sublimada",
      description: "Medio metro de lámina sublimada",
      quantity: 2,
      unitPriceCop: 58_350,
      details: Object.freeze([]) as readonly [],
      lineTotalCop: 116_700,
    }),
  ]),
});

const HEADER_ROW = {
  id: QUOTATION_ID,
  quotation_date: SNAPSHOT.quotationDate,
  validity_days: SNAPSHOT.validityDays,
  customer_name: SNAPSHOT.customerName,
  customer_document: SNAPSHOT.customerDocument,
  customer_phone_country_iso2: SNAPSHOT.customerPhoneCountryIso2,
  customer_phone_number: SNAPSHOT.customerPhoneNumber,
  customer_email: SNAPSHOT.customerEmail,
  customer_city: SNAPSHOT.customerCity,
  notes: SNAPSHOT.notes,
  total_cop: String(SNAPSHOT.totalCop),
  created_at: "2026-09-24T14:30:00.000Z",
  created_by: USER_ID,
};

const LINE_ROWS = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    quotation_id: QUOTATION_ID,
    position: 1,
    source: "area-product",
    title: "Producto normal de ejemplo",
    quantity: "1.5",
    details: [{ label: "Dimensiones", value: "50 × 70 cm" }],
    description: null,
    unit_price_cop: null,
    line_total_cop: "83300",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    quotation_id: QUOTATION_ID,
    position: 2,
    source: "custom",
    title: "Medio metro de lámina sublimada",
    quantity: "2",
    details: [],
    description: "Medio metro de lámina sublimada",
    unit_price_cop: "58350",
    line_total_cop: "116700",
  },
];

function authenticatedAuth() {
  return {
    getClaims: vi.fn(async () => ({
      data: { claims: { sub: USER_ID } },
      error: null,
    })),
  };
}

describe("quotation repository", () => {
  it("saves the complete safe snapshot through one RPC call", async () => {
    const rpc = vi.fn(async () => ({ data: QUOTATION_ID, error: null }));
    const from = vi.fn();
    const repository = createSupabaseQuotationRepository({
      auth: authenticatedAuth(),
      rpc,
      from,
    } as unknown as Pick<SupabaseClient, "auth" | "rpc" | "from">);

    const result = await repository.save(SNAPSHOT);

    expect(result).toEqual({ ok: true, value: QUOTATION_ID });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("save_quotation_snapshot", {
      snapshot: SNAPSHOT,
    });
    expect(from).not.toHaveBeenCalled();
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("Costo interno");
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("supplier");
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("margin");
  });

  it("rejects malformed totals before calling the database", async () => {
    const rpc = vi.fn();
    const repository = createSupabaseQuotationRepository({
      auth: authenticatedAuth(),
      rpc,
      from: vi.fn(),
    } as unknown as Pick<SupabaseClient, "auth" | "rpc" | "from">);

    const result = await repository.save({ ...SNAPSHOT, totalCop: 200_001 });

    expect(result).toEqual({
      ok: false,
      kind: "invalid",
      message: QUOTATION_SAVE_FAILURE_MESSAGE,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("lists newest saved quotations first with a bounded request", async () => {
    const rows = [
      {
        id: QUOTATION_ID,
        quotation_date: "2026-09-24",
        customer_name: "Empresa Nueva SAS",
        total_cop: "200000",
        created_at: "2026-09-24T14:30:00.000Z",
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        quotation_date: "2026-09-23",
        customer_name: null,
        total_cop: 50_000,
        created_at: "2026-09-23T14:30:00.000Z",
      },
    ];
    const limit = vi.fn(async () => ({ data: rows, error: null }));
    const order = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ order }));
    const repository = createSupabaseQuotationRepository({
      auth: authenticatedAuth(),
      rpc: vi.fn(),
      from: vi.fn(() => ({ select })),
    } as unknown as Pick<SupabaseClient, "auth" | "rpc" | "from">);

    const result = await repository.list();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((quotation) => quotation.id)).toEqual([
        rows[0].id,
        rows[1].id,
      ]);
    }
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(QUOTATION_HISTORY_LIMIT);
  });

  it("loads one header plus its ordered lines as an immutable historical snapshot", async () => {
    const headerSingle = vi.fn(async () => ({ data: HEADER_ROW, error: null }));
    const headerEq = vi.fn(() => ({ single: headerSingle }));
    const headerSelect = vi.fn(() => ({ eq: headerEq }));
    const lineOrder = vi.fn(async () => ({ data: LINE_ROWS, error: null }));
    const lineEq = vi.fn(() => ({ order: lineOrder }));
    const lineSelect = vi.fn(() => ({ eq: lineEq }));
    const from = vi.fn((table: string) =>
      table === "quotations" ? { select: headerSelect } : { select: lineSelect },
    );
    const repository = createSupabaseQuotationRepository({
      auth: authenticatedAuth(),
      rpc: vi.fn(),
      from,
    } as unknown as Pick<SupabaseClient, "auth" | "rpc" | "from">);

    const result = await repository.load(QUOTATION_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatchObject({
        id: QUOTATION_ID,
        ...SNAPSHOT,
        createdBy: USER_ID,
      });
      expect(result.value.lines[1]).toMatchObject({
        source: "custom",
        quantity: 2,
        unitPriceCop: 58_350,
        lineTotalCop: 116_700,
      });
    }
    expect(lineOrder).toHaveBeenCalledWith("position", { ascending: true });
  });

  it("refuses missing or reordered line snapshots instead of repairing them", () => {
    expect(() =>
      mapHistoricalQuotationRows(HEADER_ROW, [LINE_ROWS[1], LINE_ROWS[0]]),
    ).toThrow("ordering");
  });

  it("returns safe Spanish errors without provider details", async () => {
    const limit = vi.fn(async () => ({
      data: null,
      error: new Error("postgres-private-history-detail"),
    }));
    const order = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ order }));
    const repository = createSupabaseQuotationRepository({
      auth: authenticatedAuth(),
      rpc: vi.fn(async () => ({
        data: null,
        error: new Error("postgres-private-save-detail"),
      })),
      from: vi.fn(() => ({ select })),
    } as unknown as Pick<SupabaseClient, "auth" | "rpc" | "from">);

    const saveResult = await repository.save(SNAPSHOT);
    const listResult = await repository.list();

    expect(saveResult).toMatchObject({
      ok: false,
      message: QUOTATION_SAVE_FAILURE_MESSAGE,
    });
    expect(listResult).toEqual({
      ok: false,
      kind: "list",
      message: QUOTATION_LOAD_FAILURE_MESSAGE,
    });
    expect(JSON.stringify([saveResult, listResult])).not.toContain(
      "postgres-private",
    );
  });

  it("handles an expired session before any quotation access", async () => {
    const rpc = vi.fn();
    const from = vi.fn();
    const repository = createSupabaseQuotationRepository({
      auth: {
        getClaims: vi.fn(async () => ({
          data: { claims: null },
          error: new Error("expired-token-private-detail"),
        })),
      },
      rpc,
      from,
    } as unknown as Pick<SupabaseClient, "auth" | "rpc" | "from">);

    expect(await repository.save(SNAPSHOT)).toEqual({
      ok: false,
      kind: "unauthenticated",
      message: QUOTATION_SESSION_FAILURE_MESSAGE,
    });
    expect(await repository.load(QUOTATION_ID)).toEqual({
      ok: false,
      kind: "unauthenticated",
      message: QUOTATION_SESSION_FAILURE_MESSAGE,
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("uses a dedicated safe error when a stored quotation cannot be opened", async () => {
    const single = vi.fn(async () => ({
      data: null,
      error: new Error("constraint-private-name"),
    }));
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    const repository = createSupabaseQuotationRepository({
      auth: authenticatedAuth(),
      rpc: vi.fn(),
      from: vi.fn(() => ({ select })),
    } as unknown as Pick<SupabaseClient, "auth" | "rpc" | "from">);

    const result = await repository.load(QUOTATION_ID);

    expect(result).toEqual({
      ok: false,
      kind: "load",
      message: QUOTATION_OPEN_FAILURE_MESSAGE,
    });
    expect(JSON.stringify(result)).not.toContain("constraint-private");
  });
});
