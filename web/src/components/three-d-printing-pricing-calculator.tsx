"use client";

import { type ChangeEvent, type FormEvent, useId, useState } from "react";

import {
  calculateThreeDPrintingPrice,
  formatThreeDPrintingDuration,
  requiresThreeDPrintingManualPriceAuthorization,
  THREE_D_PRINTING_ABSOLUTE_MINIMUM_ERROR,
  THREE_D_PRINTING_AUTHORIZATION_REQUIRED_ERROR,
  type ThreeDPrintingPriceCalculation,
} from "@/lib/pricing/calculate-three-d-printing-price";
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
  getThreeDPrintingPrinter,
  isThreeDPrintingPrinterId,
  THREE_D_PRINTING_PRINTER_IDS,
  THREE_D_PRINTING_PRINTER_OPTIONS,
} from "@/lib/pricing/three-d-printing-printer";
import { createThreeDPrintingQuotationLineDraft } from "@/lib/pricing/three-d-printing-quotation-line";
import {
  changeThreeDPrintingBelowThresholdAuthorization,
  changeThreeDPrintingColorMode,
  changeThreeDPrintingManualPriceEnabled,
  changeThreeDPrintingMaterial,
  changeThreeDPrintingModeling,
  changeThreeDPrintingPrinter,
  changeThreeDPrintingTextField,
  clearThreeDPrintingBelowThresholdAuthorization,
  createInitialThreeDPrintingPricingFormValues,
  resolveThreeDPrintingPricingFormValues,
  type ResolvedThreeDPrintingForm,
  type ThreeDPrintingPricingFormValues,
  type ThreeDPrintingTextField,
} from "@/lib/pricing/three-d-printing-selection";
import {
  isThreeDPrintingSubmodeId,
  THREE_D_PRINTING_SUBMODE_IDS,
  THREE_D_PRINTING_SUBMODE_OPTIONS,
  type ThreeDPrintingSubmodeId,
} from "@/lib/pricing/three-d-printing-submode";
import type { QuotationLineDraft } from "@/lib/pricing/temporary-quotation";

import formStyles from "./area-pricing-calculator.module.css";
import serviceStyles from "./services-pricing-calculator.module.css";
import { ThreeDPrintingQuickIntake } from "./three-d-printing-quick-intake";
import styles from "./three-d-printing-pricing-calculator.module.css";

type ThreeDPrintingPricingCalculatorProps = Readonly<{
  onAddQuotationLine?: (line: QuotationLineDraft) => void;
  initialValues?: ThreeDPrintingPricingFormValues;
  initialSubmodeId?: ThreeDPrintingSubmodeId;
}>;

