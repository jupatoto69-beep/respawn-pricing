"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useState,
} from "react";

import { calculateFixedPriceService } from "@/lib/pricing/calculate-fixed-price-service";
import {
  calculateSoftwareInstallationPrice,
  getSoftwareInstallationPricingTier,
  type SoftwareInstallationPriceCalculation,
} from "@/lib/pricing/calculate-software-installation-price";
import {
  changeComputerServiceSelection,
  changeMaintenanceSelection,
  createInitialComputerServiceFormState,
  type ComputerServiceFormState,
} from "@/lib/pricing/computer-service-selection";
import {
  COMPUTER_SERVICE_CATEGORY,
  COMPUTER_SERVICE_CATALOG,
  COMPUTER_SERVICE_IDS,
  getComputerService,
  isComputerServiceId,
  MAINTENANCE_OPTION_IDS,
  MAINTENANCE_OPTIONS,
  type MaintenanceOptionId,
  type ComputerService,
  SYSTEM_MAINTENANCE_INCLUSIONS,
} from "@/lib/pricing/computer-service-catalog";
import {
  calculateMaintenancePrice,
  resolveMaintenancePrice,
  type MaintenancePriceResolution,
} from "@/lib/pricing/resolve-maintenance-price";
import { parsePositiveIntegerQuantity } from "@/lib/pricing/service-quantity";

import formStyles from "./area-pricing-calculator.module.css";
import styles from "./services-pricing-calculator.module.css";

type ServiceCalculationResult = Readonly<{
  service: ComputerService;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  maintenance: MaintenancePriceResolution | null;
  softwareInstallation: SoftwareInstallationPriceCalculation | null;
}>;

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const QUANTITY_ERROR_MESSAGES: Readonly<Record<string, string>> = {
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
};

