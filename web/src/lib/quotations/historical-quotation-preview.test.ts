import { inflateSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "@/lib/quotation/business-profile";
import { generateQuotationPdfBlob } from "@/lib/quotation/quotation-pdf-document";
import { createHistoricalQuotationPreviewViewModel } from "@/lib/quotation/quotation-preview-view-model";

import type { HistoricalQuotation } from "./quotation-snapshot";

const HISTORICAL_QUOTATION: HistoricalQuotation = Object.freeze({
  id: "11111111-1111-4111-8111-111111111111",
  quotationDate: "2026-09-24",
  validityDays: 15,
  customerName: "Empresa Histórica Ejemplo SAS",
  customerDocument: "900123456-7",
  customerPhoneCountryIso2: "CO",
  customerPhoneNumber: "3205550199",
  customerEmail: "historica@example.com",
  customerCity: "Ciudad Ejemplo",
  notes: "Cotización histórica: no recalcular.",
  totalCop: 616_700,
  lines: Object.freeze([
    Object.freeze({
      source: "service" as const,
      title: "Servicio normal histórico",
      quantity: 1,
      details: Object.freeze([
        Object.freeze({ label: "Servicio", value: "Servicio guardado" }),
      ]),
      lineTotalCop: 500_000,
    }),
    Object.freeze({
      source: "custom" as const,
      title: "Medio metro de lámina sublimada",
      description: "Medio metro de lámina sublimada",
      quantity: 2,
      unitPriceCop: 58_350,
      details: Object.freeze([]) as readonly [],
      lineTotalCop: 116_700,
    }),
  ]),
  createdAt: "2026-09-24T14:30:00.000Z",
  createdBy: "22222222-2222-4222-8222-222222222222",
});

function extractInflatedStreams(bytes: Uint8Array): string {
  const source = Buffer.from(bytes).toString("latin1");
  const chunks: string[] = [];
  const streamPattern = /\/Filter \/FlateDecode[^]*?stream\r?\n/gu;

  for (const match of source.matchAll(streamPattern)) {
    const start = (match.index ?? 0) + match[0].length;
    const endMarker = source.indexOf("endstream", start);

    if (endMarker < 0) {
      continue;
    }

    let end = endMarker;
    while (end > start && [10, 13].includes(bytes[end - 1])) {
      end -= 1;
    }

    try {
      chunks.push(inflateSync(bytes.slice(start, end)).toString("latin1"));
    } catch {
      // Image streams are irrelevant to customer-safe text verification.
    }
  }

  return chunks.join("\n");
}

describe("historical quotation preview and PDF", () => {
  it("renders only persisted historical values including the exact custom price", () => {
    const preview = createHistoricalQuotationPreviewViewModel({
      quotation: HISTORICAL_QUOTATION,
      businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
    });

    expect(preview.quotationFields).toContainEqual({
      label: "Fecha",
      value: "24/09/2026",
    });
    expect(preview.customerFields).toContainEqual({
      label: "Nombre o empresa",
      value: "Empresa Histórica Ejemplo SAS",
    });
    expect(preview.quotationFields).toContainEqual({
      label: "Vigencia",
      value: "15 días",
    });
    expect(preview.lines[1]).toMatchObject({
      title: "Medio metro de lámina sublimada",
      quantity: 2,
      unitPriceCop: 58_350,
      formattedUnitPrice: "COP 58.350",
      lineTotal: 116_700,
      formattedLineTotal: "COP 116.700",
    });
    expect(preview.total).toBe(616_700);
    expect(preview.formattedTotal).toBe("COP 616.700");
    expect(preview.notes).toBe("Cotización histórica: no recalcular.");
  });

  it("feeds the persisted preview directly into the generic PDF pipeline", async () => {
    const preview = createHistoricalQuotationPreviewViewModel({
      quotation: HISTORICAL_QUOTATION,
      businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
    });
    const blob = await generateQuotationPdfBlob(preview, {
      loadLogo: async () => {
        throw new Error("fictional missing local logo");
      },
    });
    const streams = extractInflatedStreams(
      new Uint8Array(await blob.arrayBuffer()),
    );

    expect(blob.type).toBe("application/pdf");
    expect(streams).toContain("Servicio normal hist");
    expect(streams).toContain("Medio metro de l");
    expect(streams).toContain("58.350");
    expect(streams).toContain("116.700");
    expect(streams).toContain("616.700");
    expect(streams).toContain("Cotizaci");
    expect(streams).not.toContain("Costo interno");
    expect(streams).not.toContain("Margen");
    expect(streams).not.toContain("Proveedor");
  });
});
