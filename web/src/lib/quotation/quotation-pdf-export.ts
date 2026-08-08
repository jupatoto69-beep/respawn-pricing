import type { QuotationPreviewViewModel } from "./quotation-preview-view-model";
import { downloadPdfBlob } from "./quotation-pdf-download";
import { generateQuotationPdfBlob } from "./quotation-pdf-document";
import { createQuotationPdfFilename } from "./quotation-pdf-filename";

export type QuotationPdfExporter = (
  preview: QuotationPreviewViewModel,
) => Promise<void>;

export type QuotationPdfExportDependencies = Readonly<{
  generatePdf: (preview: QuotationPreviewViewModel) => Promise<Blob>;
  downloadPdf: (blob: Blob, filename: string) => void | Promise<void>;
}>;

export type QuotationPdfExportLock = {
  current: boolean;
};

export type QuotationPdfExportLifecycle = Readonly<{
  onStart: () => void;
  onSuccess: () => void;
  onError: () => void;
  onFinish: () => void;
}>;

const DEFAULT_EXPORT_DEPENDENCIES: QuotationPdfExportDependencies =
  Object.freeze({
    generatePdf: generateQuotationPdfBlob,
    downloadPdf: downloadPdfBlob,
  });

function getCustomerName(preview: QuotationPreviewViewModel): string {
  return (
    preview.customerFields.find(
      (field) => field.label === "Nombre o empresa",
    )?.value ?? ""
  );
}

export async function exportQuotationPreviewPdf(
  preview: QuotationPreviewViewModel,
  dependencies: QuotationPdfExportDependencies = DEFAULT_EXPORT_DEPENDENCIES,
): Promise<void> {
  const filename = createQuotationPdfFilename(getCustomerName(preview));
  const blob = await dependencies.generatePdf(preview);

  if (blob.type !== "application/pdf" || blob.size === 0) {
    throw new TypeError("The PDF generator returned an invalid document.");
  }

  await dependencies.downloadPdf(blob, filename);
}

export async function runQuotationPdfExport(
  lock: QuotationPdfExportLock,
  preview: QuotationPreviewViewModel,
  exporter: QuotationPdfExporter,
  lifecycle: QuotationPdfExportLifecycle,
): Promise<"completed" | "failed" | "ignored"> {
  if (lock.current) {
    return "ignored";
  }

  lock.current = true;
  lifecycle.onStart();

  try {
    await exporter(preview);
    lifecycle.onSuccess();
    return "completed";
  } catch {
    lifecycle.onError();
    return "failed";
  } finally {
    lock.current = false;
    lifecycle.onFinish();
  }
}
