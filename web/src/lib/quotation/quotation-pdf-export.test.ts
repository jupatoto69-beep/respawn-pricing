import { describe, expect, it, vi } from "vitest";

import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "./business-profile";
import {
  exportQuotationPreviewPdf,
  runQuotationPdfExport,
} from "./quotation-pdf-export";
import { createQuotationPreviewViewModel } from "./quotation-preview-view-model";
import {
  addQuotationLine,
  calculateQuotationTotal,
  createEmptyQuotation,
  updateQuotationDetails,
} from "../pricing/temporary-quotation";

function createPreview(customerName = "Empresa Ejemplo SAS") {
  const withDetails = updateQuotationDetails(createEmptyQuotation(), {
    customerName,
    customerDocument: "900123456-7",
    customerPhoneCountryIso2: "CO",
    customerPhoneNumber: "3229699093",
    customerEmail: "cotizaciones@example.com",
    customerCity: "Fusagasugá",
    notes:
      "Entregar durante la próxima semana.\nConfirmar disponibilidad antes de producción.",
  });
  const withBanner = addQuotationLine(withDetails, {
    source: "area-product",
    title: "Banner",
    quantity: 1,
    details: [{ label: "Dimensiones", value: "80 × 300 cm" }],
    lineTotal: 768_000,
  });
  const quotation = addQuotationLine(withBanner, {
    source: "service",
    title: "Instalación de Office únicamente",
    quantity: 1,
    details: [
      { label: "Servicio", value: "Instalación de Office únicamente" },
    ],
    lineTotal: 50_000,
  });

  return createQuotationPreviewViewModel({
    quotation,
    total: calculateQuotationTotal(quotation),
    businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
  });
}

describe("quotation PDF export orchestration", () => {
  it("passes only the safe immutable preview and the expected filename", async () => {
    const preview = createPreview();
    const before = JSON.stringify(preview);
    const blob = new Blob(["%PDF-fictional"], { type: "application/pdf" });
    const generatePdf = vi.fn(async () => blob);
    const downloadPdf = vi.fn();

    await exportQuotationPreviewPdf(preview, { generatePdf, downloadPdf });

    expect(generatePdf).toHaveBeenCalledWith(preview);
    expect(downloadPdf).toHaveBeenCalledWith(
      blob,
      "cotizacion-empresa-ejemplo-sas.pdf",
    );
    expect(JSON.stringify(preview)).toBe(before);
    expect(preview.total).toBe(818_000);
    expect(preview.lines.map((line) => line.lineTotal)).toEqual([
      768_000,
      50_000,
    ]);
  });

  it("uses the Digital Respawn fallback without leaking other customer fields", async () => {
    const downloadPdf = vi.fn();

    await exportQuotationPreviewPdf(createPreview(""), {
      generatePdf: async () =>
        new Blob(["%PDF-fictional"], { type: "application/pdf" }),
      downloadPdf,
    });

    expect(downloadPdf.mock.calls[0][1]).toBe(
      "cotizacion-digital-respawn.pdf",
    );
  });

  it.each([
    new Blob([], { type: "application/pdf" }),
    new Blob(["not-pdf"], { type: "text/plain" }),
  ])("rejects an invalid generated Blob", async (blob) => {
    const downloadPdf = vi.fn();

    await expect(
      exportQuotationPreviewPdf(createPreview(), {
        generatePdf: async () => blob,
        downloadPdf,
      }),
    ).rejects.toThrow("invalid document");
    expect(downloadPdf).not.toHaveBeenCalled();
  });
});

describe("quotation PDF export lifecycle", () => {
  it("blocks duplicate activation and recovers for a later download", async () => {
    let releaseFirstExport: (() => void) | undefined;
    const firstExport = new Promise<void>((resolve) => {
      releaseFirstExport = resolve;
    });
    const exporter = vi
      .fn()
      .mockImplementationOnce(() => firstExport)
      .mockResolvedValueOnce(undefined);
    const lock = { current: false };
    const lifecycle = {
      onStart: vi.fn(),
      onSuccess: vi.fn(),
      onError: vi.fn(),
      onFinish: vi.fn(),
    };
    const preview = createPreview();

    const first = runQuotationPdfExport(
      lock,
      preview,
      exporter,
      lifecycle,
    );
    const duplicate = await runQuotationPdfExport(
      lock,
      preview,
      exporter,
      lifecycle,
    );

    expect(duplicate).toBe("ignored");
    expect(exporter).toHaveBeenCalledOnce();
    expect(lock.current).toBe(true);

    releaseFirstExport?.();
    await expect(first).resolves.toBe("completed");
    expect(lock.current).toBe(false);
    expect(lifecycle.onStart).toHaveBeenCalledOnce();
    expect(lifecycle.onSuccess).toHaveBeenCalledOnce();
    expect(lifecycle.onError).not.toHaveBeenCalled();
    expect(lifecycle.onFinish).toHaveBeenCalledOnce();

    await expect(
      runQuotationPdfExport(lock, preview, exporter, lifecycle),
    ).resolves.toBe("completed");
    expect(exporter).toHaveBeenCalledTimes(2);
  });

  it("recovers after failure without exposing the thrown error", async () => {
    const lock = { current: false };
    const lifecycle = {
      onStart: vi.fn(),
      onSuccess: vi.fn(),
      onError: vi.fn(),
      onFinish: vi.fn(),
    };

    await expect(
      runQuotationPdfExport(
        lock,
        createPreview(),
        async () => {
          throw new Error("fictional internal path and customer data");
        },
        lifecycle,
      ),
    ).resolves.toBe("failed");

    expect(lock.current).toBe(false);
    expect(lifecycle.onError).toHaveBeenCalledOnce();
    expect(lifecycle.onFinish).toHaveBeenCalledOnce();
  });
});