function translateServiceError(error: RangeError): string {
  return (
    QUANTITY_ERROR_MESSAGES[error.message] ??
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

export function ServicesPricingCalculator() {
  const idPrefix = useId();
  const [values, setValues] = useState<ComputerServiceFormState>(
    createInitialComputerServiceFormState,
  );
  const [result, setResult] = useState<ServiceCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedService = getComputerService(values.serviceId);
  const maintenanceResolution = resolveMaintenancePrice(values.maintenance);
  const softwareInstallationPreview =
    selectedService?.pricingStrategy === "quantity-tier"
      ? resolveSoftwareInstallationPreview(values.quantity)
      : null;
  const resolvedUnitPrice =
    selectedService?.pricingStrategy === "fixed-price"
      ? selectedService.unitPrice
      : selectedService?.pricingStrategy === "quantity-tier"
        ? softwareInstallationPreview?.unitPrice ?? null
        : maintenanceResolution?.unitPrice ?? null;
  const resolvedTierName = softwareInstallationPreview
    ? getSoftwareInstallationPricingTier(softwareInstallationPreview.tierId)
        .name
    : null;

  function clearFeedback() {
    setResult(null);
    setError(null);
  }

  function handleServiceChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value;
    const serviceId = isComputerServiceId(value) ? value : "";

    setValues((currentValues) =>
      changeComputerServiceSelection(currentValues, serviceId),
    );
    clearFeedback();
  }

  function handleQuantityChange(event: ChangeEvent<HTMLInputElement>) {
    const quantity = event.currentTarget.value;

    setValues((currentValues) => ({ ...currentValues, quantity }));
    clearFeedback();
  }

  function handleMaintenanceChange(event: ChangeEvent<HTMLInputElement>) {
    const optionId = event.currentTarget.value as MaintenanceOptionId;
    const selected = event.currentTarget.checked;

    setValues((currentValues) => ({
      ...currentValues,
      maintenance: changeMaintenanceSelection(
        currentValues.maintenance,
        optionId,
        selected,
      ),
    }));
    clearFeedback();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedService === null) {
      setResult(null);
      setError("Selecciona un servicio.");
      return;
    }

    try {
      const quantity = parsePositiveIntegerQuantity(values.quantity);

      if (selectedService.pricingStrategy === "maintenance-selection") {
        const calculation = calculateMaintenancePrice(
          values.maintenance,
          quantity,
        );

        if (calculation === null) {
          setResult(null);
          setError("Selecciona al menos una opción de mantenimiento.");
          return;
        }

        setResult({
          service: selectedService,
          quantity: calculation.quantity,
          unitPrice: calculation.unitPrice,
          totalPrice: calculation.totalPrice,
          maintenance: calculation,
          softwareInstallation: null,
        });
      } else if (selectedService.pricingStrategy === "fixed-price") {
        const calculation = calculateFixedPriceService(
          selectedService.id,
          quantity,
        );

        setResult({
          service: selectedService,
          quantity: calculation.quantity,
          unitPrice: calculation.unitPrice,
          totalPrice: calculation.totalPrice,
          maintenance: null,
          softwareInstallation: null,
        });
      } else {
        const calculation = calculateSoftwareInstallationPrice(quantity);

        setResult({
          service: selectedService,
          quantity: calculation.programCount,
          unitPrice: calculation.unitPrice,
          totalPrice: calculation.totalPrice,
          maintenance: null,
          softwareInstallation: calculation,
        });
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
    setValues(createInitialComputerServiceFormState());
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
            <h3>Servicio y cantidad</h3>
          </div>
          <p className={formStyles.requiredNote}>
            Los campos visibles son obligatorios
          </p>
        </div>

        <div className={formStyles.fields}>
          <div className={styles.categoryCard}>
            <span>Categoría</span>
            <strong>{COMPUTER_SERVICE_CATEGORY.name}</strong>
          </div>

          <div className={`${formStyles.field} ${styles.wideField}`}>
            <label htmlFor={`${idPrefix}-service`}>Servicio</label>
            <select
              id={`${idPrefix}-service`}
              name="serviceId"
              value={values.serviceId}
              onChange={handleServiceChange}
              required
            >
              <option value="">Selecciona un servicio</option>
              {COMPUTER_SERVICE_CATALOG.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedService ? (
            <p className={styles.serviceDescription}>
              {selectedService.description}
            </p>
          ) : null}

          {selectedService?.id === COMPUTER_SERVICE_IDS.maintenance ? (
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
                        ? values.maintenance.physical
                        : values.maintenance.system
                    }
                    onChange={handleMaintenanceChange}
                  />
                  <span>{option.name}</span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {selectedService?.id === COMPUTER_SERVICE_IDS.maintenance &&
          values.maintenance.system ? (
            <div className={styles.inclusions}>
              <strong>El mantenimiento de sistema incluye:</strong>
              <ul>
                {SYSTEM_MAINTENANCE_INCLUSIONS.map((inclusion) => (
                  <li key={inclusion}>{inclusion}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {selectedService ? (
            <div className={`${formStyles.field} ${styles.wideField}`}>
              <label htmlFor={`${idPrefix}-service-quantity`}>
                Cantidad de {selectedService.unit.plural}
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
                  value={values.quantity}
                  onChange={handleQuantityChange}
                  placeholder="1"
                  required
                />
                <span aria-hidden="true">{selectedService.unit.plural}</span>
              </div>
            </div>
          ) : null}
        </div>

        {selectedService ? (
          <div className={formStyles.rateSummary} aria-live="polite">
            <span>Precio unitario resuelto</span>
            <strong>
              {resolvedUnitPrice === null
                ? selectedService.pricingStrategy === "maintenance-selection"
                  ? "Selecciona el mantenimiento"
                  : "Ingresa una cantidad válida"
                : priceFormatter.format(resolvedUnitPrice)}
            </strong>
          </div>
        ) : null}

        {selectedService?.pricingStrategy === "quantity-tier" ? (
          <div className={formStyles.rateSummary} aria-live="polite">
            <span>Nivel de precio aplicado</span>
            <strong>{resolvedTierName ?? "Ingresa una cantidad válida"}</strong>
          </div>
        ) : null}

        <p className={formStyles.fieldHelp}>
          La cantidad debe ser un número entero mayor que cero.
        </p>

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
              <dd className={styles.textValue}>
                {COMPUTER_SERVICE_CATEGORY.name}
              </dd>
            </div>
            <div className={formStyles.priceItem}>
              <dt>Servicio</dt>
              <dd className={styles.textValue}>{result.service.name}</dd>
            </div>
            {result.maintenance ? (
              <>
                <div className={formStyles.priceItem}>
                  <dt>Opciones seleccionadas</dt>
                  <dd className={styles.textValue}>
                    {result.maintenance.selectedOptionIds
                      .map(
                        (optionId) =>
                          MAINTENANCE_OPTIONS.find(
                            (option) => option.id === optionId,
                          )!.name,
                      )
                      .join(" y ")}
                  </dd>
                </div>
                {result.maintenance.selectedOptionIds.includes(
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
                {result.maintenance.packageName ? (
                  <div className={formStyles.priceItem}>
                    <dt>Paquete aplicado</dt>
                    <dd className={styles.textValue}>
                      {result.maintenance.packageName}
                    </dd>
                  </div>
                ) : null}
              </>
            ) : null}
            {result.service.pricingStrategy === "quantity-tier" &&
            result.softwareInstallation ? (
              <>
                <div className={formStyles.priceItem}>
                  <dt>Alcance</dt>
                  <dd className={styles.textValue}>
                    {result.service.computerScope.name}
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Cantidad de programas</dt>
                  <dd>{result.softwareInstallation.programCount}</dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Nivel aplicado</dt>
                  <dd className={styles.textValue}>
                    {
                      getSoftwareInstallationPricingTier(
                        result.softwareInstallation.tierId,
                      ).name
                    }
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio unitario por programa</dt>
                  <dd>
                    <data value={result.softwareInstallation.unitPrice}>
                      {priceFormatter.format(
                        result.softwareInstallation.unitPrice,
                      )}
                    </data>
                  </dd>
                </div>
              </>
            ) : (
              <>
                <div className={formStyles.priceItem}>
                  <dt>Cantidad</dt>
                  <dd>{result.quantity}</dd>
                  <dd className={formStyles.priceItemNote}>
                    Unidad: {result.service.unit.singular}
                  </dd>
                </div>
                <div className={formStyles.priceItem}>
                  <dt>Precio unitario</dt>
                  <dd>
                    <data value={result.unitPrice}>
                      {priceFormatter.format(result.unitPrice)}
                    </data>
                  </dd>
                  <dd className={formStyles.priceItemNote}>
                    Por {result.service.unit.singular}
                  </dd>
                </div>
              </>
            )}
            <div className={formStyles.priceItemFeatured}>
              <dt>Precio total</dt>
              <dd>
                <data value={result.totalPrice}>
                  {priceFormatter.format(result.totalPrice)}
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
