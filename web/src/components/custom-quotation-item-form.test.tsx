import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createCustomQuotationLineDraft } from "@/lib/pricing/custom-quotation-line";
import {
  addQuotationLine,
  createEmptyQuotation,
} from "@/lib/pricing/temporary-quotation";

import {
  createCustomQuotationItemFormValuesFromLine,
  CustomQuotationItemForm,
} from "./custom-quotation-item-form";

describe("CustomQuotationItemForm", () => {
  it("renders the Spanish add flow with practical integer COP inputs", () => {
    const markup = renderToStaticMarkup(
      <CustomQuotationItemForm onSubmit={() => undefined} />,
    );

    expect(markup).toContain("Ítem personalizado");
    expect(markup).toContain(
      "Agrega productos o servicios con precio conocido que no estén disponibles en los módulos de Respawn Pricing.",
    );
    expect(markup).toContain("Descripción");
    expect(markup).toContain("Cantidad");
    expect(markup).toContain("Precio unitario");
    expect(markup).toContain("Total calculado");
    expect(markup).toContain("Agregar a cotización");
    expect(markup).toContain('name="description"');
    expect(markup).toContain('name="quantity"');
    expect(markup).toContain('name="unitPriceCop"');
    expect(markup.match(/inputMode="numeric"/gu)).toHaveLength(2);
    expect(markup).toContain("solo con números y sin separadores");
    expect(markup).not.toContain("Costo interno");
    expect(markup).not.toContain("Margen");
    expect(markup).not.toContain("Proveedor");
  });

  it("renders an existing custom snapshot for editing with Cancel", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createCustomQuotationLineDraft({
        description: "Medio metro de lámina sublimada",
        quantity: 3,
        unitPriceCop: 58_000,
      }),
    );
    const line = quotation.lines[0];

    if (line.source !== "custom") {
      throw new Error("Expected a custom quotation line.");
    }

    const markup = renderToStaticMarkup(
      <CustomQuotationItemForm
        initialLine={line}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );

    expect(createCustomQuotationItemFormValuesFromLine(line)).toEqual({
      description: "Medio metro de lámina sublimada",
      quantity: "3",
      unitPriceCop: "58000",
    });
    expect(markup).toContain("Editar ítem personalizado");
    expect(markup).toContain('value="Medio metro de lámina sublimada"');
    expect(markup).toContain('value="3"');
    expect(markup).toContain('value="58000"');
    expect(markup).toContain("COP 174.000");
    expect(markup).toContain("Guardar cambios");
    expect(markup).toContain("Cancelar");
  });
});
