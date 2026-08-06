import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
  createEmptyQuotationDetails,
  updateQuotationDetails,
  updateQuotationPhoneCountry,
  type TemporaryQuotationTextDetailField,
} from "@/lib/pricing/temporary-quotation";
import { validateTemporaryQuotationDetails } from "@/lib/pricing/temporary-quotation-details-validation";
import {
  PHONE_COUNTRY_DEFINITIONS,
  type PhoneCountryIso2,
} from "@/lib/pricing/phone-country-catalog";

import {
  TemporaryQuotation,
  TemporaryQuotationDetailsForm,
} from "./temporary-quotation";

const noop = () => undefined;
const noopUpdate: (
  field: TemporaryQuotationTextDetailField,
  value: string,
) => void = () => undefined;
const noopCountryUpdate: (countryIso2: PhoneCountryIso2) => void = () =>
  undefined;

describe("TemporaryQuotation", () => {
  it("renders editable quotation details in the empty state", () => {
    const quotation = createEmptyQuotation();
    const markup = renderToStaticMarkup(
      <TemporaryQuotation
        quotation={quotation}
        total={calculateQuotationTotal(quotation)}
        onUpdateDetail={noopUpdate}
        onUpdatePhoneCountry={noopCountryUpdate}
        onRemoveLine={noop}
        onClear={noop}
      />,
    );

    expect(markup).toContain("Cotización temporal");
    expect(markup).toContain("Datos de la cotización");
    expect(markup).toContain(
      "Esta información es temporal y se perderá al recargar la página.",
    );
    expect(markup).toContain("Nombre o empresa");
    expect(markup).toContain("Documento o NIT");
    expect(markup).toContain("País o código telefónico");
    expect(markup).toContain("Teléfono");
    expect(markup).toContain("Correo electrónico");
    expect(markup).toContain("Ciudad");
    expect(markup).toContain("Observaciones generales");
    expect(markup).toMatch(/<input[^>]*type="text"[^>]*name="customerName"/);
    expect(markup).toMatch(/<input[^>]*type="text"[^>]*name="customerDocument"/);
    expect(markup).toMatch(
      /<select[^>]*name="customerPhoneCountryIso2"[^>]*>/,
    );
    expect(markup).toMatch(
      /<input[^>]*type="tel"[^>]*name="customerPhoneNumber"/,
    );
    expect(markup).toMatch(/<input[^>]*type="email"[^>]*name="customerEmail"/);
    expect(markup).toMatch(/<input[^>]*type="text"[^>]*name="customerCity"/);
    expect(markup).toMatch(/<textarea[^>]*name="notes"/);
    expect(markup).toContain('autoComplete="organization"');
    expect(markup).toContain('autoComplete="off"');
    expect(markup).toContain('autoComplete="tel-national"');
    expect(markup).toContain('autoComplete="email"');
    expect(markup).toContain('autoComplete="address-level2"');
    expect(markup).toContain('inputMode="numeric"');
    expect(markup).toContain('<option value="CO" selected="">Colombia (+57)</option>');
    for (const country of PHONE_COUNTRY_DEFINITIONS) {
      expect(markup).toContain(
        `<option value="${country.iso2}"${country.iso2 === "CO" ? ' selected=""' : ""}>${country.name} (${country.callingCode})</option>`,
      );
    }
    expect(markup).not.toContain("maxLength=");
    expect(markup).not.toContain("aria-invalid");
    expect(markup).toContain("Aún no has agregado productos o servicios.");
    expect(markup).not.toContain("Vaciar cotización");
  });

  it("renders fictional values and a clear action without quotation lines", () => {
    const quotation = updateQuotationDetails(createEmptyQuotation(), {
      customerName: "Empresa Ejemplo SAS",
      customerDocument: "900123456-7",
      customerPhoneNumber: "3229699093",
      customerEmail: "cotizaciones@example.com",
      customerCity: "Fusagasugá",
      notes: "Entregar durante la próxima semana.",
    });
    const markup = renderToStaticMarkup(
      <TemporaryQuotation
        quotation={quotation}
        total={calculateQuotationTotal(quotation)}
        onUpdateDetail={noopUpdate}
        onUpdatePhoneCountry={noopCountryUpdate}
        onRemoveLine={noop}
        onClear={noop}
      />,
    );

    expect(markup).toContain('value="Empresa Ejemplo SAS"');
    expect(markup).toContain('value="900123456-7"');
    expect(markup).toContain('value="3229699093"');
    expect(markup).toContain('value="cotizaciones@example.com"');
    expect(markup).toContain('value="Fusagasugá"');
    expect(markup).toContain("Entregar durante la próxima semana.");
    expect(markup).toContain("Aún no has agregado productos o servicios.");
    expect(markup).toContain("Vaciar cotización");
    expect(markup).not.toContain("Total general");
  });

  it("does not render the clear action for a country without a number", () => {
    const quotation = updateQuotationPhoneCountry(
      createEmptyQuotation(),
      "ES",
    );
    const markup = renderToStaticMarkup(
      <TemporaryQuotation
        quotation={quotation}
        total={calculateQuotationTotal(quotation)}
        onUpdateDetail={noopUpdate}
        onUpdatePhoneCountry={noopCountryUpdate}
        onRemoveLine={noop}
        onClear={noop}
      />,
    );

    expect(markup).toContain('<option value="ES" selected="">España (+34)</option>');
    expect(markup).not.toContain("Vaciar cotización");
  });

  it("renders field errors with visible text and associated ARIA attributes", () => {
    const details = {
      ...createEmptyQuotationDetails(),
      customerDocument: "900.123.456",
      customerPhoneNumber: "+57 3229699093",
    };
    const markup = renderToStaticMarkup(
      <TemporaryQuotationDetailsForm
        details={details}
        idPrefix="quotation-details"
        errors={validateTemporaryQuotationDetails(details)}
        onChange={noop}
        onPhoneCountryChange={noop}
        onBlur={noop}
      />,
    );
    const documentInput = markup.match(
      /<input[^>]*name="customerDocument"[^>]*>/,
    )?.[0];
    const phoneInput = markup.match(
      /<input[^>]*name="customerPhoneNumber"[^>]*>/,
    )?.[0];

    expect(documentInput).toContain('aria-invalid="true"');
    expect(documentInput).toContain(
      'aria-describedby="quotation-details-customer-document-error"',
    );
    expect(phoneInput).toContain('aria-invalid="true"');
    expect(phoneInput).toContain(
      'aria-describedby="quotation-details-customer-phone-error"',
    );
    expect(markup).toContain(
      'id="quotation-details-customer-document-error"',
    );
    expect(markup).toContain('id="quotation-details-customer-phone-error"');
    expect(markup).toContain("<strong>Error:</strong>");
    expect(markup).toContain(
      "El documento o NIT solo puede contener dígitos, espacios y guiones.",
    );
    expect(markup).toContain(
      "El teléfono debe escribirse sin código de país, espacios ni símbolos; usa únicamente dígitos del 0 al 9.",
    );
  });

  it("renders lines, safe details, removal controls and the exact total", () => {
    const withDetails = updateQuotationDetails(createEmptyQuotation(), {
      customerName: "Empresa Ejemplo SAS",
      customerEmail: "cotizaciones@example.com",
      notes: "Entregar durante la próxima semana.",
    });
    const first = addQuotationLine(withDetails, {
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
        onUpdateDetail={noopUpdate}
        onUpdatePhoneCountry={noopCountryUpdate}
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
    const lineListMarkup = markup.match(/<ol[^>]*>([\s\S]*?)<\/ol>/)?.[1];
    expect(lineListMarkup).toBeDefined();
    expect(lineListMarkup).not.toContain("Empresa Ejemplo SAS");
    expect(lineListMarkup).not.toContain("cotizaciones@example.com");
    expect(lineListMarkup).not.toContain(
      "Entregar durante la próxima semana.",
    );
  });
});
