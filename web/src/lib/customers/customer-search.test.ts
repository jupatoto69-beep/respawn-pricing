import { describe, expect, it } from "vitest";

import type { Customer } from "./customer";
import { filterCustomers } from "./customer-search";

const CUSTOMERS: readonly Customer[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Café Galáctico SAS",
    document: "900111222-3",
    phoneCountryIso2: "CO",
    phoneNumber: "3205550101",
    email: "hola@cafe-galactico.example",
    city: "Ciudad Ficción",
    createdAt: "2026-09-15T12:00:00.000Z",
    updatedAt: "2026-09-15T12:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Taller Nebulosa",
    document: null,
    phoneCountryIso2: null,
    phoneNumber: null,
    email: "contacto@taller-nebulosa.example",
    city: null,
    createdAt: "2026-09-15T13:00:00.000Z",
    updatedAt: "2026-09-15T13:00:00.000Z",
  },
];

describe("filterCustomers", () => {
  it.each([
    ["cafe", "Café Galáctico SAS"],
    ["900111", "Café Galáctico SAS"],
    ["5550101", "Café Galáctico SAS"],
    ["NEBULOSA.EXAMPLE", "Taller Nebulosa"],
  ])("searches %s across practical identity fields", (query, expectedName) => {
    expect(filterCustomers(CUSTOMERS, query).map((customer) => customer.name)).toEqual([
      expectedName,
    ]);
  });

  it("returns all customers for a blank query and an empty result for no match", () => {
    expect(filterCustomers(CUSTOMERS, "   ")).toBe(CUSTOMERS);
    expect(filterCustomers(CUSTOMERS, "sin coincidencias")).toEqual([]);
  });
});
