"use client";

import {
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  exportQuotationPreviewPdf,
  runQuotationPdfExport,
  type QuotationPdfExporter,
} from "@/lib/quotation/quotation-pdf-export";
import type { QuotationPreviewViewModel } from "@/lib/quotation/quotation-preview-view-model";

import { QuotationPreview } from "./quotation-preview";
import styles from "./quotation-preview-modal.module.css";

type QuotationPreviewModalProps = Readonly<{
  isOpen: boolean;
  preview: QuotationPreviewViewModel;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onRequestClose: () => void;
  pdfExporter?: QuotationPdfExporter;
}>;

type QuotationPdfDownloadButtonProps = Readonly<{
  isGenerating: boolean;
  hasLines: boolean;
  onClick: () => void;
}>;

export function QuotationPdfDownloadButton({
  isGenerating,
  hasLines,
  onClick,
}: QuotationPdfDownloadButtonProps) {
  return (
    <button
      className={styles.downloadButton}
      type="button"
      disabled={isGenerating || !hasLines}
      aria-busy={isGenerating}
      onClick={onClick}
    >
      {isGenerating ? "Generando PDF…" : "Descargar PDF"}
    </button>
  );
}

export function QuotationPreviewModal({
  isOpen,
  preview,
  returnFocusRef,
  onRequestClose,
  pdfExporter = exportQuotationPreviewPdf,
}: QuotationPreviewModalProps) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onRequestCloseRef = useRef(onRequestClose);
  const exportLockRef = useRef({ current: false });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dialog = dialogRef.current;

    if (dialog === null) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      document.body.style.overflow = previousBodyOverflow;
      returnFocusElement?.focus();
    };
  }, [isOpen, returnFocusRef]);

  if (!isOpen) {
    return null;
  }

  async function handlePdfDownload() {
    await runQuotationPdfExport(
      exportLockRef.current,
      preview,
      pdfExporter,
      {
        onStart: () => {
          setPdfError(null);
          setIsGeneratingPdf(true);
        },
        onSuccess: () => undefined,
        onError: () => {
          setPdfError("No fue posible generar el PDF. Intenta nuevamente.");
        },
        onFinish: () => setIsGeneratingPdf(false),
      },
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onRequestCloseRef.current();
      }}
    >
      <div className={styles.dialogHeader}>
        <QuotationPdfDownloadButton
          isGenerating={isGeneratingPdf}
          hasLines={preview.lines.length > 0}
          onClick={handlePdfDownload}
        />
        <button
          ref={closeButtonRef}
          className={styles.closeButton}
          type="button"
          aria-label="Cerrar vista previa de la cotización"
          onClick={() => onRequestCloseRef.current()}
        >
          Cerrar
        </button>
      </div>

      <div className={styles.scrollArea}>
        {pdfError === null ? null : (
          <p className={styles.pdfError} role="alert">
            {pdfError}
          </p>
        )}
        <QuotationPreview
          preview={preview}
          headingId={headingId}
        />
      </div>
    </dialog>
  );
}
