"use client";

import { type ChangeEvent, type FormEvent, useId, useState } from "react";

import {
  calculateFixedPriceService,
  type FixedPriceCalculation,
} from "@/lib/pricing/calculate-fixed-price-service";
import {
  calculateSoftwareInstallationPrice,
  getSoftwareInstallationPricingTier,
  type SoftwareInstallationPriceCalculation,
} from "@/lib/pricing/calculate-software-installation-price";
import {
  calculateVideoEditingPrice,
  type VideoEditingPriceCalculation,
  VIDEO_EDITING_PRICING,
} from "@/lib/pricing/calculate-video-editing-price";
import { changeMaintenanceSelection } from "@/lib/pricing/computer-service-selection";
import {
  MAINTENANCE_OPTION_IDS,
  MAINTENANCE_OPTIONS,
  type FixedPriceComputerService,
  type MaintenanceComputerService,
  type MaintenanceOptionId,
  type QuantityTierComputerService,
  SYSTEM_MAINTENANCE_INCLUSIONS,
} from "@/lib/pricing/computer-service-catalog";
import {
  calculateMaintenancePrice,
  resolveMaintenancePrice,
  type MaintenancePriceCalculation,
} from "@/lib/pricing/resolve-maintenance-price";
import {
  AUDIOVISUAL_SERVICE_IDS,
  getService,
  getServiceCategory,
  getServicesForCategory,
  isServiceCategoryId,
  isServiceIdForCategory,
  SERVICE_CATEGORY_CATALOG,
  type ServiceCategory,
  type ServiceCategoryId,
  type VideoEditingService,
} from "@/lib/pricing/service-catalog";
import {
  changeServiceCategorySelection,
  changeServiceSelection,
  createInitialServicesPricingFormState,
  type ServicesPricingFormState,
} from "@/lib/pricing/service-selection";
import { parsePositiveIntegerQuantity } from "@/lib/pricing/service-quantity";
import { parseVideoDuration } from "@/lib/pricing/video-duration";

import formStyles from "./area-pricing-calculator.module.css";
import styles from "./services-pricing-calculator.module.css";

type ResultBase = Readonly<{
  category: ServiceCategory;
}>;

type MaintenanceServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "maintenance-selection";
    service: MaintenanceComputerService;
    calculation: MaintenancePriceCalculation;
  }>;

type FixedPriceServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "fixed-price";
    service: FixedPriceComputerService;
    calculation: FixedPriceCalculation;
  }>;

type QuantityTierServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "quantity-tier";
    service: QuantityTierComputerService;
    calculation: SoftwareInstallationPriceCalculation;
  }>;

type DurationServiceResult = ResultBase &
  Readonly<{
    pricingStrategy: "duration";
    service: VideoEditingService;
    calculation: VideoEditingPriceCalculation;
  }>;

type ServiceCalculationResult =
  | MaintenanceServiceResult
  | FixedPriceServiceResult
  | QuantityTierServiceResult
  | DurationServiceResult;

type ServicesPricingCalculatorProps = Readonly<{
  initialCategoryId?: ServiceCategoryId;
}>;

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const SERVICE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  "Quantity is required.": "Ingresa la cantidad.",
  "Quantity must be a valid number.":
    "La cantidad debe ser un número válido.",
  "Quantity must be an integer.": "La cantidad debe ser un número entero.",
  "Quantity must be greater than zero.":
    "La cantidad debe ser mayor que cero.",
  "Fixed-price total must be finite.":
    "La cantidad ingresada produce un total fuera del rango permitido.",
  "Software installation total must be finite.":
    "La cantidad ingresada produce un total fuera del rango permitido.",
  "Minutes are required.": "Ingresa los minutos.",
  "Seconds are required.": "Ingresa los segundos.",
  "Minutes must be a valid number.":
    "Los minutos deben ser un número válido.",
  "Seconds must be a valid number.":
    "Los segundos deben ser un número válido.",
  "Minutes must be non-negative.":
    "Los minutos deben ser mayores o iguales que cero.",
  "Seconds must be non-negative.":
    "Los segundos deben ser mayores o iguales que cero.",
  "Minutes must be an integer.": "Los minutos deben ser un número entero.",
  "Seconds must be an integer.": "Los segundos deben ser un número entero.",
  "Seconds must be between 0 and 59.":
    "Los segundos deben estar entre 0 y 59.",
  "Duration must be greater than zero.":
    "La duración total debe ser mayor que 0:00.",
  "Duration must be within the supported range.":
    "La duración ingresada está fuera del rango permitido.",
  "Video editing total must be a safe integer.":
    "La duración ingresada produce un total fuera del rango permitido.",
};

