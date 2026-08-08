import { describe, expect, it } from "vitest";

import { createQuotationPdfFilename } from "./quotation-pdf-filename";

describe("quotation PDF filename", () => {
  it("creates the expected filename for Empresa Ejemplo SAS", () => {
    expect(createQuotationPdfFilename("Empresa Ejemplo SAS")).toBe(
      "cotizacion-empresa-ejemplo-sas.pdf",
    );
  });

  it.each([
    ["  Compañía Ágil Ñandú  ", "cotizacion-compania-agil-nandu.pdf"],
    ["Empresa    Ejemplo", "cotizacion-empresa-ejemplo.pdf"],
    ["Empresa---Ejemplo", "cotizacion-empresa-ejemplo.pdf"],
    ['Empresa<>:"/\\|?*Ejemplo', "cotizacion-empresa-ejemplo.pdf"],
    ["///Empresa\\Ejemplo///", "cotizacion-empresa-ejemplo.pdf"],
    ["Empresa:Ejemplo*Final?", "cotizacion-empresa-ejemplo-final.pdf"],
    ['Empresa "Ejemplo" | SAS', "cotizacion-empresa-ejemplo-sas.pdf"],
    ["--- Empresa Ejemplo ---", "cotizacion-empresa-ejemplo.pdf"],
    ["Empresa Ejemplo.pdf", "cotizacion-empresa-ejemplo.pdf"],
    ["Empresa Ejemplo.PDF", "cotizacion-empresa-ejemplo.pdf"],
  ])("normalizes %s safely", (input, expected) => {
    expect(createQuotationPdfFilename(input)).toBe(expected);
  });

  it.each(["", "   ", '<>:"/\\|?*', "---///---"])(
    "uses the Digital Respawn fallback for an empty basename",
    (input) => {
      expect(createQuotationPdfFilename(input)).toBe(
        "cotizacion-digital-respawn.pdf",
      );
    },
  );

  it("receives only the name and cannot include other quotation information", () => {
    const filename = createQuotationPdfFilename("Empresa Ejemplo SAS");

    expect(filename).toMatch(/\.pdf$/u);
    expect(filename.match(/\.pdf/giu)).toHaveLength(1);
    expect(filename).not.toContain("900123456-7");
    expect(filename).not.toContain("3229699093");
    expect(filename).not.toContain("cotizaciones@example.com");
    expect(filename).not.toContain("fusagasuga");
    expect(filename).not.toContain("quotation-line");
  });

  it("does not mutate its input", () => {
    const input = "  Empresa Ejemplo SAS.pdf  ";
    const before = input;

    createQuotationPdfFilename(input);

    expect(input).toBe(before);
  });
});
