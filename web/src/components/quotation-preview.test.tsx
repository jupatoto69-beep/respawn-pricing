import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "@/lib/quotation/business-profile";
import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
  updateQuotationDetails,
} from "@/lib/pricing/temporary-quotation";

import { QuotationPreview } from "./quotation-preview";
import { QuotationPreviewModal } from "./quotation-preview-modal";

function createFictionalQuotation() {
  const withDetails = updateQuotationDetails(createEmptyQuotation(), {
    customerName: "Empresa Ejemplo SAS",
    customerDocument: "0900123456-7",
    customerPhoneCountryIso2: "CO",
    customerPhoneNumber: "3229699093",
    customerEmail: "cotizaciones@example.com",
    customerCity: "Fusagasugá",
    notes: "Primera línea\n\nÚltima línea",
  });
  const banner = addQuotationLine(withDetails, {
    source: "area-product",
    title: "Banner",
    quantity: 1,
    details: [
      { label: "Producto", value: "Banner" },
      { label: "Dimensiones", value: "80 × 300 cm" },
    ],
    lineTotal: 768_000,
  });

  return addQuotationLine(banner, {
    source: "service",
    title: "Mantenimiento completo",
    quantity: 1,
    details: [{ label: "Paquete", value: "Mantenimiento completo" }],
    lineTotal: 120_000,
  });
}

function renderPreview(
  quotation = createFictionalQuotation(),
): string {
  return renderToStaticMarkup(
    <QuotationPreview
      quotation={quotation}
      total={calculateQuotationTotal(quotation)}
      businessProfile={DIGITAL_RESPAWN_BUSINESS_PROFILE}
      headingId="quotation-preview-title"
    />,
  );
}

describe("QuotationPreview", () => {
  it("renders the formal header, customer data, lines and exact total", () => {
    const markup = renderPreview();

    expect(markup).toContain("Digital Respawn");
    expect(markup).toContain(
      '<h2 id="quotation-preview-title">Cotización</h2>',
    );
    expect(markup).toContain("Datos del cliente");
    expect(markup).toContain("Empresa Ejemplo SAS");
    expect(markup).toContain("0900123456-7");
    expect(markup).toContain("+57 3229699093");
    expect(markup).toContain("Banner");
    expect(markup).toContain("Mantenimiento completo");
    expect(markup).toContain("COP 768.000");
    expect(markup).toContain("COP 888.000");
    expect(markup).toMatch(/<ol[^>]*>[\s\S]*<article>/);
  });

  it("omits the customer section and unconfigured business fields", () => {
    const quotation = addQuotationLine(createEmptyQuotation(), {
      source: "service",
      title: "Servicio de ejemplo",
      quantity: 1,
      details: [{ label: "Servicio", value: "Servicio de ejemplo" }],
      lineTotal: 70_000,
    });
    const markup = renderPreview(quotation);

    expect(markup).not.toContain("Datos del cliente");
    expect(markup).not.toContain("Razón social");
    expect(markup).not.toContain("Dirección");
    expect(markup).not.toContain("N/A");
    expect(markup).not.toContain("undefined");
    expect(markup).not.toContain("null");
  });

  it("renders multiline notes and omits whitespace-only notes", () => {
    const multilineMarkup = renderPreview();
    const whitespaceQuotation = addQuotationLine(
      updateQuotationDetails(createEmptyQuotation(), { notes: " \n\t " }),
      {
        source: "service",
        title: "Servicio de ejemplo",
        quantity: 1,
        details: [],
        lineTotal: 70_000,
      },
    );
    const whitespaceMarkup = renderPreview(whitespaceQuotation);

    expect(multilineMarkup).toContain("Observaciones");
    expect(multilineMarkup).toContain("Primera línea\n\nÚltima línea");
    expect(whitespaceMarkup).not.toContain("Observaciones");
  });

  it("lets React escape customer-entered text", () => {
    const quotation = addQuotationLine(
      updateQuotationDetails(createEmptyQuotation(), {
        customerName: '<script>alert("x")</script>',
      }),
      {
        source: "service",
        title: "Servicio de ejemplo",
        quantity: 1,
        details: [],
        lineTotal: 70_000,
      },
    );
    const markup = renderPreview(quotation);

    expect(markup).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(markup).not.toContain('<script>alert("x")</script>');
  });

  it("does not render internal or future actions", () => {
    const markup = renderPreview();

    for (const forbiddenText of [
      "Herramienta interna",
      "Descargar",
      "PDF",
      "Imprimir",
      "Compartir",
      "WhatsApp",
      "Enviar por correo",
    ]) {
      expect(markup).not.toContain(forbiddenText);
    }
  });
});

describe("QuotationPreviewModal", () => {
  it("renders a labelled modal dialog and an accessible close button", () => {
    const quotation = createFictionalQuotation();
    const markup = renderToStaticMarkup(
      <QuotationPreviewModal
        isOpen
        quotation={quotation}
        total={calculateQuotationTotal(quotation)}
        businessProfile={DIGITAL_RESPAWN_BUSINESS_PROFILE}
        returnFocusRef={createRef<HTMLButtonElement>()}
        onRequestClose={() => undefined}
      />,
    );
    const headingId = markup.match(/aria-labelledby="([^"]+)"/)?.[1];

    expect(markup).toContain("<dialog");
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(headingId).toBeDefined();
    expect(markup).toContain(`<h2 id="${headingId}">Cotización</h2>`);
    expect(markup).toContain(
      'aria-label="Cerrar vista previa de la cotización"',
    );
    expect(markup).toContain("Cerrar</button>");
  });

  it("does not render the dialog while closed", () => {
    const quotation = createFictionalQuotation();
    const markup = renderToStaticMarkup(
      <QuotationPreviewModal
        isOpen={false}
        quotation={quotation}
        total={calculateQuotationTotal(quotation)}
        businessProfile={DIGITAL_RESPAWN_BUSINESS_PROFILE}
        returnFocusRef={createRef<HTMLButtonElement>()}
        onRequestClose={() => undefined}
      />,
    );

    expect(markup).toBe("");
  });
});
