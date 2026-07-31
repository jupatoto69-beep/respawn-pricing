"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useState,
} from "react";

import { calculateAreaBasePrice } from "@/lib/pricing/calculate-area-base-price";
import {
  BANNER_PRODUCT_ID,
  BANNER_STRUCTURE_OPTIONS,
  DEFAULT_BANNER_STRUCTURE_OPTION_ID,
  getBannerStructureOption,
  type BannerStructureOptionId,
} from "@/lib/pricing/banner-structure-options";
import { changeBannerStructureSelection } from "@/lib/pricing/banner-structure-selection";
import { applyBannerStructurePrice } from "@/lib/pricing/calculate-banner-structure-price";
import {
  changeAreaProduct,
  CUSTOM_RATE_VARIANT_ID,
  getAreaProducts,
  getAreaProductVariants,
  resolveAreaProductRate,
} from "@/lib/pricing/resolve-area-product-rate";
import { roundUpToCop500 } from "@/lib/pricing/round-up-to-cop-500";

import styles from "./area-pricing-calculator.module.css";

type FormValues = {
  productId: string;
  variantId: string;
  lengthCm: string;
  widthCm: string;
  customRate: string;
  quantity: string;
  bannerStructureOptionId: BannerStructureOptionId | null;
};

type CalculationResult = {
  priceBeforeRounding: number;
  roundedPrice: number;
  bannerStructureName: string | null;
};

const EMPTY_FORM: FormValues = {
  productId: "",
  variantId: "",
  lengthCm: "",
  widthCm: "",
  customRate: "",
  quantity: "1",
  bannerStructureOptionId: null,
};