function translateServiceError(error: RangeError): string {
  return (
    SERVICE_ERROR_MESSAGES[error.message] ??
    "Revisa los datos ingresados e inténtalo nuevamente."
  );
}

function resolveSoftwareInstallationPreview(
  quantity: string,
): SoftwareInstallationPriceCalculation | null {
  try {
    return calculateSoftwareInstallationPrice(
      parsePositiveIntegerQuantity(quantity),
    );
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return null;
    }

    throw error;
  }
}

export function ServicesPricingCalculator({
  initialCategoryId,
}: ServicesPricingCalculatorProps = {}) {
  const idPrefix = useId();
  const [values, setValues] = useState<ServicesPricingFormState>(() =>
    createInitialServicesPricingFormState(initialCategoryId ?? ""),
  );
  const [result, setResult] = useState<ServiceCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = getServiceCategory(values.categoryId);
  const categoryServices = getServicesForCategory(values.categoryId);
  const selectedService = getService(values.categoryId, values.serviceId);
  const maintenanceValues =
    values.specificValues.pricingStrategy === "maintenance-selection"
      ? values.specificValues
      : null;
  const quantityValues =
    values.specificValues.pricingStrategy === "maintenance-selection" ||
    values.specificValues.pricingStrategy === "fixed-price" ||
    values.specificValues.pricingStrategy === "quantity-tier"
      ? values.specificValues
      : null;
  const durationValues =
    values.specificValues.pricingStrategy === "duration"
      ? values.specificValues
      : null;
  const maintenanceResolution =
    maintenanceValues !== null
      ? resolveMaintenancePrice(maintenanceValues.maintenance)
      : null;
  const softwareInstallationPreview =
    values.specificValues.pricingStrategy === "quantity-tier"
      ? resolveSoftwareInstallationPreview(values.specificValues.quantity)
      : null;
  const resolvedUnitPrice =
    selectedService?.pricingStrategy === "fixed-price"
      ? selectedService.unitPrice
      : selectedService?.pricingStrategy === "quantity-tier"
        ? softwareInstallationPreview?.unitPrice ?? null
        : selectedService?.pricingStrategy === "maintenance-selection"
          ? maintenanceResolution?.unitPrice ?? null
          : null;
  const resolvedTierName = softwareInstallationPreview
    ? getSoftwareInstallationPricingTier(softwareInstallationPreview.tierId)
        .name
    : null;

  function clearFeedback() {
    setResult(null);
    setError(null);
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value;
    const categoryId = isServiceCategoryId(value) ? value : "";

    setValues((currentValues) =>
      changeServiceCategorySelection(currentValues, categoryId),
    );
    clearFeedback();
  }

  function handleServiceChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value;
    const serviceId = isServiceIdForCategory(values.categoryId, value)
      ? value
      : "";

    setValues((currentValues) =>
      changeServiceSelection(currentValues, serviceId),
    );
    clearFeedback();
  }

  function handleQuantityChange(event: ChangeEvent<HTMLInputElement>) {
    const quantity = event.currentTarget.value;

    setValues((currentValues) => {
      const { specificValues } = currentValues;

      if (
        specificValues.pricingStrategy !== "maintenance-selection" &&
        specificValues.pricingStrategy !== "fixed-price" &&
        specificValues.pricingStrategy !== "quantity-tier"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: { ...specificValues, quantity },
      };
    });
    clearFeedback();
  }

  function handleMaintenanceChange(event: ChangeEvent<HTMLInputElement>) {
    const optionId = event.currentTarget.value as MaintenanceOptionId;
    const selected = event.currentTarget.checked;

    setValues((currentValues) => {
      if (
        currentValues.specificValues.pricingStrategy !==
        "maintenance-selection"
      ) {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: {
          ...currentValues.specificValues,
          maintenance: changeMaintenanceSelection(
            currentValues.specificValues.maintenance,
            optionId,
            selected,
          ),
        },
      };
    });
    clearFeedback();
  }

  function handleDurationChange(event: ChangeEvent<HTMLInputElement>) {
    const fieldName = event.currentTarget.name;
    const value = event.currentTarget.value;

    if (fieldName !== "minutes" && fieldName !== "seconds") {
      return;
    }

    setValues((currentValues) => {
      if (currentValues.specificValues.pricingStrategy !== "duration") {
        return currentValues;
      }

      return {
        ...currentValues,
        specificValues: {
          ...currentValues.specificValues,
          duration: {
            ...currentValues.specificValues.duration,
            [fieldName]: value,
          },
        },
      };
    });
    clearFeedback();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedCategory === null) {
      setResult(null);
      setError("Selecciona una categoría.");
      return;
    }

    if (selectedService === null) {
      setResult(null);
      setError("Selecciona un servicio.");
      return;
    }

    try {
      switch (selectedService.pricingStrategy) {
        case "maintenance-selection": {
          if (
            values.specificValues.pricingStrategy !== "maintenance-selection"
          ) {
            throw new Error("Service state does not match its strategy.");
          }

          const calculation = calculateMaintenancePrice(
            values.specificValues.maintenance,
            parsePositiveIntegerQuantity(values.specificValues.quantity),
          );

          if (calculation === null) {
            setResult(null);
            setError("Selecciona al menos una opción de mantenimiento.");
            return;
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation,
          });
          break;
        }
        case "fixed-price": {
          if (values.specificValues.pricingStrategy !== "fixed-price") {
            throw new Error("Service state does not match its strategy.");
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation: calculateFixedPriceService(
              selectedService.id,
              parsePositiveIntegerQuantity(values.specificValues.quantity),
            ),
          });
          break;
        }
        case "quantity-tier": {
          if (values.specificValues.pricingStrategy !== "quantity-tier") {
            throw new Error("Service state does not match its strategy.");
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation: calculateSoftwareInstallationPrice(
              parsePositiveIntegerQuantity(values.specificValues.quantity),
            ),
          });
          break;
        }
        case "duration": {
          if (values.specificValues.pricingStrategy !== "duration") {
            throw new Error("Service state does not match its strategy.");
          }

          setResult({
            pricingStrategy: selectedService.pricingStrategy,
            category: selectedCategory,
            service: selectedService,
            calculation: calculateVideoEditingPrice(
              parseVideoDuration(values.specificValues.duration),
            ),
          });
          break;
        }
      }

      setError(null);
    } catch (caughtError: unknown) {
      setResult(null);
      setError(
        caughtError instanceof RangeError
          ? translateServiceError(caughtError)
          : "No fue posible calcular el precio. Inténtalo de nuevo.",
      );
    }
  }

  function handleReset() {
    setValues(createInitialServicesPricingFormState());
    clearFeedback();
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
            <p className={formStyles.kicker}>Datos de entrada</p>
            <h3>Categoría, servicio y datos</h3>
          </div>
          <p className={formStyles.requiredNote}>
            Los campos visibles son obligatorios
          </p>
        </div>

        <div className={formStyles.fields}>
          <div className={`${formStyles.field} ${styles.wideField}`}>
            <label htmlFor={`${idPrefix}-category`}>Categoría</label>
            <select
              id={`${idPrefix}-category`}
              name="categoryId"
              value={values.categoryId}
              onChange={handleCategoryChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              {SERVICE_CATEGORY_CATALOG.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`${formStyles.field} ${styles.wideField}`}>
            <label htmlFor={`${idPrefix}-service`}>Servicio</label>
            <select
              id={`${idPrefix}-service`}
              name="serviceId"
              value={values.serviceId}
              onChange={handleServiceChange}
              disabled={selectedCategory === null}
              required
            >
              <option value="">Selecciona un servicio</option>
              {categoryServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory ? (
            <div className={styles.categoryCard} aria-live="polite">
              <span>Categoría seleccionada</span>
              <strong>{selectedCategory.name}</strong>
            </div>
          ) : null}

          {selectedService ? (
            <p className={styles.serviceDescription}>
              {selectedService.description}
            </p>
          ) : null}

          {selectedService?.pricingStrategy === "maintenance-selection" &&
          maintenanceValues !== null ? (
            <>
              <fieldset className={formStyles.structureOptions}>
                <legend>Opciones de mantenimiento</legend>
                {MAINTENANCE_OPTIONS.map((option) => (
                  <label key={option.id}>
                    <input
                      type="checkbox"
                      name="maintenanceOptions"
                      value={option.id}
                      checked={
                        option.id === MAINTENANCE_OPTION_IDS.physical
                          ? maintenanceValues.maintenance.physical
                          : maintenanceValues.maintenance.system
                      }
                      onChange={handleMaintenanceChange}
                    />
                    <span>{option.name}</span>
                  </label>
                ))}
              </fieldset>

              {maintenanceValues.maintenance.system ? (
                <div className={styles.inclusions}>
                  <strong>El mantenimiento de sistema incluye:</strong>
                  <ul>
                    {SYSTEM_MAINTENANCE_INCLUSIONS.map((inclusion) => (
                      <li key={inclusion}>{inclusion}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {selectedService?.pricingStrategy !== "duration" &&
          quantityValues !== null ? (
            <div className={`${formStyles.field} ${styles.wideField}`}>
              <label htmlFor={`${idPrefix}-service-quantity`}>
                Cantidad de {selectedService?.unit.plural}
              </label>
              <div
                className={`${formStyles.inputShell} ${styles.quantityShell}`}
              >
                <input
                  id={`${idPrefix}-service-quantity`}
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={quantityValues.quantity}
                  onChange={handleQuantityChange}
                  placeholder="1"
                  required
                />
                <span aria-hidden="true">{selectedService?.unit.plural}</span>
              </div>
            </div>
          ) : null}

          {selectedService?.id ===
            AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing &&
          durationValues !== null ? (
            <>
              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-video-minutes`}>Minutos</label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-video-minutes`}
                    name="minutes"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={durationValues.duration.minutes}
                    onChange={handleDurationChange}
                    placeholder="0"
                    required
                  />
                  <span aria-hidden="true">min</span>
                </div>
              </div>

              <div className={formStyles.field}>
                <label htmlFor={`${idPrefix}-video-seconds`}>Segundos</label>
                <div className={formStyles.inputShell}>
                  <input
                    id={`${idPrefix}-video-seconds`}
                    name="seconds"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    step="1"
                    value={durationValues.duration.seconds}
                    onChange={handleDurationChange}
                    placeholder="0"
                    required
                  />
                  <span aria-hidden="true">s</span>
                </div>
              </div>

              <p className={styles.durationNotice}>
                Cada minuto iniciado o fracción se cobra como un minuto
                completo. El cobro mínimo corresponde a un minuto.
              </p>
            </>
          ) : null}
        </div>

        {selectedService?.pricingStrategy !== "duration" ? (
          selectedService ? (
            <div className={formStyles.rateSummary} aria-live="polite">
              <span>Precio unitario resuelto</span>
              <strong>
                {resolvedUnitPrice === null
                  ? selectedService.pricingStrategy ===
                    "maintenance-selection"
                    ? "Selecciona el mantenimiento"
                    : "Ingresa una cantidad válida"
                  : priceFormatter.format(resolvedUnitPrice)}
              </strong>
            </div>
          ) : null
        ) : (
          <>
            <div className={formStyles.rateSummary}>
              <span>Precio del primer minuto</span>
              <strong>
                {priceFormatter.format(VIDEO_EDITING_PRICING.basePrice)}
              </strong>
            </div>
            <div className={formStyles.rateSummary}>
              <span>Precio por minuto adicional iniciado</span>
              <strong>
                {priceFormatter.format(
                  VIDEO_EDITING_PRICING.additionalMinutePrice,
                )}
              </strong>
            </div>
          </>
        )}

        {selectedService?.pricingStrategy === "quantity-tier" ? (
          <div className={formStyles.rateSummary} aria-live="polite">
            <span>Nivel de precio aplicado</span>
            <strong>{resolvedTierName ?? "Ingresa una cantidad válida"}</strong>
          </div>
        ) : null}

        {selectedService ? (
          selectedService.pricingStrategy === "duration" ? null : (
            <p className={formStyles.fieldHelp}>
              La cantidad debe ser un número entero mayor que cero.
            </p>
          )
        ) : null}

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
        aria-label="Resultado del servicio"
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
              <dt>Categoría</dt>
              <dd className={styles.textValue}>{result.category.name}</dd>
            </div>
            <div className={formStyles.priceItem}>
              <dt>Servicio</dt>
              <dd className={styles.textValue}>{result.service.name}</dd>
            </div>

            {result.pricingStrategy === "duration" ? (
              <>
                <div className={formStyles.priceItem}>
                  <dt>Duración real</dt>
                  <dd className={styles.textValue}>
                    <data value={result.calculation.totalSeconds}>
                      {result.calculation.enteredMinutes} min{" "}
                      {result.calculation.enteredSeconds} s
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Minutos cobrables</dt>
                  <dd>{result.calculation.billableMinutes}</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio del primer minuto</dt>
                  <dd>
                    <data value={result.calculation.basePrice}>
                      {priceFormatter.format(result.calculation.basePrice)}
                    </data>
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Minutos adicionales cobrables</dt>
                  <dd>{result.calculation.additionalBillableMinutes}</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Subtotal adicional</dt>
                  <dd>
                    <data value={result.calculation.additionalSubtotal}>
                      {priceFormatter.format(
                        result.calculation.additionalSubtotal,
                      )}
                    </data>
                  </dd>
                </div>
              </>
            ) : (
              <>
                {result.pricingStrategy === "maintenance-selection" ? (
                  <>
                    <div className={formStyles.priceItem}>
                      <dt>Opciones seleccionadas</dt>
                      <dd className={styles.textValue}>
                        {result.calculation.selectedOptionIds
                          .map(
                            (optionId) =>
                              MAINTENANCE_OPTIONS.find(
                                (option) => option.id === optionId,
                              )!.name,
                          )
                          .join(" y ")}
                      </dd>
                    </div>
                    {result.calculation.selectedOptionIds.includes(
                      MAINTENANCE_OPTION_IDS.system,
                    ) ? (
                      <div className={formStyles.priceItem}>
                        <dt>Inclusiones del mantenimiento de sistema</dt>
                        <dd className={styles.textValue}>
                          <ul className={styles.summaryList}>
                            {SYSTEM_MAINTENANCE_INCLUSIONS.map((inclusion) => (
                              <li key={inclusion}>{inclusion}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}
                    {result.calculation.packageName ? (
                      <div className={formStyles.priceItem}>
                        <dt>Paquete aplicado</dt>
                        <dd className={styles.textValue}>
                          {result.calculation.packageName}
                        </dd>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {result.pricingStrategy === "quantity-tier" ? (
                  <>
                    <div className={formStyles.priceItem}>
                      <dt>Alcance</dt>
                      <dd className={styles.textValue}>
                        {result.service.computerScope.name}
                      </dd>
                    </div>
                    <div className={formStyles.priceItem}>
                      <dt>Cantidad de programas</dt>
                      <dd>{result.calculation.programCount}</dd>
                    </div>
                    <div className={formStyles.priceItem}>
                      <dt>Nivel aplicado</dt>
                      <dd className={styles.textValue}>
                        {
                          getSoftwareInstallationPricingTier(
                            result.calculation.tierId,
                          ).name
                        }
                      </dd>
                    </div>
                    <div className={formStyles.priceItem}>
                      <dt>Precio unitario por programa</dt>
                      <dd>
                        <data value={result.calculation.unitPrice}>
                          {priceFormatter.format(result.calculation.unitPrice)}
                        </data>
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={formStyles.priceItem}>
                      <dt>Cantidad</dt>
                      <dd>{result.calculation.quantity}</dd>
                      <dd className={formStyles.priceItemNote}>
                        Unidad: {result.service.unit.singular}
                      </dd>
                    </div>
                    <div className={formStyles.priceItem}>
                      <dt>Precio unitario</dt>
                      <dd>
                        <data value={result.calculation.unitPrice}>
                          {priceFormatter.format(result.calculation.unitPrice)}
                        </data>
                      </dd>
                      <dd className={formStyles.priceItemNote}>
                        Por {result.service.unit.singular}
                      </dd>
                    </div>
                  </>
                )}
              </>
            )}

            <div className={formStyles.priceItemFeatured}>
              <dt>
                {result.pricingStrategy === "duration"
                  ? "Total final"
                  : "Precio total"}
              </dt>
              <dd>
                <data value={result.calculation.totalPrice}>
                  {priceFormatter.format(result.calculation.totalPrice)}
                </data>
              </dd>
              <dd className={formStyles.priceItemNote}>
                Precio final exacto, sin redondeo comercial
              </dd>
            </div>
          </dl>
        ) : (
          <div className={formStyles.emptyResult}>
            <span aria-hidden="true">COP</span>
            <p>Selecciona un servicio y calcula para ver el resumen comercial.</p>
          </div>
        )}
      </section>
    </div>
  );
}