type ThreeDPrintingUiResult = Readonly<{
  calculation: ThreeDPrintingPriceCalculation;
  resolvedForm: ResolvedThreeDPrintingForm;
}>;

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const measurementFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 3,
});

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  "3D printing material must be valid.": "Selecciona un material.",
  "3D printing color mode must be valid.":
    "Selecciona un tipo de impresión.",
  "3D printing production printer must be valid.":
    "Selecciona una impresora de producción.",
  "3D printing multicolor production requires HI.":
    "La producción multicolor requiere la impresora HI.",
  "3D printing modeling option must be valid.":
    "Selecciona una opción de modelado.",
  "3D printing grams per unit is required.": "Ingresa los gramos por unidad.",
  "3D printing grams per unit must be a finite number.":
    "Los gramos por unidad deben ser un número válido.",
  "3D printing grams per unit must be a finite non-negative number.":
    "Los gramos por unidad deben ser mayores o iguales que cero.",
  "3D printing hours is required.": "Ingresa las horas por unidad.",
  "3D printing hours must be a finite number.":
    "Las horas por unidad deben ser un número válido.",
  "3D printing hours must be a non-negative integer.":
    "Las horas por unidad deben ser un entero mayor o igual que cero.",
  "3D printing minutes is required.": "Ingresa los minutos por unidad.",
  "3D printing minutes must be a finite number.":
    "Los minutos por unidad deben ser un número válido.",
  "3D printing minutes must be an integer from 0 to 59.":
    "Los minutos por unidad deben estar entre 0 y 59.",
  "3D printing quantity is required.": "Ingresa la cantidad.",
  "3D printing quantity must be a finite number.":
    "La cantidad debe ser un número válido.",
  "3D printing quantity must be a positive integer.":
    "La cantidad debe ser un entero mayor que cero.",
  "3D printing work must include material or printing time.":
    "La impresión debe incluir gramos o tiempo de impresión.",
  "3D printing manual price is required.": "Ingresa el precio personalizado.",
  "3D printing manual price must be a finite number.":
    "El precio personalizado debe ser un número válido.",
  "3D printing manual price must be a finite positive number.":
    "El precio personalizado debe ser mayor que cero.",
  [THREE_D_PRINTING_AUTHORIZATION_REQUIRED_ERROR]:
    "Este precio requiere autorización.",
  [THREE_D_PRINTING_ABSOLUTE_MINIMUM_ERROR]:
    "El precio personalizado debe ser de al menos COP 5.000.",
  "3D printing calculation is outside the supported range.":
    "Los datos ingresados producen un total fuera del rango permitido.",
  "3D printing final price is outside the supported range.":
    "Los datos ingresados producen un precio fuera del rango permitido.",
};

function translateError(error: RangeError): string {
  return (
    ERROR_MESSAGES[error.message] ??
    "Revisa los datos ingresados e inténtalo nuevamente."
  );
}

function resolveAuthorizationRequired(
  values: ThreeDPrintingPricingFormValues,
): boolean {
  if (!values.manualPriceEnabled) {
    return false;
  }

  try {
    return requiresThreeDPrintingManualPriceAuthorization(
      resolveThreeDPrintingPricingFormValues(values).pricingInput,
    );
  } catch {
    return false;
  }
}

