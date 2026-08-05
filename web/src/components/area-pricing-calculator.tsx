"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useState,
} from "react";

import {
  createAreaProductQuotationLineDraft,
  type AreaProductQuotationLineInput,
} from "@/lib/pricing/area-product-quotation-line";
import { calculateAreaBasePrice } from "@/lib/pricing/calculate-area-base-price";
import {
  calculateIlluminatedPanaflexSignPrice,
  type IlluminatedPanaflexSignPriceCalculation,
  PANAFLEX_MEASURE_CLASSIFICATIONS,
  type PanaflexMeasureClassification,
} from "@/lib/pricing/calculate-illuminated-panaflex-sign-price";
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
  DEFAULT_PANAFLEX_PRICING_OPTION_ID,
  getPanaflexPricingOption,
  PANAFLEX_PRICING_OPTIONS,
  PANAFLEX_PRODUCT_ID,
  type PanaflexPricingOptionId,
  usesIlluminatedPanaflexPricing,
} from "@/lib/pricing/panaflex-pricing-options";
import { changePanaflexPricingSelection } from "@/lib/pricing/panaflex-pricing-selection";
import {
  changeAreaProduct,
  CUSTOM_RATE_VARIANT_ID,
  getAreaProducts,
  getAreaProductVariants,
  resolveAreaProductRate,
} from "@/lib/pricing/resolve-area-product-rate";
import { roundUpToCop500 } from "@/lib/pricing/round-up-to-cop-500";
import type { QuotationLineDraft } from "@/lib/pricing/temporary-quotation";

import styles from "./area-pricing-calculator.module.css";

type FormValues = {
  productId: string;
  variantId: string;
  lengthCm: string;
  widthCm: string;
  customRate: string;
  quantity: string;
  bannerStructureOptionId: BannerStructureOptionId | null;
  panaflexPricingOptionId: PanaflexPricingOptionId | null;
};

type CalculationResult = Readonly<{
  priceBeforeRounding: number;
  roundedPrice: number;
  bannerStructureName: string | null;
  panaflexPricingOptionName: string | null;
  panaflexCalculation: IlluminatedPanaflexSignPriceCalculation | null;
  quotationLineInput: AreaProductQuotationLineInput;
}>;

type AreaPricingCalculatorProps = Readonly<{
  onAddQuotationLine?: (line: QuotationLineDraft) => void;
}>;

const EMPTY_FORM: FormValues = {
  productId: "",
  variantId: "",
  lengthCm: "",
  widthCm: "",
  customRate: "",
  quantity: "1",
  bannerStructureOptionId: null,
  panaflexPricingOptionId: null,
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

const areaFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const PANAFLEX_MEASURE_CLASSIFICATION_LABELS: Readonly<
  Record<PanaflexMeasureClassification, string>
> = {
  [PANAFLEX_MEASURE_CLASSIFICATIONS.small]: "Medida pequeña",
  [PANAFLEX_MEASURE_CLASSIFICATIONS.standard]: "Medida estándar",
};

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
  "Panaflex sign area must be finite.":
    "El área del aviso luminoso no es válida.",
  "Panaflex sign pricing option must be valid.":
    "La opción de aviso luminoso no es válida.",
};

const UNKNOWN_RANGE_ERROR_MESSAGE =
  "Revisa los datos ingresados e inténtalo nuevamente.";

function translateRangeErrorMessage(message: string): string {
  return RANGE_ERROR_MESSAGES[message] ?? UNKNOWN_RANGE_ERROR_MESSAGE;
}

function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}

function tryCalculateIlluminatedPanaflexPreview(
  values: FormValues,
  optionId: Parameters<typeof calculateIlluminatedPanaflexSignPrice>[3],
): IlluminatedPanaflexSignPriceCalculation | null {
  try {
    return calculateIlluminatedPanaflexSignPrice(
      toNumber(values.lengthCm),
      toNumber(values.widthCm),
      toNumber(values.quantity),
      optionId,
    );
  } catch (caughtError: unknown) {
    if (caughtError instanceof RangeError) {
      return null;
    }

    throw caughtError;
  }
}

type PanaflexPricingBreakdownProps = Readonly<{
  calculation: IlluminatedPanaflexSignPriceCalculation;
  optionName: string;
  showSmallMeasureNotice?: boolean;
}>;

