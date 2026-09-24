"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  useId,
  useState,
} from "react";

import {
  createEmptyCustomQuotationItemFormValues,
  resolveCustomQuotationItemFormValues,
  type CustomQuotationItemFormErrors,
  type CustomQuotationItemFormValues,
} from "@/lib/pricing/custom-quotation-line";
import type {
  CustomQuotationLine,
  CustomQuotationLineDraft,
} from "@/lib/pricing/temporary-quotation";
import { formatQuotationCop } from "@/lib/quotation/quotation-preview-view-model";

import styles from "./custom-quotation-item-form.module.css";

type CustomQuotationItemFormProps = Readonly<{
  initialLine?: CustomQuotationLine;
  onSubmit: (draft: CustomQuotationLineDraft) => void;
  onCancel?: () => void;
}>;

type TouchedFields = Readonly<
  Partial<Record<keyof CustomQuotationItemFormValues, true>>
>;

export function createCustomQuotationItemFormValuesFromLine(
  line: CustomQuotationLine,
): CustomQuotationItemFormValues {
  return Object.freeze({
    description: line.description,
    quantity: String(line.quantity),
    unitPriceCop: String(line.unitPriceCop),
  });
}

function getVisibleErrors(
  errors: CustomQuotationItemFormErrors,
  touched: TouchedFields,
  submissionAttempted: boolean,
): CustomQuotationItemFormErrors {
  if (submissionAttempted) {
    return errors;
  }

  return Object.freeze(
    Object.fromEntries(
      Object.entries(errors).filter(([field]) =>
        field === "total"
          ? true
          : touched[field as keyof CustomQuotationItemFormValues] === true,
      ),
    ),
  );
}

type FormErrorProps = Readonly<{
  id: string;
  message: string | undefined;
}>;

function FormError({ id, message }: FormErrorProps) {
  return message === undefined ? null : (
    <p id={id} className={styles.error}>
      <strong>Error:</strong> {message}
    </p>
  );
}

export function CustomQuotationItemForm({
  initialLine,
  onSubmit,
  onCancel,
}: CustomQuotationItemFormProps) {
  const headingId = useId();
  const descriptionErrorId = `${headingId}-description-error`;
  const quantityErrorId = `${headingId}-quantity-error`;
  const unitPriceErrorId = `${headingId}-unit-price-error`;
  const [values, setValues] = useState<CustomQuotationItemFormValues>(() =>
    initialLine === undefined
      ? createEmptyCustomQuotationItemFormValues()
      : createCustomQuotationItemFormValuesFromLine(initialLine),
  );
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const resolution = resolveCustomQuotationItemFormValues(values);
  const visibleErrors = getVisibleErrors(
    resolution.errors,
    touched,
    submissionAttempted,
  );
  const isEditing = initialLine !== undefined;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof CustomQuotationItemFormValues;
    const value = event.currentTarget.value;

    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setAnnouncement("");
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof CustomQuotationItemFormValues;

    setTouched((currentTouched) =>
      currentTouched[field]
        ? currentTouched
        : { ...currentTouched, [field]: true },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionAttempted(true);

    if (resolution.draft === null) {
      setTouched({
        description: true,
        quantity: true,
        unitPriceCop: true,
      });
      return;
    }

    const savedDescription = resolution.draft.description;
    onSubmit(resolution.draft);

    if (!isEditing) {
      setValues(createEmptyCustomQuotationItemFormValues());
      setTouched({});
      setSubmissionAttempted(false);
      setAnnouncement(`${savedDescription} fue agregado a la cotización.`);
    }
  }

  return (
    <section
      className={`${styles.section}${isEditing ? ` ${styles.editing}` : ""}`}
      aria-labelledby={headingId}
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>
            {isEditing ? "Edición de línea" : "Precio comercial conocido"}
          </p>
          {isEditing ? (
            <h4 id={headingId}>Editar ítem personalizado</h4>
          ) : (
            <h2 id={headingId}>Ítem personalizado</h2>
          )}
        </div>
        <p className={styles.requiredNote}>Todos los campos son obligatorios.</p>
      </div>

      <p className={styles.helperText}>
        Agrega productos o servicios con precio conocido que no estén
        disponibles en los módulos de Respawn Pricing.
      </p>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={`${styles.field} ${styles.descriptionField}`}>
          <label htmlFor={`${headingId}-description`}>Descripción</label>
          <input
            id={`${headingId}-description`}
            type="text"
            name="description"
            value={values.description}
            autoComplete="off"
            placeholder="Ej. Medio metro de lámina sublimada"
            aria-invalid={
              visibleErrors.description === undefined ? undefined : true
            }
            aria-describedby={
              visibleErrors.description === undefined
                ? undefined
                : descriptionErrorId
            }
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <FormError
            id={descriptionErrorId}
            message={visibleErrors.description}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${headingId}-quantity`}>Cantidad</label>
          <input
            id={`${headingId}-quantity`}
            type="text"
            name="quantity"
            value={values.quantity}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ej. 3"
            aria-invalid={
              visibleErrors.quantity === undefined ? undefined : true
            }
            aria-describedby={
              visibleErrors.quantity === undefined ? undefined : quantityErrorId
            }
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <FormError id={quantityErrorId} message={visibleErrors.quantity} />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${headingId}-unit-price`}>Precio unitario</label>
          <div className={styles.currencyInput}>
            <input
              id={`${headingId}-unit-price`}
              type="text"
              name="unitPriceCop"
              value={values.unitPriceCop}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ej. 58000"
              aria-invalid={
                visibleErrors.unitPriceCop === undefined ? undefined : true
              }
              aria-describedby={
                visibleErrors.unitPriceCop === undefined
                  ? `${headingId}-unit-price-help`
                  : `${headingId}-unit-price-help ${unitPriceErrorId}`
              }
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <span aria-hidden="true">COP</span>
          </div>
          <p id={`${headingId}-unit-price-help`} className={styles.fieldHelp}>
            Escribe el precio final por unidad, solo con números y sin
            separadores.
          </p>
          <FormError
            id={unitPriceErrorId}
            message={visibleErrors.unitPriceCop}
          />
        </div>

        <div className={styles.total} aria-live="polite">
          <span>Total calculado</span>
          {resolution.draft === null ? (
            <strong>Completa los datos válidos</strong>
          ) : (
            <data value={resolution.draft.lineTotal}>
              {formatQuotationCop(resolution.draft.lineTotal)}
            </data>
          )}
        </div>

        <FormError id={`${headingId}-total-error`} message={visibleErrors.total} />

        <div className={styles.actions}>
          <button className={styles.primaryButton} type="submit">
            {isEditing ? "Guardar cambios" : "Agregar a cotización"}
          </button>
          {isEditing && onCancel !== undefined ? (
            <button
              className={styles.cancelButton}
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <p className={styles.liveRegion} aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}
