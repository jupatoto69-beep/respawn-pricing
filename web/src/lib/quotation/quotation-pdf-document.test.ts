import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";

import { describe, expect, it, vi } from "vitest";

import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
  updateQuotationDetails,
  type TemporaryQuotationState,
} from "../pricing/temporary-quotation";
import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "./business-profile";
import { generateQuotationPdfBlob } from "./quotation-pdf-document";
import type {
  QuotationPdfLogo,
  QuotationPdfLogoLoader,
} from "./quotation-pdf-logo";
import { readPngDimensions } from "./quotation-pdf-logo";
import { createQuotationPreviewViewModel } from "./quotation-preview-view-model";

async function readBlackLogo(): Promise<QuotationPdfLogo> {
  const bytes = new Uint8Array(
    await readFile(
      new URL(
        "../../../public/brand/digital-respawn-logo-black.png",
        import.meta.url,
      ),
    ),
  );
  const dimensions = readPngDimensions(bytes);

  return Object.freeze({
    bytes,
    format: "PNG" as const,
    width: dimensions.width,
    height: dimensions.height,
  });
}

function addFictionalLine(
  quotation: TemporaryQuotationState,
  index: number,
  longDescription?: string,
): TemporaryQuotationState {
  if (index === 0) {
    return addQuotationLine(quotation, {
      source: "area-product",
      title: "Banner",
      quantity: 1,
      details: [
        { label: "Producto", value: "Banner" },
        { label: "Variante", value: "Estándar sin laminado" },
        { label: "Dimensiones", value: "80 × 300 cm" },
        { label: "Área por unidad", value: "2,4 m²" },
        { label: "Estructura", value: "Una cara" },
        ...(longDescription === undefined
          ? []
          : [{ label: "Descripción", value: longDescription }]),
      ],
      lineTotal: 768_000,
    });
  }

  if (index === 1) {
    return addQuotationLine(quotation, {
      source: "service",
      title: "Instalación de Office únicamente",
      quantity: 1,
      details: [
        { label: "Categoría", value: "Computadores" },
        { label: "Unidad", value: "computador" },
        {
          label: "Servicio",
          value: "Instalación de Office únicamente",
        },
        ...(longDescription === undefined
          ? []
          : [{ label: "Descripción", value: longDescription }]),
      ],
      lineTotal: 50_000,
    });
  }

  const isBanner = index % 2 === 0;
  return addQuotationLine(quotation, {
    source: isBanner ? "area-product" : "service",
    title: isBanner
      ? `Banner adicional ${index + 1}`
      : `Instalación de Office únicamente ${index + 1}`,
    quantity: index + 1,
    details: [
      {
        label: isBanner ? "Producto" : "Servicio",
        value: isBanner ? "Banner" : "Instalación de Office únicamente",
      },
      { label: "Dimensiones", value: "80 × 300 cm" },
      ...(longDescription === undefined
        ? []
        : [{ label: "Descripción", value: longDescription }]),
    ],
    lineTotal: 50_000 + index,
  });
}

