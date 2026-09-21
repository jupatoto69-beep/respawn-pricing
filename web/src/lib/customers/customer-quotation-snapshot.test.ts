import { describe, expect, it } from "vitest";

import {
  createEmptyQuotation,
  updateQuotationDetails,
} from "@/lib/pricing/temporary-quotation";

import type { Customer } from "./customer";
import { applyCustomerSnapshotToQuotation } from "./customer-quotation-snapshot";

const CUSTOMER: Customer = {
  id: "20000000-0000-4000-8000-000000000001",
  name: "Laboratorio Cometa SAS",
  document: "900333222-1",
  phoneCountryIso2: "CO",
  phoneNumber: "3155550102",
  email: "contacto@laboratorio-cometa.example",
  city: "Ciudad Imaginaria",
  createdAt: "2026-09-15T12:00:00.000Z",
  updatedAt: "2026-09-15T12:00:00.000Z",
};

describe("customer quotation snapshot", () => {
  it("copies persisted customer fields and excludes quotation notes", () => {
    const quotation = updateQuotationDetails(createEmptyQuotation(), {
      notes: "Entregar en horario ficticio.",
    });

    const selected = applyCustomerSnapshotToQuotation(quotation, CUSTOMER);

    expect(selected.details).toEqual({
      customerName: CUSTOMER.name,
      customerDocument: CUSTOMER.document,
      customerPhoneCountryIso2: CUSTOMER.phoneCountryIso2,
      customerPhoneNumber: CUSTOMER.phoneNumber,
      customerEmail: CUSTOMER.email,
      customerCity: CUSTOMER.city,
      notes: "Entregar en horario ficticio.",
    });
    expect(JSON.stringify(CUSTOMER)).not.toContain("notes");
  });

  it("does not mutate an existing quotation when the persistent record is edited", () => {
    const selected = applyCustomerSnapshotToQuotation(
      createEmptyQuotation(),
      CUSTOMER,
    );
    const editedCustomer: Customer = {
      ...CUSTOMER,
      name: "Laboratorio Cometa Renovado SAS",
      email: "nuevo@laboratorio-cometa.example",
      updatedAt: "2026-09-15T14:00:00.000Z",
    };

    expect(selected.details.customerName).toBe("Laboratorio Cometa SAS");
    expect(selected.details.customerEmail).toBe(
      "contacto@laboratorio-cometa.example",
    );

    const deliberatelyReloaded = applyCustomerSnapshotToQuotation(
      selected,
      editedCustomer,
    );
    expect(deliberatelyReloaded.details.customerName).toBe(
      "Laboratorio Cometa Renovado SAS",
    );
  });

  it("maps absent optional values to manual-entry-compatible empty fields", () => {
    const selected = applyCustomerSnapshotToQuotation(createEmptyQuotation(), {
      ...CUSTOMER,
      document: null,
      phoneCountryIso2: null,
      phoneNumber: null,
      email: null,
      city: null,
    });

    expect(selected.details).toMatchObject({
      customerDocument: "",
      customerPhoneCountryIso2: "CO",
      customerPhoneNumber: "",
      customerEmail: "",
      customerCity: "",
    });
  });
});
