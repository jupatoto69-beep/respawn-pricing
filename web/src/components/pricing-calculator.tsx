"use client";

import { type ChangeEvent, useId, useState } from "react";

import type { Customer } from "@/lib/customers/customer";
import { applyCustomerSnapshotToQuotation } from "@/lib/customers/customer-quotation-snapshot";
import {
  changePricingMode,
  createInitialPricingModeSelection,
  isPricingModeId,
  PRICING_MODE_IDS,
  PRICING_MODE_OPTIONS,
  type PricingModeId,
} from "@/lib/pricing/pricing-mode-selection";
import {
  addQuotationLine,
  calculateQuotationTotal,
  clearQuotation,
  createEmptyQuotation,
  removeQuotationLine,
  updateCustomQuotationLine,
  updateQuotationDetail,
  updateQuotationPhoneCountry,
  type CustomQuotationLineDraft,
  type QuotationLineDraft,
  type TemporaryQuotationTextDetailField,
} from "@/lib/pricing/temporary-quotation";
import type { PhoneCountryIso2 } from "@/lib/pricing/phone-country-catalog";

import { AreaPricingCalculator } from "./area-pricing-calculator";
import { CustomerManagement } from "./customer-management";
import { CustomQuotationItemForm } from "./custom-quotation-item-form";
import styles from "./pricing-calculator.module.css";
import { SecuritySystemsPricingCalculator } from "./security-systems-pricing-calculator";
import { ServicesPricingCalculator } from "./services-pricing-calculator";
import { ThreeDPrintingPricingCalculator } from "./three-d-printing-pricing-calculator";
import { TemporaryQuotation } from "./temporary-quotation";

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
  const [quotation, setQuotation] = useState(createEmptyQuotation);
  const quotationTotal = calculateQuotationTotal(quotation);

  function handleModeChange(event: ChangeEvent<HTMLInputElement>) {
    const modeId = event.currentTarget.value;

    if (!isPricingModeId(modeId)) {
      return;
    }

    setSelection((currentSelection) =>
      changePricingMode(currentSelection, modeId),
    );
  }

  function handleAddQuotationLine(line: QuotationLineDraft) {
    setQuotation((currentQuotation) =>
      addQuotationLine(currentQuotation, line),
    );
  }

  function handleRemoveQuotationLine(lineId: string) {
    setQuotation((currentQuotation) =>
      removeQuotationLine(currentQuotation, lineId),
    );
  }

  function handleUpdateCustomQuotationLine(
    lineId: string,
    draft: CustomQuotationLineDraft,
  ) {
    setQuotation((currentQuotation) =>
      updateCustomQuotationLine(currentQuotation, lineId, draft),
    );
  }

  function handleUpdateQuotationDetail(
    field: TemporaryQuotationTextDetailField,
    value: string,
  ) {
    setQuotation((currentQuotation) =>
      updateQuotationDetail(currentQuotation, field, value),
    );
  }

  function handleUpdateQuotationPhoneCountry(countryIso2: PhoneCountryIso2) {
    setQuotation((currentQuotation) =>
      updateQuotationPhoneCountry(currentQuotation, countryIso2),
    );
  }

  function handleClearQuotation() {
    setQuotation((currentQuotation) => clearQuotation(currentQuotation));
  }

  function handleSelectCustomer(customer: Customer) {
    setQuotation((currentQuotation) =>
      applyCustomerSnapshotToQuotation(currentQuotation, customer),
    );
  }

  const selectedOption = PRICING_MODE_OPTIONS.find(
    (option) => option.id === selection.modeId,
  )!;

  return (
    <div>
      <CustomerManagement onSelectCustomer={handleSelectCustomer} />

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
          onAddQuotationLine={handleAddQuotationLine}
        />
      ) : selection.modeId === PRICING_MODE_IDS.services ? (
        <ServicesPricingCalculator
          key={`services-${selection.servicesRevision}`}
          onAddQuotationLine={handleAddQuotationLine}
        />
      ) : selection.modeId === PRICING_MODE_IDS.threeDPrinting ? (
        <ThreeDPrintingPricingCalculator
          key={`three-d-printing-${selection.threeDPrintingRevision}`}
          onAddQuotationLine={handleAddQuotationLine}
        />
      ) : (
        <SecuritySystemsPricingCalculator
          key={`security-systems-${selection.securitySystemsRevision}`}
          onAddQuotationLine={handleAddQuotationLine}
        />
      )}

      <CustomQuotationItemForm onSubmit={handleAddQuotationLine} />

      <TemporaryQuotation
        quotation={quotation}
        total={quotationTotal}
        onUpdateDetail={handleUpdateQuotationDetail}
        onUpdatePhoneCountry={handleUpdateQuotationPhoneCountry}
        onRemoveLine={handleRemoveQuotationLine}
        onUpdateCustomLine={handleUpdateCustomQuotationLine}
        onClear={handleClearQuotation}
      />
    </div>
  );
}
