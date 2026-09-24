"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "@/lib/quotation/business-profile";
import { evaluateQuotationPreviewOpening } from "@/lib/quotation/quotation-preview-opening";
import { createQuotationPreviewViewModel } from "@/lib/quotation/quotation-preview-view-model";
import {
  isCustomerPhoneNumberInput,
  validateTemporaryQuotationDetails,
  type TemporaryQuotationDetailErrors,
} from "@/lib/pricing/temporary-quotation-details-validation";
import {
  isPhoneCountryIso2,
  PHONE_COUNTRY_DEFINITIONS,
  type PhoneCountryIso2,
} from "@/lib/pricing/phone-country-catalog";

import {
  hasQuotationInformation,
  type CustomQuotationLine,
  type CustomQuotationLineDraft,
  type QuotationLine,
  type TemporaryQuotationDetails,
  type TemporaryQuotationState,
  type TemporaryQuotationTextDetailField,
} from "@/lib/pricing/temporary-quotation";
import {
  createSupabaseQuotationRepository,
  type QuotationRepository,
} from "@/lib/quotations/quotation-repository";
import { createQuotationPersistenceSnapshot } from "@/lib/quotations/quotation-snapshot";
import { createClient } from "@/lib/supabase/client";

import styles from "./temporary-quotation.module.css";
import { CustomQuotationItemForm } from "./custom-quotation-item-form";
import { QuotationPreviewModal } from "./quotation-preview-modal";

type TemporaryQuotationProps = Readonly<{
  quotation: TemporaryQuotationState;
  total: number;
  onUpdateDetail: (
    field: TemporaryQuotationTextDetailField,
    value: string,
  ) => void;
  onUpdatePhoneCountry: (countryIso2: PhoneCountryIso2) => void;
  onRemoveLine: (lineId: string) => void;
  onUpdateCustomLine: (
    lineId: string,
    draft: CustomQuotationLineDraft,
  ) => void;
  onClear: () => void;
  onSaved?: () => void;
}>;

type QuotationAnnouncement = Readonly<{
  lineIdentity: string;
  message: string;
}>;

type TouchedQuotationDetailFields = Readonly<
  Partial<Record<TemporaryQuotationTextDetailField, true>>
>;

