import Image from "next/image";

import type { QuotationPreviewViewModel } from "@/lib/quotation/quotation-preview-view-model";

import styles from "./quotation-preview.module.css";

export type QuotationPreviewProps = Readonly<{
  preview: QuotationPreviewViewModel;
  headingId: string;
}>;

export function showFailedQuotationPreviewLogoFallback(
  image: Pick<HTMLImageElement, "alt" | "hidden">,
  fallback: Pick<HTMLElement, "hidden"> | null,
): void {
  image.hidden = true;
  image.alt = "";

  if (fallback !== null) {
    fallback.hidden = false;
  }
}

export function QuotationPreview({
  preview,
  headingId,
}: QuotationPreviewProps) {
  return (
    <article className={styles.preview}>
      <header className={styles.header}>
        <div className={styles.brandLockup}>
          {preview.logoOnDarkPath === null ? null : (
            <Image
              key={preview.logoOnDarkPath}
              className={styles.logo}
              src={preview.logoOnDarkPath}
              width={2327}
              height={703}
              sizes="(max-width: 620px) 180px, 230px"
              alt={`Logo de ${preview.businessName}`}
              unoptimized
              onError={(event) => {
                const fallback = event.currentTarget.nextElementSibling;

                showFailedQuotationPreviewLogoFallback(
                  event.currentTarget,
                  fallback instanceof HTMLElement ? fallback : null,
                );
              }}
            />
          )}
          <p
            key={`${preview.logoOnDarkPath ?? "text"}-name-fallback`}
            className={styles.businessName}
            hidden={preview.logoOnDarkPath !== null}
          >
            {preview.businessName}
          </p>
          <h2 id={headingId}>Cotización</h2>
        </div>

        <div className={styles.headerFields}>
          {preview.quotationFields.length > 0 ? (
            <dl className={styles.quotationFields}>
              {preview.quotationFields.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {preview.businessFields.length > 0 ? (
            <dl className={styles.businessFields}>
              {preview.businessFields.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </header>

      {preview.customerFields.length > 0 ? (
        <section className={styles.section}>
          <h3>Datos del cliente</h3>
          <dl className={styles.customerFields}>
            {preview.customerFields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className={styles.section}>
        <h3>Detalle de la cotización</h3>
        <ol className={styles.lines}>
          {preview.lines.map((line, lineIndex) => (
            <li key={lineIndex} className={styles.line}>
              <article>
                <div className={styles.lineHeading}>
                  <h4>{line.title}</h4>
                  <p>Línea {lineIndex + 1}</p>
                </div>

                {line.details.length > 0 ? (
                  <dl className={styles.lineDetails}>
                    {line.details.map((detail, detailIndex) => (
                      <div
                        key={`${detail.label}-${detailIndex}`}
                        className={
                          detail.label === "Condición"
                            ? styles.lineCondition
                            : undefined
                        }
                      >
                        <dt>{detail.label}</dt>
                        <dd>{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                <dl className={styles.lineSummary}>
                  <div>
                    <dt>Cantidad</dt>
                    <dd>{line.quantity}</dd>
                  </div>
                  {line.unitPriceCop === undefined ||
                  line.formattedUnitPrice === undefined ? null : (
                    <div>
                      <dt>Precio unitario</dt>
                      <dd>
                        <data value={line.unitPriceCop}>
                          {line.formattedUnitPrice}
                        </data>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Total de línea</dt>
                    <dd>
                      <data value={line.lineTotal}>
                        {line.formattedLineTotal}
                      </data>
                    </dd>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.totalSection} aria-label="Total de la cotización">
        <p>Total</p>
        <data value={preview.total}>{preview.formattedTotal}</data>
      </section>

      {preview.notes !== null ? (
        <section className={styles.notes}>
          <h3>Observaciones</h3>
          <p>{preview.notes}</p>
        </section>
      ) : null}
    </article>
  );
}
