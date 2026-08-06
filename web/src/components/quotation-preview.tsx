import type { BusinessProfile } from "@/lib/quotation/business-profile";
import { createQuotationPreviewViewModel } from "@/lib/quotation/quotation-preview-view-model";
import type { TemporaryQuotationState } from "@/lib/pricing/temporary-quotation";

import styles from "./quotation-preview.module.css";

export type QuotationPreviewProps = Readonly<{
  quotation: TemporaryQuotationState;
  total: number;
  businessProfile: BusinessProfile;
  headingId: string;
}>;

export function QuotationPreview({
  quotation,
  total,
  businessProfile,
  headingId,
}: QuotationPreviewProps) {
  const preview = createQuotationPreviewViewModel({
    quotation,
    total,
    businessProfile,
  });

  return (
    <article className={styles.preview}>
      <header className={styles.header}>
        <div>
          <p className={styles.businessName}>{preview.businessName}</p>
          <h2 id={headingId}>Cotización</h2>
        </div>

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
                      <div key={`${detail.label}-${detailIndex}`}>
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