export function ThreeDPrintingPricingCalculator({
  onAddQuotationLine,
  initialValues,
  initialSubmodeId = THREE_D_PRINTING_SUBMODE_IDS.precise,
}: ThreeDPrintingPricingCalculatorProps = {}) {
  const idPrefix = useId();
  const [submodeId, setSubmodeId] =
    useState<ThreeDPrintingSubmodeId>(initialSubmodeId);
  const [values, setValues] = useState<ThreeDPrintingPricingFormValues>(
    () => initialValues ?? createInitialThreeDPrintingPricingFormValues(),
  );
  const [result, setResult] = useState<ThreeDPrintingUiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addFeedbackSequence, setAddFeedbackSequence] = useState(0);
  const authorizationRequired = resolveAuthorizationRequired(values);

  function clearFeedback() {
    setResult(null);
    setError(null);
    setAddFeedbackSequence(0);
  }

  function handleSubmodeChange(event: ChangeEvent<HTMLInputElement>) {
    const nextSubmodeId = event.currentTarget.value;

    if (!isThreeDPrintingSubmodeId(nextSubmodeId)) {
      return;
    }

    setSubmodeId(nextSubmodeId);
    setValues(clearThreeDPrintingBelowThresholdAuthorization);
    clearFeedback();
  }

  function handleMaterialChange(event: ChangeEvent<HTMLSelectElement>) {
    const materialId = isThreeDPrintingMaterialId(event.currentTarget.value)
      ? event.currentTarget.value
      : "";
    setValues((current) => changeThreeDPrintingMaterial(current, materialId));
    clearFeedback();
  }

  function handleModelingChange(event: ChangeEvent<HTMLSelectElement>) {
    const modelingId = event.currentTarget.value;
    if (!isThreeDPrintingModelingId(modelingId)) {
      return;
    }

    setValues((current) => changeThreeDPrintingModeling(current, modelingId));
    clearFeedback();
  }

  function handleColorModeChange(event: ChangeEvent<HTMLSelectElement>) {
    const colorModeId = event.currentTarget.value;
    if (!isThreeDPrintingColorModeId(colorModeId)) {
      return;
    }

    setValues((current) =>
      changeThreeDPrintingColorMode(current, colorModeId),
    );
    clearFeedback();
  }

  function handlePrinterChange(event: ChangeEvent<HTMLSelectElement>) {
    const printerId = event.currentTarget.value;
    if (!isThreeDPrintingPrinterId(printerId)) {
      return;
    }

    setValues((current) => changeThreeDPrintingPrinter(current, printerId));
    clearFeedback();
  }

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as ThreeDPrintingTextField;
    const value = event.currentTarget.value;
    const acceptedFields: readonly ThreeDPrintingTextField[] = [
      "gramsPerUnit",
      "printingHoursPerUnit",
      "printingMinutesPerUnit",
      "quantity",
      "manualPriceCop",
    ];

    if (!acceptedFields.includes(field)) {
      return;
    }

    setValues((current) =>
      changeThreeDPrintingTextField(current, field, value),
    );
    clearFeedback();
  }

  function handleManualPriceEnabled(event: ChangeEvent<HTMLInputElement>) {
    const enabled = event.currentTarget.checked;
    setValues((current) =>
      changeThreeDPrintingManualPriceEnabled(current, enabled),
    );
    clearFeedback();
  }

  function handleAuthorizationChange(event: ChangeEvent<HTMLInputElement>) {
    const belowThresholdAuthorized = event.currentTarget.checked;
    setValues((current) =>
      changeThreeDPrintingBelowThresholdAuthorization(
        current,
        belowThresholdAuthorized,
      ),
    );
    clearFeedback();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const resolvedForm = resolveThreeDPrintingPricingFormValues(values);
      const calculation = calculateThreeDPrintingPrice(
        resolvedForm.pricingInput,
      );
      setResult(Object.freeze({ calculation, resolvedForm }));
      setError(null);
      setAddFeedbackSequence(0);
    } catch (caughtError: unknown) {
      setResult(null);
      setAddFeedbackSequence(0);
      setError(
        caughtError instanceof RangeError
          ? translateError(caughtError)
          : "No fue posible calcular el precio. Inténtalo de nuevo.",
      );
    }
  }

  function handleReset() {
    setValues(createInitialThreeDPrintingPricingFormValues());
    clearFeedback();
  }

  function handleAddQuotationLine() {
    if (result === null || onAddQuotationLine === undefined) {
      return;
    }

    onAddQuotationLine(createThreeDPrintingQuotationLineDraft(result));
    setAddFeedbackSequence((sequence) => sequence + 1);
  }

  return (
    <div>
      <fieldset className={styles.submodeSelector}>
        <legend>Flujo de impresión 3D</legend>
        <div className={styles.submodeOptions}>
          {THREE_D_PRINTING_SUBMODE_OPTIONS.map((option) => (
            <label key={option.id} htmlFor={`${idPrefix}-${option.id}`}>
              <input
                id={`${idPrefix}-${option.id}`}
                type="radio"
                name={`${idPrefix}-three-d-printing-submode`}
                value={option.id}
                checked={submodeId === option.id}
                onChange={handleSubmodeChange}
              />
              <span>
                <strong>{option.name}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {submodeId === THREE_D_PRINTING_SUBMODE_IDS.quick ? (
        <ThreeDPrintingQuickIntake
          onAddQuotationLine={onAddQuotationLine}
        />
      ) : (
        <div className={formStyles.calculator}>
          <form
            className={formStyles.form}
            onSubmit={handleSubmit}
            onReset={handleReset}
            noValidate
          >
            <div className={formStyles.formHeading}>
              <div>
                <p className={formStyles.kicker}>Datos de entrada</p>
                <h3>Impresión 3D: cotización precisa</h3>
              </div>
              <p className={formStyles.requiredNote}>
                Completa los campos obligatorios
              </p>
            </div>

            <div className={formStyles.fields}>
              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-material`}>Material</label>
                <select
                  id={`${idPrefix}-material`}
                  name="materialId"
                  value={values.materialId}
                  onChange={handleMaterialChange}
                  required
                >
                  <option value="">Selecciona un material</option>
                  {THREE_D_PRINTING_MATERIAL_OPTIONS.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-grams`}>Gramos por unidad</label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-grams`}
                    name="gramsPerUnit"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={values.gramsPerUnit}
                    onChange={handleTextChange}
                    placeholder="100"
                    required
                  />
                  <span aria-hidden="true">g</span>
                </div>
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-hours`}>
                  Horas de impresión por unidad
                </label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-hours`}
                    name="printingHoursPerUnit"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={values.printingHoursPerUnit}
                    onChange={handleTextChange}
                    placeholder="5"
                    required
                  />
                  <span aria-hidden="true">h</span>
                </div>
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-minutes`}>
                  Minutos de impresión por unidad
                </label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-minutes`}
                    name="printingMinutesPerUnit"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    step="1"
                    value={values.printingMinutesPerUnit}
                    onChange={handleTextChange}
                    placeholder="0"
                    required
                  />
                  <span aria-hidden="true">min</span>
                </div>
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
                    placeholder="1"
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
                  required
                >
                  {THREE_D_PRINTING_MODELING_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-color-mode`}>
                  Tipo de impresión
                </label>
                <select
                  id={`${idPrefix}-color-mode`}
                  name="colorModeId"
                  value={values.colorModeId}
                  onChange={handleColorModeChange}
                  required
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
                    Multicolor se produce únicamente en HI.
                  </p>
                ) : null}
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-printer`}>Impresora</label>
                <select
                  id={`${idPrefix}-printer`}
                  name="printerId"
                  value={values.printerId}
                  onChange={handlePrinterChange}
                  required
                >
                  {THREE_D_PRINTING_PRINTER_OPTIONS.map((printer) => (
                    <option
                      key={printer.id}
                      value={printer.id}
                      disabled={
                        values.colorModeId ===
                          THREE_D_PRINTING_COLOR_MODE_IDS.multicolor &&
                        printer.id === THREE_D_PRINTING_PRINTER_IDS.ke
                      }
                    >
                      {printer.name}
                    </option>
                  ))}
                </select>
                <p className={formStyles.fieldHelp}>
                  Impresora seleccionada para producir el trabajo.
                </p>
              </div>

              <fieldset className={formStyles.structureOptions}>
                <legend>Precio</legend>
                <label>
                  <input
                    type="checkbox"
                    name="manualPriceEnabled"
                    checked={values.manualPriceEnabled}
                    onChange={handleManualPriceEnabled}
                  />
                  <span>Modificar precio</span>
                </label>
              </fieldset>

              {values.manualPriceEnabled ? (
                <div
                  className={`${formStyles.field} ${serviceStyles.wideField}`}
                >
                  <label htmlFor={`${idPrefix}-manual-price`}>
                    Precio personalizado
                  </label>
                  <div className={formStyles.inputShell}>
                    <input
                      id={`${idPrefix}-manual-price`}
                      name="manualPriceCop"
                      type="number"
                      inputMode="decimal"
                      min="5000"
                      step="any"
                      value={values.manualPriceCop}
                      onChange={handleTextChange}
                      placeholder="Precio final del trabajo"
                      required
                      aria-describedby={
                        authorizationRequired
                          ? `${idPrefix}-authorization`
                          : undefined
                      }
                    />
                    <span aria-hidden="true">COP</span>
                  </div>
                </div>
              ) : null}

              {authorizationRequired ? (
                <div
                  id={`${idPrefix}-authorization`}
                  className={`${serviceStyles.minimumWarning} ${serviceStyles.wideField}`}
                >
                  <strong>Este precio requiere autorización.</strong>
                  <label>
                    <input
                      type="checkbox"
                      name="belowThresholdAuthorized"
                      checked={values.belowThresholdAuthorized}
                      onChange={handleAuthorizationChange}
                    />
                    <span>Confirmo que este precio está autorizado</span>
                  </label>
                </div>
              ) : null}

              <p className={serviceStyles.threeDPrintingNotice}>
                Usa los gramos y el tiempo reales entregados por el laminador
                para una unidad. La cantidad multiplica esas medidas; el
                modelado se cobra una sola vez por trabajo.
              </p>
            </div>

            <div className={formStyles.actions}>
              <button className={formStyles.primaryButton} type="submit">
                Calcular precio
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
            aria-label="Resultado de impresión 3D"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className={formStyles.resultHeading}>
              <p className={formStyles.kicker}>Resultado</p>
              <h3>Resumen comercial</h3>
            </div>

            {result ? (
              <dl className={formStyles.priceList}>
                <div className={formStyles.priceItem}>
                  <dt>Producto</dt>
                  <dd className={serviceStyles.textValue}>Impresión 3D</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Material</dt>
                  <dd className={serviceStyles.textValue}>
                    {
                      getThreeDPrintingMaterialConfig(
                        result.calculation.materialId,
                      ).name
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Gramos por unidad</dt>
                  <dd>
                    {measurementFormatter.format(
                      result.calculation.gramsPerUnit,
                    )} g
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Tiempo de impresión por unidad</dt>
                  <dd className={serviceStyles.textValue}>
                    {formatThreeDPrintingDuration(
                      result.calculation.printingHoursPerUnit,
                      result.calculation.printingMinutesPerUnit,
                    )}
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Cantidad</dt>
                  <dd>{result.calculation.quantity}</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Modelado</dt>
                  <dd className={serviceStyles.textValue}>
                    {
                      getThreeDPrintingModelingOption(
                        result.calculation.modelingId,
                      ).name
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Tipo de impresión</dt>
                  <dd className={serviceStyles.textValue}>
                    {
                      getThreeDPrintingColorMode(
                        result.calculation.colorModeId,
                      ).name
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Impresora</dt>
                  <dd className={serviceStyles.textValue}>
                    {getThreeDPrintingPrinter(result.resolvedForm.printerId).name}
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio comercial sugerido</dt>
                  <dd>
                    <data value={result.calculation.suggestedPrice}>
                      {priceFormatter.format(result.calculation.suggestedPrice)}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Estado del precio</dt>
                  <dd className={serviceStyles.textValue}>
                    {result.calculation.priceSource === "manual"
                      ? "Precio modificado"
                      : "Precio sugerido"}
                  </dd>
                </div>
                <div className={formStyles.priceItemFeatured}>
                  <dt>Total final</dt>
                  <dd>
                    <data value={result.calculation.totalPrice}>
                      {priceFormatter.format(result.calculation.totalPrice)}
                    </data>
                  </dd>
                  <dd className={formStyles.priceItemNote}>
                    Precio comercial final
                  </dd>
                </div>
              </dl>
            ) : (
              <div className={formStyles.emptyResult}>
                <span aria-hidden="true">COP</span>
                <p>Completa los datos y calcula para ver el resumen comercial.</p>
              </div>
            )}

            {result && onAddQuotationLine ? (
              <div className={formStyles.quotationAction}>
                <button
                  className={formStyles.primaryButton}
                  type="button"
                  aria-label="Agregar Impresión 3D a la cotización"
                  onClick={handleAddQuotationLine}
                >
                  Agregar a la cotización
                </button>
                <p
                  key={addFeedbackSequence}
                  className={formStyles.quotationFeedback}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {addFeedbackSequence > 0
                    ? "Agregado a la cotización."
                    : ""}
                </p>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
