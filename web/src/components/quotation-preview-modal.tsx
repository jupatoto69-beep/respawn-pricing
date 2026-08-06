"use client";

import {
  type RefObject,
  useEffect,
  useId,
  useRef,
} from "react";

import type { BusinessProfile } from "@/lib/quotation/business-profile";
import type { TemporaryQuotationState } from "@/lib/pricing/temporary-quotation";

import { QuotationPreview } from "./quotation-preview";
import styles from "./quotation-preview-modal.module.css";

type QuotationPreviewModalProps = Readonly<{
  isOpen: boolean;
  quotation: TemporaryQuotationState;
  total: number;
  businessProfile: BusinessProfile;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onRequestClose: () => void;
}>;

export function QuotationPreviewModal({
  isOpen,
  quotation,
  total,
  businessProfile,
  returnFocusRef,
  onRequestClose,
}: QuotationPreviewModalProps) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onRequestCloseRef = useRef(onRequestClose);

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
      onClose={() => onRequestCloseRef.current()}
    >
      <div className={styles.dialogHeader}>
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
        <QuotationPreview
          quotation={quotation}
          total={total}
          businessProfile={businessProfile}
          headingId={headingId}
        />
      </div>
    </dialog>
  );
}
