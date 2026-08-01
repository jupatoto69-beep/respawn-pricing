"use client";

import { type ChangeEvent, useId, useState } from "react";

import {
  changePricingMode,
  createInitialPricingModeSelection,
  isPricingModeId,
  PRICING_MODE_IDS,
  PRICING_MODE_OPTIONS,
  type PricingModeId,
} from "@/lib/pricing/pricing-mode-selection";

import { AreaPricingCalculator } from "./area-pricing-calculator";
import styles from "./pricing-calculator.module.css";
import { ServicesPricingCalculator } from "./services-pricing-calculator";

type PricingCalculatorProps = Readonly<{
  initialModeId?: PricingModeId;
}>;

export function PricingCalculator({
  initialModeId = PRICING_MODE_IDS.areaProducts,
}: PricingCalculatorProps) {
  const idPrefix = useId();
  const [selection, setSelection] = useState(() =>
    createInitialPricingModeSelection(initialModeId),
  );

  function handleModeChange(event: ChangeEvent<HTMLInputElement>) {
    const modeId = event.currentTarget.value;

    if (!isPricingModeId(modeId)) {
      return;
    }

    setSelection((currentSelection) =>
      changePricingMode(currentSelection, modeId),
    );
  }

  const selectedOption = PRICING_MODE_OPTIONS.find(
    (option) => option.id === selection.modeId,
  )!;

  return (
    <div>
      <fieldset className={styles.modeSelector}>
        <legend>Tipo de cotización</legend>
        <div className={styles.modeOptions}>
          {PRICING_MODE_OPTIONS.map((option) => (
            <label key={option.id} htmlFor={`${idPrefix}-${option.id}`}>
              <input
                id={`${idPrefix}-${option.id}`}
                type="radio"
                name={`${idPrefix}-pricing-mode`}
                value={option.id}
                checked={selection.modeId === option.id}
                onChange={handleModeChange}
              />
              <span>
                <strong>{option.name}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.modeHeading} aria-live="polite">
        <p>Modo seleccionado</p>
        <h3>{selectedOption.name}</h3>
      </div>

      {selection.modeId === PRICING_MODE_IDS.areaProducts ? (
        <AreaPricingCalculator
          key={`area-products-${selection.areaProductsRevision}`}
        />
      ) : (
        <ServicesPricingCalculator
          key={`services-${selection.servicesRevision}`}
        />
      )}
    </div>
  );
}