const products = getAreaProducts();

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
  "Banner area must be finite.": "El área de Banner no es válida.",
  "Banner area must not be negative.":
    "El área de Banner no puede ser negativa.",
  "Banner rate must be a finite non-negative number.":
    "La tarifa de Banner no es válida.",
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

  const variants = getAreaProductVariants(values.productId);
  const customRate =
    values.customRate.trim() === "" ? undefined : Number(values.customRate);
  const resolvedRate = resolveAreaProductRate(
    values.productId,
    values.variantId,
    customRate,
  );

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof FormValues;
    const value = event.currentTarget.value;

    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setResult(null);
    setError(null);
  }

  function handleProductChange(event: ChangeEvent<HTMLSelectElement>) {
    const productId = event.currentTarget.value;

    setValues((currentValues) => ({
      ...currentValues,
      ...changeAreaProduct(currentValues, productId),
      bannerStructureOptionId: changeBannerStructureSelection(
        currentValues.productId,
        productId,
        currentValues.bannerStructureOptionId,
      ),
    }));
    setResult(null);
    setError(null);
  }

  function handleBannerStructureChange(event: ChangeEvent<HTMLInputElement>) {
    const structureOptionId =
      event.currentTarget.value as BannerStructureOptionId;

    setValues((currentValues) => ({
      ...currentValues,
      bannerStructureOptionId: structureOptionId,
    }));
    setResult(null);
    setError(null);
  }

  function handleVariantChange(event: ChangeEvent<HTMLSelectElement>) {
    const variantId = event.currentTarget.value;

    setValues((currentValues) => ({
      ...currentValues,
      variantId,
      customRate:
        variantId === CUSTOM_RATE_VARIANT_ID ? currentValues.customRate : "",
    }));
    setResult(null);
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.productId) {
      setResult(null);
      setError("Selecciona un producto.");
      return;
    }

    if (!values.variantId) {
      setResult(null);
      setError("Selecciona una variante.");
      return;
    }

    if (resolvedRate === null) {
      setResult(null);
      setError(
        values.variantId === CUSTOM_RATE_VARIANT_ID
          ? "Ingresa una tarifa personalizada válida."
          : "La variante seleccionada no es válida para este producto.",
      );
      return;
    }

    try {
      const basePrice = calculateAreaBasePrice(
        toNumber(values.lengthCm),
        toNumber(values.widthCm),
        resolvedRate,
        toNumber(values.quantity),
      );
      const areaM2 =
        values.productId === BANNER_PRODUCT_ID
          ? calculateAreaBasePrice(
              toNumber(values.lengthCm),
              toNumber(values.widthCm),
              1,
              toNumber(values.quantity),
            )
          : 0;
      const bannerStructureOptionId =
        values.bannerStructureOptionId ??
        DEFAULT_BANNER_STRUCTURE_OPTION_ID;
      const priceBeforeRounding = applyBannerStructurePrice(
        values.productId,
        values.variantId,
        areaM2,
        basePrice,
        resolvedRate,
        bannerStructureOptionId,
      );
      const roundedPrice = roundUpToCop500(priceBeforeRounding);
      const bannerStructureName =
        values.productId === BANNER_PRODUCT_ID
          ? getBannerStructureOption(bannerStructureOptionId).name
          : null;

      setResult({
        priceBeforeRounding,
        roundedPrice,
        bannerStructureName,
      });
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
            <h3>Producto, medidas y tarifa</h3>
          </div>
          <p className={styles.requiredNote}>Todos los campos son obligatorios</p>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor={`${idPrefix}-product`}>Producto</label>
            <select
              id={`${idPrefix}-product`}
              name="productId"
              value={values.productId}
              onChange={handleProductChange}
              required
            >
              <option value="">Selecciona un producto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${idPrefix}-variant`}>Variante</label>
            <select
              id={`${idPrefix}-variant`}
              name="variantId"
              value={values.variantId}
              onChange={handleVariantChange}
              disabled={!values.productId}
              required
            >
              <option value="">Selecciona una variante</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                </option>
              ))}
              {values.productId ? (
                <option value={CUSTOM_RATE_VARIANT_ID}>
                  Tarifa personalizada (excepcional)
                </option>
              ) : null}
            </select>
          </div>

          {values.variantId === CUSTOM_RATE_VARIANT_ID ? (
            <div className={styles.field}>
              <label htmlFor={`${idPrefix}-rate`}>
                Tarifa personalizada por metro cuadrado
              </label>
              <div className={styles.inputShell}>
                <input
                  id={`${idPrefix}-rate`}
                  name="customRate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={values.customRate}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
                <span aria-hidden="true">COP/m²</span>
              </div>
            </div>
          ) : null}

          {values.productId === BANNER_PRODUCT_ID ? (
            <fieldset className={styles.structureOptions}>
              <legend>Estructura</legend>
              {BANNER_STRUCTURE_OPTIONS.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name="bannerStructureOptionId"
                    value={option.id}
                    checked={values.bannerStructureOptionId === option.id}
                    onChange={handleBannerStructureChange}
                  />
                  <span>{option.name}</span>
                </label>
              ))}
            </fieldset>
          ) : null}

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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                placeholder="50"
                required
              />
              <span aria-hidden="true">cm</span>
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
                onChange={handleInputChange}
                placeholder="1"
                required
              />
              <span aria-hidden="true">unidades</span>
            </div>
          </div>
        </div>

        <div className={styles.rateSummary} aria-live="polite">
          <span>Tarifa seleccionada</span>
          <strong>
            {resolvedRate === null
              ? "Pendiente"
              : `${roundedPriceFormatter.format(resolvedRate)}/m²`}
          </strong>
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
            {result.bannerStructureName ? (
              <div className={styles.priceItem}>
                <dt>Opción de Banner</dt>
                <dd className={styles.structureResult}>
                  {result.bannerStructureName}
                </dd>
              </div>
            ) : null}
            <div className={styles.priceItem}>
              <dt>Precio antes de redondeo</dt>
              <dd>
                <data value={result.priceBeforeRounding}>
                  {basePriceFormatter.format(result.priceBeforeRounding)}
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
