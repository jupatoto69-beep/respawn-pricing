"use client";

import { useId, useState } from "react";

import type {
  QuotationLine,
  TemporaryQuotationState,
} from "@/lib/pricing/temporary-quotation";

import styles from "./temporary-quotation.module.css";

type TemporaryQuotationProps = Readonly<{
  quotation: TemporaryQuotationState;
  total: number;
  onRemoveLine: (lineId: string) => void;
  onClear: () => void;
}>;

type QuotationAnnouncement = Readonly<{
  lineIdentity: string;
  message: string;
}>;

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function getLineIdentity(lines: readonly QuotationLine[]): string {
  return lines.map((line) => line.id).join("|");
}

export function TemporaryQuotation({
  quotation,
  total,
  onRemoveLine,
  onClear,
}: TemporaryQuotationProps) {
  const titleId = useId();
  const [confirmationLineIdentity, setConfirmationLineIdentity] = useState<
    string | null
  >(null);
  const [announcement, setAnnouncement] =
    useState<QuotationAnnouncement | null>(null);
  const currentLineIdentity = getLineIdentity(quotation.lines);
  const isClearConfirmationOpen =
    quotation.lines.length > 0 &&
    confirmationLineIdentity === currentLineIdentity;

  function handleRemove(line: QuotationLine) {
    onRemoveLine(line.id);
    setConfirmationLineIdentity(null);
    setAnnouncement({
      lineIdentity: getLineIdentity(
        quotation.lines.filter((candidate) => candidate.id !== line.id),
      ),
      message: `${line.title} fue eliminado de la cotización.`,
    });
  }

  function handleRequestClear() {
    setConfirmationLineIdentity(currentLineIdentity);
    setAnnouncement(null);
  }

  function handleCancelClear() {
    setConfirmationLineIdentity(null);
    setAnnouncement({
      lineIdentity: currentLineIdentity,
      message: "Se canceló el vaciado de la cotización.",
    });
  }

  function handleConfirmClear() {
    onClear();
    setConfirmationLineIdentity(null);
    setAnnouncement({
      lineIdentity: "",
      message: "Cotización vaciada.",
    });
  }

  return (
    <section className={styles.quotation} aria-labelledby={titleId}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Ayuda de trabajo en memoria</p>
          <h2 id={titleId}>Cotización temporal</h2>
        </div>
        {quotation.lines.length > 0 ? (
          <p className={styles.lineCount}>
            {quotation.lines.length} {quotation.lines.length === 1 ? "línea" : "líneas"}
          </p>
        ) : null}
      </div>

      {quotation.lines.length === 0 ? (
        <p className={styles.emptyState}>
          Aún no has agregado productos o servicios.
        </p>
      ) : (
        <>
          <ol className={styles.lineList}>
            {quotation.lines.map((line, index) => (
              <li key={line.id} className={styles.lineItem}>
                <article>
                  <div className={styles.lineHeading}>
                    <h3>{line.title}</h3>
                    <button
                      className={styles.removeButton}
                      type="button"
                      aria-label={`Eliminar ${line.title} de la cotización (línea ${index + 1})`}
                      onClick={() => handleRemove(line)}
                    >
                      Eliminar
                    </button>
                  </div>

                  <dl className={styles.details}>
                    {line.details.map((detail, detailIndex) => (
                      <div key={`${detail.label}-${detailIndex}`}>
                        <dt>{detail.label}</dt>
                        <dd>{detail.value}</dd>
                      </div>
                    ))}
                    <div>
                      <dt>Cantidad</dt>
                      <dd>{line.quantity}</dd>
                    </div>
                  </dl>

                  <p className={styles.lineTotal}>
                    <span>Total de línea</span>
                    <data value={line.lineTotal}>
                      {priceFormatter.format(line.lineTotal)}
                    </data>
                  </p>
                </article>
              </li>
            ))}
          </ol>

          <div className={styles.summary}>
            <p className={styles.grandTotal}>
              <span>Total general</span>
              <data value={total}>{priceFormatter.format(total)}</data>
            </p>

            {isClearConfirmationOpen ? (
              <div className={styles.clearConfirmation} role="group" aria-label="Confirmar vaciado de la cotización">
                <p>Esta acción eliminará todas las líneas de esta cotización temporal.</p>
                <div>
                  <button
                    className={styles.confirmClearButton}
                    type="button"
                    onClick={handleConfirmClear}
                  >
                    Confirmar vaciado
                  </button>
                  <button
                    className={styles.cancelButton}
                    type="button"
                    onClick={handleCancelClear}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={styles.clearButton}
                type="button"
                onClick={handleRequestClear}
              >
                Vaciar cotización
              </button>
            )}
          </div>
        </>
      )}

      <p
        className={styles.liveRegion}
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement?.lineIdentity === currentLineIdentity
          ? announcement.message
          : ""}
      </p>
    </section>
  );
}