export function PanaflexPricingBreakdown({
  calculation,
  optionName,
  showSmallMeasureNotice = true,
}: PanaflexPricingBreakdownProps) {
  return (
    <div className={styles.panaflexBreakdown}>
      {calculation.isSmallMeasure && showSmallMeasureNotice ? (
        <p className={styles.smallMeasureNotice}>
          <strong>Medida pequeña detectada.</strong> Esta medida utiliza la tarifa
          de COP 45 por cm². Debido al trabajo mínimo requerido para fabricar la
          estructura, el precio calculado se multiplica por 2.
        </p>
      ) : null}

      <dl className={styles.panaflexDetails}>
        <div className={styles.panaflexDetailItem}>
          <dt>Opción de Panaflex</dt>
          <dd>{optionName}</dd>
        </div>
        <div className={styles.panaflexDetailItem}>
          <dt>Clasificación de medida</dt>
          <dd>
            {
              PANAFLEX_MEASURE_CLASSIFICATION_LABELS[
                calculation.measureClassification
              ]
            }
          </dd>
        </div>
        <div className={styles.panaflexDetailItem}>
          <dt>Área calculada</dt>
          <dd>
            <data value={calculation.areaCm2}>
              {areaFormatter.format(calculation.areaCm2)} cm²
            </data>
          </dd>
        </div>
        <div className={styles.panaflexDetailItem}>
          <dt>Tarifa de estructura aplicada</dt>
          <dd>
            <data value={calculation.structureRate}>
              {roundedPriceFormatter.format(calculation.structureRate)} por cm²
            </data>
          </dd>
        </div>
        <div className={styles.panaflexDetailItem}>
          <dt>Componente de una cara</dt>
          <dd>
            <data value={calculation.oneFaceComponent}>
              {basePriceFormatter.format(calculation.oneFaceComponent)}
            </data>
          </dd>
        </div>
        {calculation.doubleFaceAdditionalComponent > 0 ? (
          <div className={styles.panaflexDetailItem}>
            <dt>Adicional de doble cara</dt>
            <dd>
              <data value={calculation.doubleFaceAdditionalComponent}>
                {basePriceFormatter.format(
                  calculation.doubleFaceAdditionalComponent,
                )}
              </data>
            </dd>
          </div>
        ) : null}
        <div className={styles.panaflexDetailItem}>
          <dt>Precio normal antes del ajuste</dt>
          <dd>
            <data value={calculation.normalPriceBeforeSmallMeasureAdjustment}>
              {basePriceFormatter.format(
                calculation.normalPriceBeforeSmallMeasureAdjustment,
              )}
            </data>
          </dd>
        </div>
        <div className={styles.panaflexDetailItem}>
          <dt>Multiplicador por medida pequeña</dt>
          <dd>
            {calculation.isSmallMeasure
              ? `×${calculation.smallMeasureMultiplier}`
              : "No aplica"}
          </dd>
        </div>
        <div className={styles.panaflexDetailItem}>
          <dt>Precio después del ajuste</dt>
          <dd>
            <data value={calculation.priceAfterSmallMeasureAdjustment}>
              {basePriceFormatter.format(
                calculation.priceAfterSmallMeasureAdjustment,
              )}
            </data>
          </dd>
        </div>
        <div className={styles.panaflexDetailItem}>
          <dt>Precio antes del redondeo comercial</dt>
          <dd>
            <data value={calculation.priceBeforeCommercialRounding}>
              {basePriceFormatter.format(
                calculation.priceBeforeCommercialRounding,
              )}
            </data>
          </dd>
        </div>
        <div className={styles.panaflexDetailTotal}>
          <dt>Precio comercial final</dt>
          <dd>
            <data value={calculation.commercialRoundedPrice}>
              {roundedPriceFormatter.format(
                calculation.commercialRoundedPrice,
              )}
            </data>
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function AreaPricingCalculator({
  onAddQuotationLine,
}: AreaPricingCalculatorProps = {}) {
  const idPrefix = useId();
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addFeedbackSequence, setAddFeedbackSequence] = useState(0);

  const variants = getAreaProductVariants(values.productId);
  const customRate =
    values.customRate.trim() === "" ? undefined : Number(values.customRate);
  const resolvedRate = resolveAreaProductRate(
    values.productId,
    values.variantId,
    customRate,
  );
  const panaflexPricingOptionId =
    values.panaflexPricingOptionId ?? DEFAULT_PANAFLEX_PRICING_OPTION_ID;
  const usesIlluminatedSignPricing = usesIlluminatedPanaflexPricing(
    values.productId,
    panaflexPricingOptionId,
  );
  const panaflexPricingOptionName =
    values.productId === PANAFLEX_PRODUCT_ID
      ? getPanaflexPricingOption(panaflexPricingOptionId).name
      : null;
  const panaflexPricingPreview = usesIlluminatedSignPricing
    ? tryCalculateIlluminatedPanaflexPreview(
        values,
        panaflexPricingOptionId,
      )
    : null;

  function clearFeedback() {
    setResult(null);
    setError(null);
    setAddFeedbackSequence(0);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof FormValues;
    const value = event.currentTarget.value;

    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    clearFeedback();
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
      panaflexPricingOptionId: changePanaflexPricingSelection(
        currentValues.productId,
        productId,
        currentValues.panaflexPricingOptionId,
      ),
    }));
    clearFeedback();
  }

  function handlePanaflexPricingChange(event: ChangeEvent<HTMLInputElement>) {
    const pricingOptionId = event.currentTarget.value as PanaflexPricingOptionId;

    setValues((currentValues) => ({
      ...currentValues,
      panaflexPricingOptionId: pricingOptionId,
    }));
    clearFeedback();
  }

  function handleBannerStructureChange(event: ChangeEvent<HTMLInputElement>) {
    const structureOptionId =
      event.currentTarget.value as BannerStructureOptionId;

    setValues((currentValues) => ({
      ...currentValues,
      bannerStructureOptionId: structureOptionId,
    }));
    clearFeedback();
  }

  function handleVariantChange(event: ChangeEvent<HTMLSelectElement>) {
    const variantId = event.currentTarget.value;

    setValues((currentValues) => ({
      ...currentValues,
      variantId,
      customRate:
        variantId === CUSTOM_RATE_VARIANT_ID ? currentValues.customRate : "",
    }));
    clearFeedback();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.productId) {
      setResult(null);
      setAddFeedbackSequence(0);
      setError("Selecciona un producto.");
      return;
    }

    if (!usesIlluminatedSignPricing && !values.variantId) {
      setResult(null);
      setAddFeedbackSequence(0);
      setError("Selecciona una variante.");
      return;
    }

    if (!usesIlluminatedSignPricing && resolvedRate === null) {
      setResult(null);
      setAddFeedbackSequence(0);
      setError(
        values.variantId === CUSTOM_RATE_VARIANT_ID
          ? "Ingresa una tarifa personalizada válida."
          : "La variante seleccionada no es válida para este producto.",
      );
      return;
    }

    try {
      const lengthCm = toNumber(values.lengthCm);
      const widthCm = toNumber(values.widthCm);
      const quantity = toNumber(values.quantity);
      const areaM2 = calculateAreaBasePrice(lengthCm, widthCm, 1, 1);
      let priceBeforeRounding: number;
      let panaflexCalculation: IlluminatedPanaflexSignPriceCalculation | null =
        null;

      if (usesIlluminatedSignPricing) {
        panaflexCalculation = calculateIlluminatedPanaflexSignPrice(
          lengthCm,
          widthCm,
          quantity,
          panaflexPricingOptionId,
        );
        priceBeforeRounding = panaflexCalculation.priceBeforeCommercialRounding;
      } else {
        const basePrice = calculateAreaBasePrice(
          lengthCm,
          widthCm,
          resolvedRate!,
          quantity,
        );
        const totalAreaM2 =
          values.productId === BANNER_PRODUCT_ID
            ? calculateAreaBasePrice(
                lengthCm,
                widthCm,
                1,
                quantity,
              )
            : 0;
        const bannerStructureOptionId =
          values.bannerStructureOptionId ??
          DEFAULT_BANNER_STRUCTURE_OPTION_ID;
        priceBeforeRounding = applyBannerStructurePrice(
          values.productId,
          values.variantId,
          totalAreaM2,
          basePrice,
          resolvedRate!,
          bannerStructureOptionId,
        );
      }

      const bannerStructureOptionId =
        values.bannerStructureOptionId ??
        DEFAULT_BANNER_STRUCTURE_OPTION_ID;
      const roundedPrice =
        panaflexCalculation?.commercialRoundedPrice ??
        roundUpToCop500(priceBeforeRounding);
      const bannerStructureName =
        values.productId === BANNER_PRODUCT_ID
          ? getBannerStructureOption(bannerStructureOptionId).name
          : null;
      const productName = products.find(
        (product) => product.id === values.productId,
      )!.name;
      const variantName = usesIlluminatedSignPricing
        ? null
        : values.variantId === CUSTOM_RATE_VARIANT_ID
          ? "Tarifa personalizada (excepcional)"
          : variants.find((variant) => variant.id === values.variantId)!.name;

      setResult({
        priceBeforeRounding,
        roundedPrice,
        bannerStructureName,
        panaflexPricingOptionName,
        panaflexCalculation,
        quotationLineInput: {
          productName,
          variantName,
          lengthCm,
          widthCm,
          areaM2,
          quantity,
          customerFacingRatePerM2: usesIlluminatedSignPricing
            ? null
            : resolvedRate,
          usesCustomRate: values.variantId === CUSTOM_RATE_VARIANT_ID,
          bannerStructureName,
          panaflexPricingOptionName,
          panaflexMeasureClassification:
            panaflexCalculation?.measureClassification ?? null,
          panaflexStructureRatePerCm2:
            panaflexCalculation?.structureRate ?? null,
          finalPrice: roundedPrice,
        },
      });
      setError(null);
      setAddFeedbackSequence(0);
    } catch (caughtError: unknown) {
      if (caughtError instanceof RangeError) {
        setResult(null);
        setAddFeedbackSequence(0);
        setError(translateRangeErrorMessage(caughtError.message));
        return;
      }

      setResult(null);
      setAddFeedbackSequence(0);
      setError("No fue posible calcular el precio. Inténtalo de nuevo.");
    }
  }

  function handleReset() {
    setValues(EMPTY_FORM);
    clearFeedback();
  }

  function handleAddQuotationLine() {
    if (result === null || onAddQuotationLine === undefined) {
      return;
    }

    onAddQuotationLine(
      createAreaProductQuotationLineDraft(result.quotationLineInput),
    );
    setAddFeedbackSequence((sequence) => sequence + 1);
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

          {values.productId === PANAFLEX_PRODUCT_ID ? (
            <fieldset className={styles.structureOptions}>
              <legend>Opción de Panaflex</legend>
              {PANAFLEX_PRICING_OPTIONS.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name="panaflexPricingOptionId"
                    value={option.id}
                    checked={values.panaflexPricingOptionId === option.id}
                    onChange={handlePanaflexPricingChange}
                  />
                  <span>{option.name}</span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {!usesIlluminatedSignPricing ? (
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
          ) : null}

          {!usesIlluminatedSignPricing &&
          values.variantId === CUSTOM_RATE_VARIANT_ID ? (
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
          <span>
            {usesIlluminatedSignPricing
              ? "Estrategia seleccionada"
              : "Tarifa seleccionada"}
          </span>
          <strong>
            {usesIlluminatedSignPricing
              ? "Cálculo directo por cm²"
              : resolvedRate === null
              ? "Pendiente"
              : `${roundedPriceFormatter.format(resolvedRate)}/m²`}
          </strong>
        </div>

        {panaflexPricingPreview && panaflexPricingOptionName ? (
          <section
            className={styles.panaflexPreview}
            aria-label="Vista previa del precio de Panaflex"
            aria-live="polite"
          >
            <div className={styles.panaflexPreviewHeading}>
              <p className={styles.kicker}>Vista previa</p>
              <h4>Detalle del aviso luminoso</h4>
            </div>
            <PanaflexPricingBreakdown
              calculation={panaflexPricingPreview}
              optionName={panaflexPricingOptionName}
            />
          </section>
        ) : null}

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

        {result?.panaflexCalculation && result.panaflexPricingOptionName ? (
          <PanaflexPricingBreakdown
            calculation={result.panaflexCalculation}
            optionName={result.panaflexPricingOptionName}
            showSmallMeasureNotice={false}
          />
        ) : result ? (
          <dl className={styles.priceList}>
            {result.bannerStructureName ? (
              <div className={styles.priceItem}>
                <dt>Opción de Banner</dt>
                <dd className={styles.structureResult}>
                  {result.bannerStructureName}
                </dd>
              </div>
            ) : null}
            {result.panaflexPricingOptionName ? (
              <div className={styles.priceItem}>
                <dt>Opción de Panaflex</dt>
                <dd className={styles.structureResult}>
                  {result.panaflexPricingOptionName}
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

        {result && onAddQuotationLine ? (
          <div className={styles.quotationAction}>
            <button
              className={styles.primaryButton}
              type="button"
              aria-label={`Agregar ${result.quotationLineInput.productName} a la cotización`}
              onClick={handleAddQuotationLine}
            >
              Agregar a la cotización
            </button>
            <p
              key={addFeedbackSequence}
              className={styles.quotationFeedback}
              aria-live="polite"
              aria-atomic="true"
            >
              {addFeedbackSequence > 0 ? "Agregado a la cotización." : ""}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
