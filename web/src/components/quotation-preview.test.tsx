import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "@/lib/quotation/business-profile";
import { createQuotationPreviewViewModel } from "@/lib/quotation/quotation-preview-view-model";
import { createCustomQuotationLineDraft } from "@/lib/pricing/custom-quotation-line";
import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
  updateQuotationDetails,
} from "@/lib/pricing/temporary-quotation";

import {
  QuotationPreview,
  showFailedQuotationPreviewLogoFallback,
} from "./quotation-preview";
import {
  QuotationPdfDownloadButton,
  QuotationPreviewModal,
} from "./quotation-preview-modal";

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
  }, new Date(2026, 7, 9, 23, 59, 59));

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
  const preview = createQuotationPreviewViewModel({
    quotation,
    total: calculateQuotationTotal(quotation),
    businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
  });

  return renderToStaticMarkup(
    <QuotationPreview
      preview={preview}
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
    expect(markup).toContain("Fecha");
    expect(markup).toContain("09/08/2026");
    expect(markup).toContain("Vigencia");
    expect(markup).toContain("15 días");
    expect(markup).toContain("Banner");
    expect(markup).toContain("Mantenimiento completo");
    expect(markup).toContain("COP 768.000");
    expect(markup).toContain("COP 888.000");
    expect(markup).toMatch(/<ol[^>]*>[\s\S]*<article>/);
  });

  it("renders a customer-safe 3D printing line from its stored snapshot", () => {
    const quotation = addQuotationLine(createEmptyQuotation(), {
      source: "service",
      title: "Impresión 3D",
      quantity: 3,
      details: [
        { label: "Material", value: "PLA" },
        { label: "Gramos por unidad", value: "100 g" },
        { label: "Tiempo de impresión por unidad", value: "1 h 30 min" },
        { label: "Modelado", value: "Diseño básico" },
        { label: "Costo base", value: "Privado" },
        { label: "Umbral", value: "Privado" },
      ],
      lineTotal: 262_500,
    }, new Date(2026, 7, 11, 12));
    const markup = renderPreview(quotation);

    expect(markup).toContain("Impresión 3D");
    expect(markup).toContain("PLA");
    expect(markup).toContain("100 g");
    expect(markup).toContain("1 h 30 min");
    expect(markup).toContain("Diseño básico");
    expect(markup).toContain("COP 262.500");
    expect(markup).toContain("11/08/2026");
    expect(markup).toContain("15 días");
    expect(markup).not.toContain("Costo base");
    expect(markup).not.toContain("Umbral");
  });

  it("renders a custom item description, quantity, unit price and exact total", () => {
    const quotation = addQuotationLine(
      createEmptyQuotation(),
      createCustomQuotationLineDraft({
        description: "Medio metro de lámina sublimada",
        quantity: 3,
        unitPriceCop: 58_000,
      }),
    );
    const markup = renderPreview(quotation);

    expect(markup).toContain("Medio metro de lámina sublimada");
    expect(markup).toContain("Cantidad");
    expect(markup).toContain(">3</dd>");
    expect(markup).toContain("Precio unitario");
    expect(markup).toContain('data value="58000"');
    expect(markup).toContain("COP 58.000");
    expect(markup).toContain('data value="174000"');
    expect(markup).toContain("COP 174.000");
  });

  it("keeps a preliminary 3D warning visibly associated with its line", () => {
    const quotation = addQuotationLine(createEmptyQuotation(), {
      source: "service",
      title: "Impresión 3D — Estimación preliminar",
      quantity: 3,
      details: [
        { label: "Tipo", value: "Estimación preliminar" },
        { label: "Tamaño aproximado", value: "15 cm" },
        { label: "Descripción", value: "Figura decorativa" },
        { label: "Material", value: "PLA" },
        { label: "Modelado", value: "Modelo con IA / asistido por IA" },
        { label: "Tipo de impresión", value: "Multicolor" },
        { label: "Producción", value: "HI" },
        {
          label: "Condición",
          value:
            "Valor estimado. El precio definitivo puede cambiar después de recibir y laminar el archivo 3D.",
        },
      ],
      lineTotal: 80_000,
    });
    const markup = renderPreview(quotation);

    expect(markup).toContain(
      "<h4>Impresión 3D — Estimación preliminar</h4>",
    );
    expect(markup).toContain("Figura decorativa");
    expect(markup).toContain("Producción");
    expect(markup).toContain("HI");
    expect(markup).toContain("lineCondition");
    expect(markup).toContain(
      "Valor estimado. El precio definitivo puede cambiar después de recibir y laminar el archivo 3D.",
    );
    expect(markup).toContain("COP 80.000");
  });

  it("uses the official white logo proportionally without a redundant visible business name", () => {
    const markup = renderPreview();

    expect(markup).toContain(
      'src="/brand/digital-respawn-logo-white.png"',
    );
    expect(markup).toContain('alt="Logo de Digital Respawn"');
    expect(markup).toMatch(
      /<p[^>]*hidden="">Digital Respawn<\/p>/u,
    );
    const width = Number(markup.match(/width="(\d+)"/u)?.[1]);
    const height = Number(markup.match(/height="(\d+)"/u)?.[1]);

    expect(width).toBeGreaterThan(height);
    expect(width / height).toBeGreaterThan(3);
    expect(width).not.toBe(height);
  });

  it("reveals the business name fallback and hides an inaccessible failed logo", () => {
    const image = { alt: "Logo de Digital Respawn", hidden: false };
    const fallback = { hidden: true };

    showFailedQuotationPreviewLogoFallback(image, fallback);

    expect(image.hidden).toBe(true);
    expect(image.alt).toBe("");
    expect(fallback.hidden).toBe(false);
    expect(renderPreview()).toContain(">Digital Respawn</p>");
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
    const preview = createQuotationPreviewViewModel({
      quotation,
      total: calculateQuotationTotal(quotation),
      businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
    });
    const markup = renderToStaticMarkup(
      <QuotationPreviewModal
        isOpen
        preview={preview}
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
    expect(markup).toContain("Descargar PDF</button>");
    expect(markup).toContain('aria-busy="false"');
  });

  it("does not render the dialog while closed", () => {
    const quotation = createFictionalQuotation();
    const preview = createQuotationPreviewViewModel({
      quotation,
      total: calculateQuotationTotal(quotation),
      businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
    });
    const markup = renderToStaticMarkup(
      <QuotationPreviewModal
        isOpen={false}
        preview={preview}
        returnFocusRef={createRef<HTMLButtonElement>()}
        onRequestClose={() => undefined}
      />,
    );

    expect(markup).toBe("");
    expect(markup).not.toContain("Descargar PDF");
  });

  it("renders an accessible disabled busy state without another action", () => {
    const markup = renderToStaticMarkup(
      <QuotationPdfDownloadButton
        isGenerating
        hasLines
        onClick={() => undefined}
      />,
    );

    expect(markup).toContain("Generando PDF…");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("disabled");
    expect(markup).not.toContain("Descargar PDF");
  });
});
