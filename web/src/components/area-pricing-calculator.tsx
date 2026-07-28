"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useState,
} from "react";

import { calculateAreaBasePrice } from "@/lib/pricing/calculate-area-base-price";
import { roundUpToCop500 } from "@/lib/pricing/round-up-to-cop-500";

import styles from "./area-pricing-calculator.module.css";

type FormValues = {
  lengthCm: string;
  widthCm: string;
  ratePerSquareMeter: string;
  quantity: string;
};

type CalculationResult = {
  basePrice: number;
  roundedPrice: number;
};

const EMPTY_FORM: FormValues = {
  lengthCm: "",
  widthCm: "",
  ratePerSquareMeter: "",
  quantity: "",
};

const basePriceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const roundedPriceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const RANGE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  "Length must be finite.": "El largo debe ser un número válido.",
  "Length must be greater than zero.": "El largo debe ser mayor que cero.",
  "Width must be finite.": "El ancho debe ser un número válido.",
  "Width must be greater than zero.": "El ancho debe ser mayor que cero.",
  "Rate per square meter must be finite.":
    "La tarifa por metro cuadrado debe ser un número válido.",
  "Rate per square meter must not be negative.":
    "La tarifa por metro cuadrado no puede ser negativa.",
  "Quantity must be finite.": "La cantidad debe ser un número válido.",
  "Quantity must be an integer.": "La cantidad debe ser un número entero.",
  "Quantity must be greater than zero.":
    "La cantidad debe ser mayor que cero.",
  "Amount must be finite.": "El precio calculado no es válido.",
  "Amount must not be negative.":
    "El precio calculado no puede ser negativo.",
};

const UNKNOWN_RANGE_ERROR_MESSAGE =
  "Revisa los datos ingresados e inténtalo nuevamente.";

function translateRangeErrorMessage(message: string): string {
  return RANGE_ERROR_MESSAGES[message] ?? UNKNOWN_RANGE_ERROR_MESSAGE;
}

function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}

export function AreaPricingCalculator() {
  const idPrefix = useId();
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof FormValues;
    const value = event.currentTarget.value;

    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const basePrice = calculateAreaBasePrice(
        toNumber(values.lengthCm),
        toNumber(values.widthCm),
        toNumber(values.ratePerSquareMeter),
        toNumber(values.quantity),
      );
      const roundedPrice = roundUpToCop500(basePrice);

      setResult({ basePrice, roundedPrice });
      setError(null);
    } catch (caughtError: unknown) {
      if (caughtError instanceof RangeError) {
        setError(translateRangeErrorMessage(caughtError.message));
        return;
      }

      setError("No fue posible calcular el precio. Inténtalo de nuevo.");
    }
  }

  function handleReset() {
    setValues(EMPTY_FORM);
    setResult(null);
    setError(null);
  }

  return (
    <div className={styles.calculator}>
      <form
        className={styles.form}
        onSubmit={handleSubmit}
        onReset={handleReset}
        noValidate
      >
        <div className={styles.formHeading}>
          <div>
            <p className={styles.kicker}>Datos de entrada</p>
            <h3>Medidas y tarifa</h3>
          </div>
          <p className={styles.requiredNote}>Todos los campos son obligatorios</p>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor={`${idPrefix}-length`}>Largo</label>
            <div className={styles.inputShell}>
              <input
                id={`${idPrefix}-length`}
                name="lengthCm"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={values.lengthCm}
                onChange={handleChange}
                placeholder="100"
                required
              />
              <span aria-hidden="true">cm</span>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${idPrefix}-width`}>Ancho</label>
            <div className={styles.inputShell}>
              <input
                id={`${idPrefix}-width`}
                name="widthCm"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={values.widthCm}
                onChange={handleChange}
                placeholder="50"
                required
              />
              <span aria-hidden="true">cm</span>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${idPrefix}-rate`}>Tarifa por metro cuadrado</label>
            <div className={styles.inputShell}>
              <input
                id={`${idPrefix}-rate`}
                name="ratePerSquareMeter"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={values.ratePerSquareMeter}
                onChange={handleChange}
                placeholder="0"
                required
              />
              <span aria-hidden="true">COP/m²</span>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${idPrefix}-quantity`}>Cantidad</label>
            <div className={styles.inputShell}>
              <input
                id={`${idPrefix}-quantity`}
                name="quantity"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={values.quantity}
                onChange={handleChange}
                placeholder="1"
                required
              />
              <span aria-hidden="true">unidades</span>
            </div>
          </div>
        </div>

        <p className={styles.fieldHelp}>
          Las dimensiones aceptan decimales y la cantidad debe ser un entero
          positivo.
        </p>

        <div className={styles.actions}>
          <button className={styles.primaryButton} type="submit">
            Calcular precio
          </button>
          <button className={styles.secondaryButton} type="reset">
            Limpiar
          </button>
        </div>

        <div
          className={styles.errorRegion}
          aria-live="assertive"
          aria-atomic="true"
        >
          {error ? (
            <p className={styles.error} role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          ) : null}
        </div>
      </form>

      <section
        className={styles.results}
        aria-label="Resultado del cálculo"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={styles.resultHeading}>
          <p className={styles.kicker}>Resultado</p>
          <h3>Resumen del precio</h3>
        </div>

        {result ? (
          <dl className={styles.priceList}>
            <div className={styles.priceItem}>
              <dt>Precio base</dt>
              <dd>
                <data value={result.basePrice}>
                  {basePriceFormatter.format(result.basePrice)}
                </data>
              </dd>
              <dd className={styles.priceItemNote}>
                Valor calculado sin redondear
              </dd>
            </div>
            <div className={styles.priceItemFeatured}>
              <dt>Precio comercial redondeado</dt>
              <dd>
                <data value={result.roundedPrice}>
                  {roundedPriceFormatter.format(result.roundedPrice)}
                </data>
              </dd>
              <dd className={styles.priceItemNote}>
                Resultado ajustado a múltiplos de COP 500
              </dd>
            </div>
          </dl>
        ) : (
          <div className={styles.emptyResult}>
            <span aria-hidden="true">COP</span>
            <p>Completa los datos y calcula el precio para ver el resultado.</p>
          </div>
        )}
      </section>
    </div>
  );
}
