"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useState,
} from "react";

import {
  getThreeDPrintingMaterialConfig,
  getThreeDPrintingModelingOption,
  isThreeDPrintingMaterialId,
  isThreeDPrintingModelingId,
  THREE_D_PRINTING_MATERIAL_OPTIONS,
  THREE_D_PRINTING_MODELING_OPTIONS,
} from "@/lib/pricing/three-d-printing-catalog";
import {
  getThreeDPrintingColorMode,
  isThreeDPrintingColorModeId,
  THREE_D_PRINTING_COLOR_MODE_IDS,
  THREE_D_PRINTING_COLOR_MODE_OPTIONS,
} from "@/lib/pricing/three-d-printing-color-mode";
import {
  THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_FINITE_ERROR,
  THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_MINIMUM_ERROR,
  THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_POSITIVE_ERROR,
  THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_RANGE_ERROR,
  THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_REQUIRED_ERROR,
} from "@/lib/pricing/accept-three-d-printing-quick-estimated-total";
import { createThreeDPrintingQuickQuotationLineDraft } from "@/lib/pricing/three-d-printing-quick-quotation-line";
import {
  changeThreeDPrintingQuickColorMode,
  changeThreeDPrintingQuickMaterial,
  changeThreeDPrintingQuickModeling,
  changeThreeDPrintingQuickTextField,
  createInitialThreeDPrintingQuickFormValues,
  resolveThreeDPrintingQuickFormValues,
  THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION,
  THREE_D_PRINTING_PRELIMINARY_NOTICE,
  type ResolvedThreeDPrintingQuickForm,
  type ThreeDPrintingQuickFormValues,
  type ThreeDPrintingQuickTextField,
} from "@/lib/pricing/three-d-printing-quick-selection";
import type { QuotationLineDraft } from "@/lib/pricing/temporary-quotation";

import formStyles from "./area-pricing-calculator.module.css";
import serviceStyles from "./services-pricing-calculator.module.css";
import styles from "./three-d-printing-pricing-calculator.module.css";

type ThreeDPrintingQuickIntakeProps = Readonly<{
  onAddQuotationLine?: (line: QuotationLineDraft) => void;
  initialValues?: ThreeDPrintingQuickFormValues;
}>;

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const QUICK_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  "3D printing quick approximate size is required.":
    "Ingresa el tamaño aproximado solicitado.",
  "3D printing quick piece description is required.":
    "Describe brevemente la pieza solicitada.",
  "3D printing quick material must be valid.": "Selecciona un material.",
  "3D printing quick quantity is required.": "Ingresa la cantidad.",
  "3D printing quick quantity must be a finite number.":
    "La cantidad debe ser un número válido.",
  "3D printing quick quantity must be a positive integer.":
    "La cantidad debe ser un entero mayor que cero.",
  "3D printing quick modeling option must be valid.":
    "Selecciona una opción de modelado.",
  "3D printing quick color mode must be valid.":
    "Selecciona un tipo de impresión.",
  [THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_REQUIRED_ERROR]:
    "Ingresa el precio estimado total.",
  [THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_FINITE_ERROR]:
    "El precio estimado total debe ser un número válido.",
  [THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_POSITIVE_ERROR]:
    "El precio estimado total debe ser mayor que cero.",
  [THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_MINIMUM_ERROR]:
    "El precio estimado total debe ser de al menos COP 5.000.",
  [THREE_D_PRINTING_QUICK_ESTIMATED_TOTAL_RANGE_ERROR]:
    "El precio estimado total está fuera del rango permitido.",
};

function translateQuickError(error: RangeError): string {
  return (
    QUICK_ERROR_MESSAGES[error.message] ??
    "Revisa los datos preliminares e inténtalo nuevamente."
  );
}

