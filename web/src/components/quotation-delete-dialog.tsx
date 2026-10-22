"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { HistoricalQuotationSummary } from "@/lib/quotations/quotation-snapshot";
import styles from "./quotation-history.module.css";

type Props = Readonly<{
  quotation: HistoricalQuotationSummary;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (typedNumber: string) => void;
}>;

export function QuotationDeleteDialog({ quotation, deleting, error, onCancel, onConfirm }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [typedNumber, setTypedNumber] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog ref={dialogRef} className={styles.deleteDialog} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); if (!deleting) onCancel(); }}>
      {step === 1 ? (
        <>
          <h2 id={titleId}>Eliminar cotización {quotation.quotationNumber}</h2>
          <p>Esta cotización y toda su información histórica serán eliminadas permanentemente.</p>
          <div className={styles.dialogActions}>
            <button type="button" onClick={onCancel}>Cancelar</button>
            <button type="button" className={styles.deleteButton} onClick={() => setStep(2)}>
              Eliminar cotización
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 id={titleId}>Esta acción es irreversible</h2>
          <p>No podrás recuperar esta cotización ni descargar nuevamente su PDF. El consecutivo no volverá a utilizarse.</p>
          <label className={styles.confirmLabel}>
            Escribe exactamente <strong>{quotation.quotationNumber}</strong> para confirmar
            <input autoComplete="off" spellCheck={false} value={typedNumber}
              disabled={deleting} onChange={(event) => setTypedNumber(event.currentTarget.value)} />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.dialogActions}>
            <button type="button" disabled={deleting} onClick={onCancel}>Cancelar</button>
            <button type="button" className={styles.deleteButton} disabled={deleting || typedNumber !== quotation.quotationNumber}
              onClick={() => { if (typedNumber === quotation.quotationNumber) onConfirm(typedNumber); }} aria-busy={deleting}>
              {deleting ? "Eliminando…" : "Eliminar permanentemente"}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