function createQuotationPdfTestPreview(options: Readonly<{
  lineCount?: number;
  longContent?: boolean;
  unsafeInternalFields?: boolean;
}> = {}) {
  const longText =
    "Descripción extensa con tildes, ñ, Ñ, ¿preguntas?, multiplicación × y una-palabra-excepcionalmente-larga-sin-espacios-para-validar-el-ajuste ".repeat(
      5,
    );
  let quotation = updateQuotationDetails(createEmptyQuotation(), {
    customerName: options.longContent
      ? `Empresa Ejemplo SAS ${"Nombre prolongado ".repeat(5)}`
      : "Empresa Ejemplo SAS",
    customerDocument: "900123456-7",
    customerPhoneCountryIso2: "CO",
    customerPhoneNumber: "3229699093",
    customerEmail: "cotizaciones@example.com",
    customerCity: "Fusagasugá",
    notes: options.longContent
      ? `Primera línea con tildes y ñ.\n\n${longText}\nÚltima línea con Ñ y ×.`
      : "Entregar durante la próxima semana.\nConfirmar disponibilidad antes de producción.",
  });

  const lineCount = options.lineCount ?? 2;
  for (let index = 0; index < lineCount; index += 1) {
    quotation = addFictionalLine(
      quotation,
      index,
      options.longContent ? longText : undefined,
    );
  }

  if (options.unsafeInternalFields) {
    const firstLine = quotation.lines[0];
    quotation = Object.freeze({
      ...quotation,
      lines: Object.freeze([
        Object.freeze({
          ...firstLine,
          id: "quotation-line-private-77",
          details: Object.freeze([
            ...firstLine.details,
            Object.freeze({ label: "Costo interno", value: "COP 1" }),
            Object.freeze({ label: "Margen", value: "99%" }),
            Object.freeze({ label: "Proveedor", value: "Privado" }),
            Object.freeze({ label: "Mínimo autorizado", value: "COP 2" }),
            Object.freeze({ label: "Descuento máximo", value: "50%" }),
          ]),
        }),
        ...quotation.lines.slice(1),
      ]),
    });
  }

  return createQuotationPreviewViewModel({
    quotation,
    total: calculateQuotationTotal(quotation),
    businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
  });
}

async function getBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function getPdfSource(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("latin1");
}

function countPdfPages(source: string): number {
  return source.match(/\/Type \/Page\b/gu)?.length ?? 0;
}

function extractInflatedStreams(bytes: Uint8Array): string {
  const source = getPdfSource(bytes);
  const chunks: string[] = [];
  const streamPattern = /\/Filter \/FlateDecode[^]*?stream\r?\n/gu;

  for (const match of source.matchAll(streamPattern)) {
    const start = (match.index ?? 0) + match[0].length;
    const endMarker = source.indexOf("endstream", start);
    if (endMarker < 0) {
      continue;
    }

    let end = endMarker;
    while (end > start && (bytes[end - 1] === 10 || bytes[end - 1] === 13)) {
      end -= 1;
    }

    try {
      chunks.push(inflateSync(bytes.slice(start, end)).toString("latin1"));
    } catch {
      // PNG/image streams are not required for inspecting native text operators.
    }
  }

  return chunks.join("\n");
}

function extractFirstImageDisplayRatio(streams: string): number | null {
  const match = streams.match(
    /q\s+([\d.]+) 0 0 ([\d.]+) [\d.]+ [\d.]+ cm\s+\/I\d+ Do\s+Q/u,
  );

  if (match === null) {
    return null;
  }

  return Number(match[1]) / Number(match[2]);
}

