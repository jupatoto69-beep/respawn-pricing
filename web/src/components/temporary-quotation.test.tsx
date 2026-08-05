import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
} from "@/lib/pricing/temporary-quotation";

import { TemporaryQuotation } from "./temporary-quotation";

const noop = () => undefined;

describe("TemporaryQuotation", () => {
  it("renders the required empty state", () => {
    const quotation = createEmptyQuotation();
    const markup = renderToStaticMarkup(
      <TemporaryQuotation
        quotation={quotation}
        total={calculateQuotationTotal(quotation)}
        onRemoveLine={noop}
        onClear={noop}
      />,
    );

    expect(markup).toContain("Cotización temporal");
    expect(markup).toContain("Aún no has agregado productos o servicios.");
    expect(markup).not.toContain("Vaciar cotización");
  });

  it("renders lines, safe details, removal controls and the exact total", () => {
    const first = addQuotationLine(createEmptyQuotation(), {
      source: "area-product",
      title: "Banner",
      quantity: 1,
      details: [
        { label: "Dimensiones", value: "80 × 300 cm" },
        { label: "Estructura", value: "Estructura una cara" },
      ],
      lineTotal: 768_000,
    });
    const quotation = addQuotationLine(first, {
      source: "service",
      title: "Mantenimiento de computador",
      quantity: 1,
      details: [{ label: "Paquete", value: "Mantenimiento completo" }],
      lineTotal: 120_000,
    });
    const markup = renderToStaticMarkup(
      <TemporaryQuotation
        quotation={quotation}
        total={calculateQuotationTotal(quotation)}
        onRemoveLine={noop}
        onClear={noop}
      />,
    );

    expect(markup).toContain("2 líneas");
    expect(markup).toContain("Banner");
    expect(markup).toContain("Mantenimiento de computador");
    expect(markup).toContain("COP 888.000");
    expect(markup).toContain(
      "Eliminar Banner de la cotización (línea 1)",
    );
    expect(markup).toContain("Vaciar cotización");
    expect(markup).not.toContain("Confirmar vaciado");
    expect(markup).not.toContain("Mínimo autorizado");
  });
});
