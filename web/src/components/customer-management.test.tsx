import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CustomerManagement } from "./customer-management";

describe("CustomerManagement", () => {
  it("renders the practical Spanish customer workflow without customer data", () => {
    const markup = renderToStaticMarkup(
      <CustomerManagement onSelectCustomer={vi.fn()} />,
    );

    expect(markup).toContain("Clientes");
    expect(markup).toContain("Nuevo cliente");
    expect(markup).toContain(
      "Buscar por nombre, documento, teléfono o correo",
    );
    expect(markup).toContain("Cargando clientes");
    expect(markup).not.toContain("Observaciones");
  });
});