type TemporaryQuotationDetailsFormProps = Readonly<{
  details: TemporaryQuotationDetails;
  idPrefix: string;
  errors: TemporaryQuotationDetailErrors;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onPhoneCountryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onBlur: (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
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

function getVisibleDetailErrors(
  errors: TemporaryQuotationDetailErrors,
  touchedFields: TouchedQuotationDetailFields,
): TemporaryQuotationDetailErrors {
  const visibleErrors: Partial<
    Record<TemporaryQuotationTextDetailField, string>
  > = {};

  for (const field of Object.keys(
    errors,
  ) as TemporaryQuotationTextDetailField[]) {
    const error = errors[field];

    if (touchedFields[field] && error !== undefined) {
      visibleErrors[field] = error;
    }
  }

  return visibleErrors;
}

type DetailErrorProps = Readonly<{
  id: string;
  message: string | undefined;
}>;

function DetailError({ id, message }: DetailErrorProps) {
  return message === undefined ? null : (
    <p id={id} className={styles.detailError}>
      <strong>Error:</strong> {message}
    </p>
  );
}

export function TemporaryQuotationDetailsForm({
  details,
  idPrefix,
  errors,
  onChange,
  onPhoneCountryChange,
  onBlur,
}: TemporaryQuotationDetailsFormProps) {
  const customerNameErrorId = `${idPrefix}-customer-name-error`;
  const customerDocumentErrorId = `${idPrefix}-customer-document-error`;
  const customerPhoneErrorId = `${idPrefix}-customer-phone-error`;
  const customerEmailErrorId = `${idPrefix}-customer-email-error`;
  const customerCityErrorId = `${idPrefix}-customer-city-error`;
  const notesErrorId = `${idPrefix}-notes-error`;

  function handlePhoneNumberChange(event: ChangeEvent<HTMLInputElement>) {
    if (isCustomerPhoneNumberInput(event.currentTarget.value)) {
      onChange(event);
    }
  }

  return (
    <div className={styles.detailsGrid}>
      <div className={styles.detailField}>
        <label htmlFor={`${idPrefix}-customer-name`}>Nombre o empresa</label>
        <input
          id={`${idPrefix}-customer-name`}
          type="text"
          name="customerName"
          value={details.customerName}
          autoComplete="organization"
          aria-invalid={errors.customerName === undefined ? undefined : true}
          aria-describedby={
            errors.customerName === undefined
              ? undefined
              : customerNameErrorId
          }
          onChange={onChange}
          onBlur={onBlur}
        />
        <DetailError
          id={customerNameErrorId}
          message={errors.customerName}
        />
      </div>

      <div className={styles.detailField}>
        <label htmlFor={`${idPrefix}-customer-document`}>
          Documento o NIT
        </label>
        <input
          id={`${idPrefix}-customer-document`}
          type="text"
          name="customerDocument"
          value={details.customerDocument}
          autoComplete="off"
          aria-invalid={
            errors.customerDocument === undefined ? undefined : true
          }
          aria-describedby={
            errors.customerDocument === undefined
              ? undefined
              : customerDocumentErrorId
          }
          onChange={onChange}
          onBlur={onBlur}
        />
        <DetailError
          id={customerDocumentErrorId}
          message={errors.customerDocument}
        />
      </div>

      <div className={styles.detailField}>
        <label htmlFor={`${idPrefix}-customer-phone-country`}>
          País o código telefónico
        </label>
        <select
          id={`${idPrefix}-customer-phone-country`}
          name="customerPhoneCountryIso2"
          value={details.customerPhoneCountryIso2}
          onChange={onPhoneCountryChange}
        >
          {PHONE_COUNTRY_DEFINITIONS.map((country) => (
            <option key={country.iso2} value={country.iso2}>
              {country.name} ({country.callingCode})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.detailField}>
        <label htmlFor={`${idPrefix}-customer-phone`}>Teléfono</label>
        <input
          id={`${idPrefix}-customer-phone`}
          type="tel"
          name="customerPhoneNumber"
          value={details.customerPhoneNumber}
          inputMode="numeric"
          autoComplete="tel-national"
          aria-invalid={
            errors.customerPhoneNumber === undefined ? undefined : true
          }
          aria-describedby={
            errors.customerPhoneNumber === undefined
              ? undefined
              : customerPhoneErrorId
          }
          onChange={handlePhoneNumberChange}
          onBlur={onBlur}
        />
        <DetailError
          id={customerPhoneErrorId}
          message={errors.customerPhoneNumber}
        />
      </div>

      <div className={styles.detailField}>
        <label htmlFor={`${idPrefix}-customer-email`}>
          Correo electrónico
        </label>
        <input
          id={`${idPrefix}-customer-email`}
          type="email"
          name="customerEmail"
          value={details.customerEmail}
          autoComplete="email"
          aria-invalid={errors.customerEmail === undefined ? undefined : true}
          aria-describedby={
            errors.customerEmail === undefined
              ? undefined
              : customerEmailErrorId
          }
          onChange={onChange}
          onBlur={onBlur}
        />
        <DetailError
          id={customerEmailErrorId}
          message={errors.customerEmail}
        />
      </div>

      <div className={styles.detailField}>
        <label htmlFor={`${idPrefix}-customer-city`}>Ciudad</label>
        <input
          id={`${idPrefix}-customer-city`}
          type="text"
          name="customerCity"
          value={details.customerCity}
          autoComplete="address-level2"
          aria-invalid={errors.customerCity === undefined ? undefined : true}
          aria-describedby={
            errors.customerCity === undefined
              ? undefined
              : customerCityErrorId
          }
          onChange={onChange}
          onBlur={onBlur}
        />
        <DetailError
          id={customerCityErrorId}
          message={errors.customerCity}
        />
      </div>

      <div className={`${styles.detailField} ${styles.notesField}`}>
        <label htmlFor={`${idPrefix}-notes`}>Observaciones generales</label>
        <textarea
          id={`${idPrefix}-notes`}
          name="notes"
          value={details.notes}
          rows={6}
          aria-invalid={errors.notes === undefined ? undefined : true}
          aria-describedby={
            errors.notes === undefined ? undefined : notesErrorId
          }
          onChange={onChange}
          onBlur={onBlur}
        />
        <DetailError id={notesErrorId} message={errors.notes} />
      </div>
    </div>
  );
}

export function TemporaryQuotation({
  quotation,
  total,
  onUpdateDetail,
  onUpdatePhoneCountry,
  onRemoveLine,
  onUpdateCustomLine,
  onClear,
  onSaved,
}: TemporaryQuotationProps) {
  const titleId = useId();
  const detailsTitleId = useId();
  const previewHintId = useId();
  const detailsFormRef = useRef<HTMLDivElement>(null);
  const previewTriggerRef = useRef<HTMLButtonElement>(null);
  const repositoryRef = useRef<QuotationRepository | null>(null);
  const saveLockRef = useRef(false);
  const [confirmationLineIdentity, setConfirmationLineIdentity] = useState<
    string | null
  >(null);
  const [announcement, setAnnouncement] =
    useState<QuotationAnnouncement | null>(null);
  const [touchedDetailFields, setTouchedDetailFields] =
    useState<TouchedQuotationDetailFields>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<
    Readonly<{ kind: "success" | "error"; message: string }> | null
  >(null);
  const [editingCustomLineId, setEditingCustomLineId] = useState<string | null>(
    null,
  );
  const currentLineIdentity = getLineIdentity(quotation.lines);
  const hasInformation = hasQuotationInformation(quotation);
  const detailErrors = validateTemporaryQuotationDetails(quotation.details);
  const visibleDetailErrors = getVisibleDetailErrors(
    detailErrors,
    touchedDetailFields,
  );
  const isClearConfirmationOpen =
    hasInformation && confirmationLineIdentity === currentLineIdentity;
  const canSave =
    quotation.lines.length > 0 && Object.keys(detailErrors).length === 0;
  const preview = useMemo(
    () =>
      createQuotationPreviewViewModel({
        quotation,
        total,
        businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
      }),
    [quotation, total],
  );

  function getRepository(): QuotationRepository {
    repositoryRef.current ??= createSupabaseQuotationRepository(createClient());
    return repositoryRef.current;
  }

  function handleRemove(line: QuotationLine) {
    onRemoveLine(line.id);
    setEditingCustomLineId((currentLineId) =>
      currentLineId === line.id ? null : currentLineId,
    );
    setConfirmationLineIdentity(null);
    setAnnouncement({
      lineIdentity: getLineIdentity(
        quotation.lines.filter((candidate) => candidate.id !== line.id),
      ),
      message: `${line.title} fue eliminado de la cotización.`,
    });
  }

  function handleSaveCustomLine(
    line: CustomQuotationLine,
    draft: CustomQuotationLineDraft,
  ) {
    onUpdateCustomLine(line.id, draft);
    setEditingCustomLineId(null);
    setAnnouncement({
      lineIdentity: currentLineIdentity,
      message: `${draft.description} fue actualizado en la cotización.`,
    });
  }

  function handleCancelCustomLineEdit(line: CustomQuotationLine) {
    setEditingCustomLineId(null);
    setAnnouncement({
      lineIdentity: currentLineIdentity,
      message: `Se canceló la edición de ${line.description}.`,
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
    setEditingCustomLineId(null);
    setTouchedDetailFields({});
    setAnnouncement({
      lineIdentity: "",
      message: "Cotización vaciada.",
    });
  }

  function handleDetailChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.currentTarget
      .name as TemporaryQuotationTextDetailField;
    const value = event.currentTarget.value;

    setConfirmationLineIdentity(null);
    setAnnouncement(null);
    onUpdateDetail(field, value);
  }

  function handlePhoneCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    const countryIso2 = event.currentTarget.value;

    if (!isPhoneCountryIso2(countryIso2)) {
      return;
    }

    setConfirmationLineIdentity(null);
    setAnnouncement(null);
    onUpdatePhoneCountry(countryIso2);
  }

  function handleDetailBlur(
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.currentTarget
      .name as TemporaryQuotationTextDetailField;

    setTouchedDetailFields((currentFields) =>
      currentFields[field]
        ? currentFields
        : { ...currentFields, [field]: true },
    );
  }

  function handlePreviewRequest() {
    const evaluation = evaluateQuotationPreviewOpening(quotation);

    if (!evaluation.canOpen) {
      const invalidFields = Object.keys(
        evaluation.errors,
      ) as TemporaryQuotationTextDetailField[];

      if (invalidFields.length > 0) {
        setTouchedDetailFields((currentFields) => {
          const nextFields: Partial<
            Record<TemporaryQuotationTextDetailField, true>
          > = { ...currentFields };

          for (const field of invalidFields) {
            nextFields[field] = true;
          }

          return nextFields;
        });
      }

      if (evaluation.firstInvalidField !== null) {
        const firstInvalidField = evaluation.firstInvalidField;

        requestAnimationFrame(() => {
          detailsFormRef.current
            ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
            ?.focus();
        });
      }

      return;
    }

    setIsPreviewOpen(true);
  }

  async function handleSaveRequest() {
    if (saveLockRef.current) {
      return;
    }

    const snapshot = createQuotationPersistenceSnapshot(quotation);

    if (!snapshot.ok) {
      setSaveFeedback({ kind: "error", message: snapshot.message });
      return;
    }

    saveLockRef.current = true;
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const result = await getRepository().save(snapshot.value);

      if (!result.ok) {
        setSaveFeedback({ kind: "error", message: result.message });
        return;
      }

      setSaveFeedback({
        kind: "success",
        message: "Cotización guardada correctamente.",
      });
      onSaved?.();
    } catch {
      setSaveFeedback({
        kind: "error",
        message: "No pudimos guardar la cotización. Inténtalo de nuevo.",
      });
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);
    }
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

      <section
        className={styles.quotationDetails}
        aria-labelledby={detailsTitleId}
      >
        <div className={styles.detailsHeading}>
          <h3 id={detailsTitleId}>Datos de la cotización</h3>
          <p className={styles.temporaryNotice}>
            Esta información es temporal y se perderá al recargar la página.
          </p>
        </div>

        <div ref={detailsFormRef}>
          <TemporaryQuotationDetailsForm
            details={quotation.details}
            idPrefix={detailsTitleId}
            errors={visibleDetailErrors}
            onChange={handleDetailChange}
            onPhoneCountryChange={handlePhoneCountryChange}
            onBlur={handleDetailBlur}
          />
        </div>
      </section>

      {quotation.lines.length === 0 ? (
        <p className={styles.emptyState}>
          Aún no has agregado productos o servicios.
        </p>
      ) : (
        <ol className={styles.lineList}>
          {quotation.lines.map((line, index) => (
            <li key={line.id} className={styles.lineItem}>
              <article>
                <div className={styles.lineHeading}>
                  <h3>{line.title}</h3>
                  <div className={styles.lineActions}>
                    {line.source === "custom" &&
                    editingCustomLineId !== line.id ? (
                      <button
                        className={styles.editButton}
                        type="button"
                        aria-label={`Editar ${line.description} (línea ${index + 1})`}
                        onClick={() => {
                          setEditingCustomLineId(line.id);
                          setAnnouncement(null);
                        }}
                      >
                        Editar
                      </button>
                    ) : null}
                    <button
                      className={styles.removeButton}
                      type="button"
                      aria-label={`Eliminar ${line.title} de la cotización (línea ${index + 1})`}
                      onClick={() => handleRemove(line)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {line.source === "custom" &&
                editingCustomLineId === line.id ? (
                  <CustomQuotationItemForm
                    key={line.id}
                    initialLine={line}
                    onSubmit={(draft) => handleSaveCustomLine(line, draft)}
                    onCancel={() => handleCancelCustomLineEdit(line)}
                  />
                ) : (
                  <>
                    <dl className={styles.details}>
                      {line.details.map((detail, detailIndex) => (
                        <div
                          key={`${detail.label}-${detailIndex}`}
                          className={
                            detail.label === "Condición"
                              ? styles.conditionDetail
                              : undefined
                          }
                        >
                          <dt>{detail.label}</dt>
                          <dd>{detail.value}</dd>
                        </div>
                      ))}
                      <div>
                        <dt>Cantidad</dt>
                        <dd>{line.quantity}</dd>
                      </div>
                      {line.source === "custom" ? (
                        <div>
                          <dt>Precio unitario</dt>
                          <dd>{priceFormatter.format(line.unitPriceCop)}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <p className={styles.lineTotal}>
                      <span>Total de línea</span>
                      <data value={line.lineTotal}>
                        {priceFormatter.format(line.lineTotal)}
                      </data>
                    </p>
                  </>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.previewAction}>
        <button
          className={styles.saveQuotationButton}
          type="button"
          disabled={!canSave || isSaving}
          aria-busy={isSaving}
          onClick={() => void handleSaveRequest()}
        >
          {isSaving ? "Guardando cotización…" : "Guardar cotización"}
        </button>
        <button
          ref={previewTriggerRef}
          className={styles.previewButton}
          type="button"
          disabled={quotation.lines.length === 0}
          aria-describedby={
            quotation.lines.length === 0 ? previewHintId : undefined
          }
          onClick={handlePreviewRequest}
        >
          Vista previa de la cotización
        </button>
        {quotation.lines.length === 0 ? (
          <p id={previewHintId}>
            Agrega al menos una línea para abrir la vista previa.
          </p>
        ) : null}
        {quotation.lines.length > 0 && !canSave ? (
          <p>Revisa los datos de la cotización antes de guardarla.</p>
        ) : null}
      </div>

      {saveFeedback ? (
        <p
          className={
            saveFeedback.kind === "error"
              ? styles.saveError
              : styles.saveSuccess
          }
          role={saveFeedback.kind === "error" ? "alert" : "status"}
        >
          {saveFeedback.message}
        </p>
      ) : null}

      {hasInformation ? (
        <div className={styles.summary}>
          {quotation.lines.length > 0 ? (
            <p className={styles.grandTotal}>
              <span>Total general</span>
              <data value={total}>{priceFormatter.format(total)}</data>
            </p>
          ) : null}

          {isClearConfirmationOpen ? (
            <div
              className={styles.clearConfirmation}
              role="group"
              aria-label="Confirmar vaciado de la cotización"
            >
              <p>
                Esta acción eliminará todas las líneas y los datos de esta
                cotización temporal.
              </p>
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
      ) : null}

      <p
        className={styles.liveRegion}
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement?.lineIdentity === currentLineIdentity
          ? announcement.message
          : ""}
      </p>

      <QuotationPreviewModal
        isOpen={isPreviewOpen}
        preview={preview}
        returnFocusRef={previewTriggerRef}
        onRequestClose={() => setIsPreviewOpen(false)}
      />
    </section>
  );
}