describe("quotation PDF document", () => {
  it("fits the complete Banner plus Office fixture on one A4 page with native text and only the black logo", async () => {
    const preview = createQuotationPdfTestPreview();
    const logo = await readBlackLogo();
    const loadLogo = vi.fn<QuotationPdfLogoLoader>(async () => logo);
    const blob = await generateQuotationPdfBlob(preview, { loadLogo });
    const bytes = await getBytes(blob);
    const source = getPdfSource(bytes);
    const streams = extractInflatedStreams(bytes);

    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1_000);
    expect(blob.size).toBeLessThan(2_000_000);
    expect(Buffer.from(bytes.slice(0, 5)).toString("ascii")).toBe("%PDF-");
    expect(countPdfPages(source)).toBe(1);
    expect(source).toMatch(/\/MediaBox \[0 0 595\.\d+ 841\.\d+\]/u);
    expect(streams).toContain("BT");
    expect(streams).not.toContain("Digital Respawn");
    expect(streams).toContain("Cotizaci");
    expect(streams).toContain("Banner");
    expect(streams).toContain("Instalaci");
    expect(streams).toContain("768.000");
    expect(streams).toContain("50.000");
    expect(streams).toContain("818.000");
    expect(streams).toContain("Empresa Ejemplo SAS");
    expect(streams).toContain("900123456-7");
    expect(streams).toContain("+57 3229699093");
    expect(streams).toContain("cotizaciones@example.com");
    expect(streams).toContain("Fusagasug");
    expect(streams).toContain("Entregar durante la pr");
    expect(streams).toContain("Confirmar disponibilidad antes de producci");
    expect(streams).not.toContain("Página 1 de 1");
    expect(extractFirstImageDisplayRatio(streams)).toBeCloseTo(
      logo.width / logo.height,
      2,
    );
    expect(loadLogo).toHaveBeenCalledWith(
      "/brand/digital-respawn-logo-black.png",
    );
  });

  it("generates multiple A4 pages with page numbering and complete final sections", async () => {
    const preview = createQuotationPdfTestPreview({ lineCount: 28 });
    const logo = await readBlackLogo();
    const blob = await generateQuotationPdfBlob(preview, {
      loadLogo: async () => logo,
    });
    const bytes = await getBytes(blob);
    const source = getPdfSource(bytes);
    const streams = extractInflatedStreams(bytes);
    const pageCount = countPdfPages(source);

    expect(pageCount).toBeGreaterThan(1);
    expect(streams).toContain("Página 1 de");
    expect(streams).toContain(`Página ${pageCount} de ${pageCount}`);
    expect(streams).toContain("TOTAL");
    expect(streams).toContain("Observaciones");
    expect(streams).not.toContain("Digital Respawn");
  });

  it("wraps long customer, description and multiline notes with required Spanish characters", async () => {
    const preview = createQuotationPdfTestPreview({
      lineCount: 4,
      longContent: true,
    });
    const before = JSON.stringify(preview);
    const blob = await generateQuotationPdfBlob(preview, {
      loadLogo: async () => {
        throw new Error("fictional missing local logo");
      },
    });
    const bytes = await getBytes(blob);
    const streams = extractInflatedStreams(bytes);

    expect(blob.size).toBeGreaterThan(1_000);
    expect(countPdfPages(getPdfSource(bytes))).toBeGreaterThan(1);
    expect(streams).toContain("Digital Respawn");
    expect(streams).toContain("Última línea");
    expect(streams).toContain("multiplicación");
    expect(streams).toContain("×");
    expect(JSON.stringify(preview)).toBe(before);
  });

  it("falls back to business text when the black logo loader fails", async () => {
    const loadLogo = vi.fn<QuotationPdfLogoLoader>(async () => {
      throw new Error("fictional missing local logo");
    });
    const blob = await generateQuotationPdfBlob(
      createQuotationPdfTestPreview(),
      { loadLogo },
    );
    const streams = extractInflatedStreams(await getBytes(blob));

    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(0);
    expect(streams).toContain("Digital Respawn");
    expect(loadLogo).toHaveBeenCalledWith(
      "/brand/digital-respawn-logo-black.png",
    );
  });

  it("falls back to business text when loaded logo bytes cannot be embedded", async () => {
    const invalidLogo = Object.freeze({
      bytes: new Uint8Array([1, 2, 3, 4]),
      format: "PNG" as const,
      width: 2327,
      height: 703,
    });
    const blob = await generateQuotationPdfBlob(
      createQuotationPdfTestPreview(),
      { loadLogo: async () => invalidLogo },
    );
    const streams = extractInflatedStreams(await getBytes(blob));

    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(0);
    expect(streams).toContain("Digital Respawn");
  });

  it("uses the customer-safe model and excludes identifiers and commercial fields", async () => {
    const preview = createQuotationPdfTestPreview({
      unsafeInternalFields: true,
    });
    const serializedPreview = JSON.stringify(preview);
    const blob = await generateQuotationPdfBlob(preview, {
      loadLogo: async () => {
        throw new Error("fictional missing local logo");
      },
    });
    const bytes = await getBytes(blob);
    const allPdfText = `${getPdfSource(bytes)}\n${extractInflatedStreams(bytes)}`;

    for (const forbidden of [
      "quotation-line-private-77",
      "Costo interno",
      "Margen",
      "Proveedor",
      "Mínimo autorizado",
      "Descuento máximo",
    ]) {
      expect(serializedPreview).not.toContain(forbidden);
      expect(allPdfText).not.toContain(forbidden);
    }
  });
});
