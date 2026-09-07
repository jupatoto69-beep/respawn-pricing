"use client";

import { type ChangeEvent, useId, useState } from "react";

import {
  isSecuritySystemPresentationId,
  isSecuritySystemTypeId,
  SECURITY_SYSTEM_PRESENTATION_OPTIONS,
  SECURITY_SYSTEM_TYPE_OPTIONS,
  type SecuritySystemPresentationId,
  type SecuritySystemTypeId,
} from "@/lib/pricing/security-system-options";

import formStyles from "./area-pricing-calculator.module.css";
import styles from "./security-systems-pricing-calculator.module.css";

type SecuritySystemsPricingCalculatorProps = Readonly<{
  initialSystemTypeId?: SecuritySystemTypeId;
  initialPresentationId?: SecuritySystemPresentationId;
}>;

export function SecuritySystemsPricingCalculator({
  initialSystemTypeId,
  initialPresentationId,
}: SecuritySystemsPricingCalculatorProps = {}) {
  const idPrefix = useId();
  const [systemTypeId, setSystemTypeId] = useState<SecuritySystemTypeId | null>(
    initialSystemTypeId ?? null,
  );
  const [presentationId, setPresentationId] =
    useState<SecuritySystemPresentationId | null>(
      initialPresentationId ?? null,
    );

  function handleSystemTypeChange(event: ChangeEvent<HTMLInputElement>) {
    const nextSystemTypeId = event.currentTarget.value;

    if (isSecuritySystemTypeId(nextSystemTypeId)) {
      setSystemTypeId(nextSystemTypeId);
    }
  }

  function handlePresentationChange(event: ChangeEvent<HTMLInputElement>) {
    const nextPresentationId = event.currentTarget.value;

    if (isSecuritySystemPresentationId(nextPresentationId)) {
      setPresentationId(nextPresentationId);
    }
  }

  return (
    <div className={formStyles.calculator}>
      <section className={formStyles.form}>
        <div className={formStyles.formHeading}>
          <div>
            <p className={formStyles.kicker}>Sistemas de seguridad</p>
            <h3>Configuración inicial del sistema</h3>
          </div>
          <p className={formStyles.requiredNote}>
            Selecciona las opciones confirmadas
          </p>
        </div>

        <div className={styles.fields}>
          <fieldset className={styles.optionGroup}>
            <legend>Tipo de sistema</legend>
            {SECURITY_SYSTEM_TYPE_OPTIONS.map((option) => (
              <label key={option.id} htmlFor={`${idPrefix}-type-${option.id}`}>
                <input
                  id={`${idPrefix}-type-${option.id}`}
                  type="radio"
                  name={`${idPrefix}-security-system-type`}
                  value={option.id}
                  checked={systemTypeId === option.id}
                  onChange={handleSystemTypeChange}
                />
                <span>{option.name}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className={styles.optionGroup}>
            <legend>Presentación de la cotización</legend>
            {SECURITY_SYSTEM_PRESENTATION_OPTIONS.map((option) => (
              <label
                key={option.id}
                htmlFor={`${idPrefix}-presentation-${option.id}`}
              >
                <input
                  id={`${idPrefix}-presentation-${option.id}`}
                  type="radio"
                  name={`${idPrefix}-security-system-presentation`}
                  value={option.id}
                  checked={presentationId === option.id}
                  onChange={handlePresentationChange}
                />
                <span>
                  <strong>{option.name}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      </section>

      <section className={formStyles.results}>
        <div className={formStyles.resultHeading}>
          <div>
            <p className={formStyles.kicker}>Estado del configurador</p>
            <h3>Catálogo pendiente</h3>
          </div>
        </div>

        <div className={styles.catalogNotice}>
          <span aria-hidden="true">CCTV</span>
          <p>
            El configurador completo estará disponible cuando se incorpore el
            catálogo de productos aprobado. Por ahora no se incluyen modelos,
            productos ni precios provisionales.
          </p>
        </div>
      </section>
    </div>
  );
}