export function ThreeDPrintingQuickIntake({
  onAddQuotationLine,
  initialValues,
}: ThreeDPrintingQuickIntakeProps = {}) {
  const idPrefix = useId();
  const [values, setValues] = useState<ThreeDPrintingQuickFormValues>(
    () => initialValues ?? createInitialThreeDPrintingQuickFormValues(),
  );
  const [result, setResult] =
    useState<ResolvedThreeDPrintingQuickForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addFeedbackSequence, setAddFeedbackSequence] = useState(0);

  function clearFeedback() {
    setResult(null);
    setError(null);
    setAddFeedbackSequence(0);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setResult(resolveThreeDPrintingQuickFormValues(values));
      setError(null);
      setAddFeedbackSequence(0);
    } catch (caughtError: unknown) {
      setResult(null);
      setAddFeedbackSequence(0);
      setError(
        caughtError instanceof RangeError
          ? translateQuickError(caughtError)
          : "No fue posible aceptar la estimación. Inténtalo de nuevo.",
      );
    }
  }

  function handleTextChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.currentTarget.name as ThreeDPrintingQuickTextField;
    const value = event.currentTarget.value;

    if (
      field !== "approximateSize" &&
      field !== "pieceDescription" &&
      field !== "quantity" &&
      field !== "estimatedTotalCop"
    ) {
      return;
    }

    setValues((current) =>
      changeThreeDPrintingQuickTextField(current, field, value),
    );
    clearFeedback();
  }

  function handleMaterialChange(event: ChangeEvent<HTMLSelectElement>) {
    const materialId = event.currentTarget.value;

    if (!isThreeDPrintingMaterialId(materialId)) {
      return;
    }

    setValues((current) =>
      changeThreeDPrintingQuickMaterial(current, materialId),
    );
    clearFeedback();
  }

  function handleModelingChange(event: ChangeEvent<HTMLSelectElement>) {
    const modelingId = event.currentTarget.value;

    if (!isThreeDPrintingModelingId(modelingId)) {
      return;
    }

    setValues((current) =>
      changeThreeDPrintingQuickModeling(current, modelingId),
    );
    clearFeedback();
  }

  function handleColorModeChange(event: ChangeEvent<HTMLSelectElement>) {
    const colorModeId = event.currentTarget.value;

    if (!isThreeDPrintingColorModeId(colorModeId)) {
      return;
    }

    setValues((current) =>
      changeThreeDPrintingQuickColorMode(current, colorModeId),
    );
    clearFeedback();
  }

  function handleReset() {
    setValues(createInitialThreeDPrintingQuickFormValues());
    clearFeedback();
  }

  function handleAddQuotationLine() {
    if (result === null || onAddQuotationLine === undefined) {
      return;
    }

    onAddQuotationLine(createThreeDPrintingQuickQuotationLineDraft(result));
    setAddFeedbackSequence((sequence) => sequence + 1);
  }

  return (
    <div className={formStyles.calculator}>
      <form
        className={formStyles.form}
        onSubmit={handleSubmit}
        onReset={handleReset}
        noValidate
      >
        <div className={formStyles.formHeading}>
          <div>
            <p className={formStyles.kicker}>Datos preliminares</p>
            <h3>Impresión 3D: estimación rápida</h3>
          </div>
          <p className={formStyles.requiredNote}>Referencia para atención inicial</p>
        </div>

        <p className={styles.preliminaryNotice}>
          {THREE_D_PRINTING_PRELIMINARY_NOTICE}
        </p>

        <div className={formStyles.fields}>
          <div className={formStyles.field}>
            <label htmlFor={`${idPrefix}-approximate-size`}>
              Tamaño aproximado
            </label>
            <input
              className={styles.textInput}
              id={`${idPrefix}-approximate-size`}
              name="approximateSize"
              type="text"
              value={values.approximateSize}
              onChange={handleTextChange}
              placeholder="Ej. 15 cm de alto"
              required
            />
            <p className={formStyles.fieldHelp}>
              Dato de referencia; no se usa para inferir compatibilidad.
            </p>
          </div>

          <div className={formStyles.field}>
            <label htmlFor={`${idPrefix}-material`}>Material</label>
            <select
              id={`${idPrefix}-material`}
              name="materialId"
              value={values.materialId}
              onChange={handleMaterialChange}
            >
              {THREE_D_PRINTING_MATERIAL_OPTIONS.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`${formStyles.field} ${serviceStyles.wideField}`}>
            <label htmlFor={`${idPrefix}-piece-description`}>
              Tipo de pieza / descripción breve
            </label>
            <textarea
              className={styles.quickTextArea}
              id={`${idPrefix}-piece-description`}
              name="pieceDescription"
              value={values.pieceDescription}
              onChange={handleTextChange}
              placeholder="Describe brevemente la pieza solicitada"
              rows={3}
              required
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor={`${idPrefix}-quantity`}>Cantidad</label>
            <div
              className={`${formStyles.inputShell} ${serviceStyles.quantityShell}`}
            >
              <input
                id={`${idPrefix}-quantity`}
                name="quantity"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={values.quantity}
                onChange={handleTextChange}
                required
              />
              <span aria-hidden="true">unidades</span>
            </div>
          </div>

          <div className={formStyles.field}>
            <label htmlFor={`${idPrefix}-modeling`}>Modelado</label>
            <select
              id={`${idPrefix}-modeling`}
              name="modelingId"
              value={values.modelingId}
              onChange={handleModelingChange}
            >
              {THREE_D_PRINTING_MODELING_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.field}>
            <label htmlFor={`${idPrefix}-color-mode`}>Tipo de impresión</label>
            <select
              id={`${idPrefix}-color-mode`}
              name="colorModeId"
              value={values.colorModeId}
              onChange={handleColorModeChange}
            >
              {THREE_D_PRINTING_COLOR_MODE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {values.colorModeId ===
            THREE_D_PRINTING_COLOR_MODE_IDS.multicolor ? (
              <p className={formStyles.fieldHelp}>
                La producción multicolor requiere HI.
              </p>
            ) : null}
          </div>

          <div className={`${formStyles.field} ${serviceStyles.wideField}`}>
            <label htmlFor={`${idPrefix}-estimated-total`}>
              Precio estimado total
            </label>
            <div className={formStyles.inputShell}>
              <input
                id={`${idPrefix}-estimated-total`}
                name="estimatedTotalCop"
                type="number"
                inputMode="decimal"
                min="5000"
                step="any"
                value={values.estimatedTotalCop}
                onChange={handleTextChange}
                placeholder="Total preliminar del trabajo completo"
                aria-describedby={`${idPrefix}-estimated-total-help`}
                required
              />
              <span aria-hidden="true">COP</span>
            </div>
            <p
              id={`${idPrefix}-estimated-total-help`}
              className={formStyles.fieldHelp}
            >
              Ingresa un valor preliminar para el trabajo completo. La cantidad
              ya debe estar contemplada en este total.
            </p>
          </div>
        </div>

        <div className={formStyles.actions}>
          <button className={formStyles.primaryButton} type="submit">
            Aceptar estimación
          </button>
          <button className={formStyles.secondaryButton} type="reset">
            Limpiar
          </button>
        </div>

        <div
          className={formStyles.errorRegion}
          aria-live="assertive"
          aria-atomic="true"
        >
          {error ? (
            <p className={formStyles.error} role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          ) : null}
        </div>
      </form>

      <section
        className={formStyles.results}
        aria-label="Resultado de la estimación rápida"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={formStyles.resultHeading}>
          <p className={formStyles.kicker}>Resultado</p>
          <h3>Referencia preliminar</h3>
        </div>

        {result ? (
          <>
            <dl className={formStyles.priceList}>
              <div className={formStyles.priceItem}>
                <dt>Tamaño aproximado</dt>
                <dd className={serviceStyles.textValue}>
                  {result.approximateSize}
                </dd>
              </div>
              <div className={formStyles.priceItem}>
                <dt>Descripción</dt>
                <dd className={serviceStyles.textValue}>
                  {result.pieceDescription}
                </dd>
              </div>
              <div className={formStyles.priceItem}>
                <dt>Material</dt>
                <dd className={serviceStyles.textValue}>
                  {getThreeDPrintingMaterialConfig(result.materialId).name}
                </dd>
              </div>
              <div className={formStyles.priceItem}>
                <dt>Cantidad</dt>
                <dd>{result.quantity}</dd>
              </div>
              <div className={formStyles.priceItem}>
                <dt>Modelado</dt>
                <dd className={serviceStyles.textValue}>
                  {getThreeDPrintingModelingOption(result.modelingId).name}
                </dd>
              </div>
              <div className={formStyles.priceItem}>
                <dt>Tipo de impresión</dt>
                <dd className={serviceStyles.textValue}>
                  {getThreeDPrintingColorMode(result.colorModeId).name}
                </dd>
              </div>
              {result.colorModeId ===
              THREE_D_PRINTING_COLOR_MODE_IDS.multicolor ? (
                <div className={formStyles.priceItem}>
                  <dt>Producción</dt>
                  <dd className={serviceStyles.textValue}>HI</dd>
                </div>
              ) : null}
              <div className={formStyles.priceItemFeatured}>
                <dt>Precio estimado total</dt>
                <dd>
                  <data value={result.acceptedEstimatedTotal}>
                    {priceFormatter.format(result.acceptedEstimatedTotal)}
                  </data>
                </dd>
                <dd className={formStyles.priceItemNote}>
                  Total preliminar del trabajo completo
                </dd>
              </div>
            </dl>
            <p className={styles.quickCondition}>
              {THREE_D_PRINTING_QUICK_ESTIMATE_CONDITION}
            </p>
          </>
        ) : (
          <div className={styles.quickScope}>
            <p>{THREE_D_PRINTING_PRELIMINARY_NOTICE}</p>
            <p>
              Este modo no calcula gramos, tiempo de impresión ni precio a
              partir del tamaño. El empleado ingresa el total preliminar para
              el trabajo completo.
            </p>
          </div>
        )}

        {onAddQuotationLine ? (
          <div className={formStyles.quotationAction}>
            <button
              className={formStyles.primaryButton}
              type="button"
              aria-label="Agregar estimación preliminar de Impresión 3D a la cotización"
              onClick={handleAddQuotationLine}
              disabled={result === null}
            >
              Agregar estimación a la cotización
            </button>
            <p
              key={addFeedbackSequence}
              className={formStyles.quotationFeedback}
              aria-live="polite"
              aria-atomic="true"
            >
              {addFeedbackSequence > 0
                ? "Estimación agregada a la cotización."
                : ""}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
