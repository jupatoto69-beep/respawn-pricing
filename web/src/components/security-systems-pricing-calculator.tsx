"use client";

import { type ChangeEvent, useId, useRef, useState } from "react";

import {
  addSecuritySystemCameraGroup,
  CAMERA_ENVIRONMENT_NAMES,
  CAMERA_RESOLUTION_GROUP_NAMES,
  changeSecuritySystemCameraBrand,
  changeSecuritySystemCameraGroupEnvironment,
  changeSecuritySystemCameraGroupFormat,
  changeSecuritySystemCameraGroupModel,
  changeSecuritySystemCameraGroupQuantity,
  changeSecuritySystemCameraResolution,
  changeSecuritySystemRecorder,
  changeSecuritySystemTotalCameraQuantity,
  changeSecuritySystemType,
  createInitialSecuritySystemCatalogSelection,
  filterSecuritySystemCameras,
  getAvailableCameraBrands,
  getAvailableCameraEnvironments,
  getAvailableCameraFormats,
  getAvailableCameraResolutionGroups,
  getCameraForGroup,
  getRecorderCandidates,
  isCameraEnvironment,
  removeSecuritySystemCameraGroup,
  validateSecuritySystemCameraQuantity,
  validateSecuritySystemConfiguration,
  type CameraGroup,
  type SecuritySystemCatalogSelection,
} from "@/lib/pricing/security-system-catalog-selection";
import {
  isSecuritySystemPresentationId,
  isSecuritySystemTypeId,
  SECURITY_SYSTEM_PRESENTATION_OPTIONS,
  SECURITY_SYSTEM_TYPE_IDS,
  SECURITY_SYSTEM_TYPE_OPTIONS,
  type SecuritySystemPresentationId,
  type SecuritySystemTypeId,
} from "@/lib/pricing/security-system-options";

import formStyles from "./area-pricing-calculator.module.css";
import styles from "./security-systems-pricing-calculator.module.css";

type SecuritySystemsPricingCalculatorProps = Readonly<{
  initialSystemTypeId?: SecuritySystemTypeId;
  initialPresentationId?: SecuritySystemPresentationId;
  initialCatalogSelection?: SecuritySystemCatalogSelection;
}>;

type CameraGroupEditorProps = Readonly<{
  idPrefix: string;
  selection: SecuritySystemCatalogSelection;
  group: CameraGroup;
  groupNumber: number;
  onEnvironmentChange: (
    groupId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  onFormatChange: (
    groupId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  onQuantityChange: (
    groupId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onModelChange: (
    groupId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  onRemove: (groupId: string) => void;
}>;

const copFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

function formatCop(value: number): string {
  return `COP ${copFormatter.format(value)}`;
}

function CameraGroupEditor({
  idPrefix,
  selection,
  group,
  groupNumber,
  onEnvironmentChange,
  onFormatChange,
  onQuantityChange,
  onModelChange,
  onRemove,
}: CameraGroupEditorProps) {
  if (!selection.systemTypeId || !selection.brand || !selection.resolutionGroup) {
    return null;
  }

  const availableEnvironments = getAvailableCameraEnvironments(
    selection.systemTypeId,
    selection.brand,
    selection.resolutionGroup,
  );
  const availableFormats = group.environment
    ? getAvailableCameraFormats(
        selection.systemTypeId,
        selection.brand,
        selection.resolutionGroup,
        group.environment,
      )
    : [];
  const availableModels =
    group.environment && group.format
      ? filterSecuritySystemCameras({
          systemTypeId: selection.systemTypeId,
          brand: selection.brand,
          resolutionGroup: selection.resolutionGroup,
          environment: group.environment,
          format: group.format,
        })
      : [];
  const quantity = validateSecuritySystemCameraQuantity(group.quantity);

  return (
    <article className={styles.cameraGroupCard} data-camera-group-id={group.id}>
      <div className={styles.cameraGroupHeading}>
        <h4>Cámara / grupo {groupNumber}</h4>
        <button
          type="button"
          className={styles.removeGroupButton}
          onClick={() => onRemove(group.id)}
        >
          Eliminar grupo
        </button>
      </div>

      <div className={styles.cameraGroupFields}>
        <div className={formStyles.field}>
          <label htmlFor={`${idPrefix}-${group.id}-environment`}>Ambiente</label>
          <select
            id={`${idPrefix}-${group.id}-environment`}
            value={group.environment ?? ""}
            onChange={(event) => onEnvironmentChange(group.id, event)}
          >
            <option value="">Selecciona un ambiente</option>
            {availableEnvironments.map((environment) => (
              <option key={environment} value={environment}>
                {CAMERA_ENVIRONMENT_NAMES[environment]}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.field}>
          <label htmlFor={`${idPrefix}-${group.id}-format`}>Formato</label>
          <select
            id={`${idPrefix}-${group.id}-format`}
            value={group.format ?? ""}
            disabled={!group.environment}
            onChange={(event) => onFormatChange(group.id, event)}
          >
            <option value="">Selecciona un formato</option>
            {availableFormats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.field}>
          <label htmlFor={`${idPrefix}-${group.id}-quantity`}>Cantidad</label>
          <div className={formStyles.inputShell}>
            <input
              id={`${idPrefix}-${group.id}-quantity`}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={group.quantity}
              aria-invalid={!quantity.isValid}
              aria-describedby={
                quantity.isValid
                  ? undefined
                  : `${idPrefix}-${group.id}-quantity-error`
              }
              onChange={(event) => onQuantityChange(group.id, event)}
            />
            <span>unidades</span>
          </div>
          {!quantity.isValid ? (
            <p
              id={`${idPrefix}-${group.id}-quantity-error`}
              className={styles.fieldError}
              role="alert"
            >
              {quantity.errorMessage}
            </p>
          ) : null}
        </div>

        <div className={formStyles.field}>
          <label htmlFor={`${idPrefix}-${group.id}-model`}>Modelo</label>
          <select
            id={`${idPrefix}-${group.id}-model`}
            value={group.cameraId ?? ""}
            disabled={!group.environment || !group.format}
            onChange={(event) => onModelChange(group.id, event)}
          >
            <option value="">Selecciona un modelo</option>
            {availableModels.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.reference}
              </option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
}

export function SecuritySystemsPricingCalculator({
  initialSystemTypeId,
  initialPresentationId,
  initialCatalogSelection,
}: SecuritySystemsPricingCalculatorProps = {}) {
  const idPrefix = useId();
  const nextGroupSequence = useRef(0);
  const [catalogSelection, setCatalogSelection] =
    useState<SecuritySystemCatalogSelection>(() =>
      initialCatalogSelection ??
      createInitialSecuritySystemCatalogSelection(initialSystemTypeId ?? null),
    );
  const [presentationId, setPresentationId] =
    useState<SecuritySystemPresentationId | null>(
      initialPresentationId ?? null,
    );

  const totalCameraQuantity = validateSecuritySystemCameraQuantity(
    catalogSelection.totalCameraQuantity,
  );
  const configuration = validateSecuritySystemConfiguration(catalogSelection);
  const availableBrands = catalogSelection.systemTypeId
    ? getAvailableCameraBrands(catalogSelection.systemTypeId)
    : [];
  const availableResolutionGroups =
    catalogSelection.systemTypeId && catalogSelection.brand
      ? getAvailableCameraResolutionGroups(
          catalogSelection.systemTypeId,
          catalogSelection.brand,
        )
      : [];
  const canDistribute = Boolean(
    catalogSelection.systemTypeId &&
      catalogSelection.brand &&
      catalogSelection.resolutionGroup,
  );
  const selectedCameraGroups = catalogSelection.cameraGroups.flatMap((group) => {
    const camera = getCameraForGroup(catalogSelection, group);
    return camera ? [{ group, camera }] : [];
  });
  const recorderCandidates =
    configuration.isComplete &&
    catalogSelection.systemTypeId &&
    catalogSelection.systemTypeId !== SECURITY_SYSTEM_TYPE_IDS.wifi &&
    catalogSelection.brand &&
    totalCameraQuantity.isValid
      ? getRecorderCandidates(
          catalogSelection.systemTypeId,
          catalogSelection.brand,
          totalCameraQuantity.value,
        )
      : [];
  const selectedRecorderCandidate = recorderCandidates.find(
    ({ recorder }) => recorder.id === catalogSelection.recorderId,
  );

  function handleSystemTypeChange(event: ChangeEvent<HTMLInputElement>) {
    const nextSystemTypeId = event.currentTarget.value;
    if (isSecuritySystemTypeId(nextSystemTypeId)) {
      setCatalogSelection((selection) =>
        changeSecuritySystemType(selection, nextSystemTypeId),
      );
    }
  }

  function handleTotalQuantityChange(event: ChangeEvent<HTMLInputElement>) {
    const nextQuantity = event.currentTarget.value;
    setCatalogSelection((selection) =>
      changeSecuritySystemTotalCameraQuantity(selection, nextQuantity),
    );
  }

  function handleBrandChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextBrand = event.currentTarget.value;
    setCatalogSelection((selection) => {
      if (!selection.systemTypeId) return selection;
      const brand = getAvailableCameraBrands(selection.systemTypeId).find(
        (candidate) => candidate === nextBrand,
      );
      return brand ? changeSecuritySystemCameraBrand(selection, brand) : selection;
    });
  }

  function handleResolutionChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextResolution = event.currentTarget.value;
    setCatalogSelection((selection) => {
      if (!selection.systemTypeId || !selection.brand) return selection;
      const resolution = getAvailableCameraResolutionGroups(
        selection.systemTypeId,
        selection.brand,
      ).find((candidate) => candidate === nextResolution);
      return resolution
        ? changeSecuritySystemCameraResolution(selection, resolution)
        : selection;
    });
  }

  function handleAddGroup() {
    nextGroupSequence.current += 1;
    const groupId = `${idPrefix}-camera-group-${nextGroupSequence.current}`;
    setCatalogSelection((selection) =>
      addSecuritySystemCameraGroup(selection, groupId),
    );
  }

  function handleGroupEnvironmentChange(
    groupId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const environment = event.currentTarget.value;
    if (isCameraEnvironment(environment)) {
      setCatalogSelection((selection) =>
        changeSecuritySystemCameraGroupEnvironment(
          selection,
          groupId,
          environment,
        ),
      );
    }
  }

  function handleGroupFormatChange(
    groupId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const nextFormat = event.currentTarget.value;
    setCatalogSelection((selection) => {
      if (!selection.systemTypeId || !selection.brand || !selection.resolutionGroup) {
        return selection;
      }
      const group = selection.cameraGroups.find(({ id }) => id === groupId);
      if (!group?.environment) return selection;
      const format = getAvailableCameraFormats(
        selection.systemTypeId,
        selection.brand,
        selection.resolutionGroup,
        group.environment,
      ).find((candidate) => candidate === nextFormat);
      return format
        ? changeSecuritySystemCameraGroupFormat(selection, groupId, format)
        : selection;
    });
  }

  function handleGroupQuantityChange(
    groupId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextQuantity = event.currentTarget.value;
    setCatalogSelection((selection) =>
      changeSecuritySystemCameraGroupQuantity(selection, groupId, nextQuantity),
    );
  }

  function handleGroupModelChange(
    groupId: string,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const cameraId = event.currentTarget.value;
    setCatalogSelection((selection) =>
      changeSecuritySystemCameraGroupModel(selection, groupId, cameraId),
    );
  }

  function handleRemoveGroup(groupId: string) {
    setCatalogSelection((selection) =>
      removeSecuritySystemCameraGroup(selection, groupId),
    );
  }

  function handleRecorderChange(event: ChangeEvent<HTMLSelectElement>) {
    const recorderId = event.currentTarget.value;
    setCatalogSelection((selection) =>
      changeSecuritySystemRecorder(selection, recorderId),
    );
  }

  function handlePresentationChange(event: ChangeEvent<HTMLInputElement>) {
    const nextPresentationId = event.currentTarget.value;
    if (isSecuritySystemPresentationId(nextPresentationId)) {
      setPresentationId(nextPresentationId);
    }
  }

  const distribution = configuration.distribution;

  return (
    <div className={formStyles.calculator}>
      <section className={formStyles.form}>
        <div className={formStyles.formHeading}>
          <div>
            <p className={formStyles.kicker}>Sistemas de seguridad</p>
            <h3>Selección de cámaras y grabador</h3>
          </div>
          <p className={formStyles.requiredNote}>Avanza por los filtros disponibles</p>
        </div>

        <div className={styles.selectionFlow}>
          <fieldset className={styles.optionGroup}>
            <legend>Tipo de sistema</legend>
            {SECURITY_SYSTEM_TYPE_OPTIONS.map((option) => (
              <label key={option.id} htmlFor={`${idPrefix}-type-${option.id}`}>
                <input
                  id={`${idPrefix}-type-${option.id}`}
                  type="radio"
                  name={`${idPrefix}-security-system-type`}
                  value={option.id}
                  checked={catalogSelection.systemTypeId === option.id}
                  onChange={handleSystemTypeChange}
                />
                <span>{option.name}</span>
              </label>
            ))}
          </fieldset>

          {catalogSelection.systemTypeId ? (
            <div className={formStyles.field}>
              <label htmlFor={`${idPrefix}-total-camera-quantity`}>
                Cantidad total de cámaras
              </label>
              <div className={formStyles.inputShell}>
                <input
                  id={`${idPrefix}-total-camera-quantity`}
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={catalogSelection.totalCameraQuantity}
                  aria-invalid={!totalCameraQuantity.isValid}
                  aria-describedby={
                    totalCameraQuantity.isValid
                      ? undefined
                      : `${idPrefix}-total-camera-quantity-error`
                  }
                  onChange={handleTotalQuantityChange}
                />
                <span>unidades</span>
              </div>
              {!totalCameraQuantity.isValid ? (
                <p
                  id={`${idPrefix}-total-camera-quantity-error`}
                  className={styles.fieldError}
                  role="alert"
                >
                  {totalCameraQuantity.errorMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          {catalogSelection.systemTypeId ? (
            <div className={formStyles.field}>
              <label htmlFor={`${idPrefix}-camera-brand`}>Marca</label>
              <select
                id={`${idPrefix}-camera-brand`}
                value={catalogSelection.brand ?? ""}
                onChange={handleBrandChange}
              >
                <option value="">Selecciona una marca</option>
                {availableBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {catalogSelection.systemTypeId && catalogSelection.brand ? (
            <div className={`${formStyles.field} ${styles.fullWidth}`}>
              <label htmlFor={`${idPrefix}-camera-resolution`}>Resolución</label>
              <select
                id={`${idPrefix}-camera-resolution`}
                value={catalogSelection.resolutionGroup ?? ""}
                onChange={handleResolutionChange}
              >
                <option value="">Selecciona una resolución</option>
                {availableResolutionGroups.map((resolution) => (
                  <option key={resolution} value={resolution}>
                    {CAMERA_RESOLUTION_GROUP_NAMES[resolution]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {canDistribute ? (
            <section className={styles.distributionSection}>
              <div className={styles.distributionHeading}>
                <div>
                  <p className={styles.sectionKicker}>Configuración por ambiente</p>
                  <h4>Distribución de cámaras</h4>
                </div>
                <div
                  className={`${styles.distributionStatus} ${
                    distribution.status === "exact"
                      ? styles.distributionStatusValid
                      : styles.distributionStatusPending
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {distribution.assignedQuantity !== null &&
                  distribution.totalQuantity !== null ? (
                    <strong>
                      {distribution.assignedQuantity} de {distribution.totalQuantity}{" "}
                      cámaras asignadas
                    </strong>
                  ) : (
                    <strong>Revisa las cantidades de cámaras</strong>
                  )}
                  {distribution.errorMessage ? (
                    <span>{distribution.errorMessage}</span>
                  ) : (
                    <span>Distribución completa</span>
                  )}
                </div>
              </div>

              <div className={styles.cameraGroupList}>
                {catalogSelection.cameraGroups.map((group, index) => (
                  <CameraGroupEditor
                    key={group.id}
                    idPrefix={idPrefix}
                    selection={catalogSelection}
                    group={group}
                    groupNumber={index + 1}
                    onEnvironmentChange={handleGroupEnvironmentChange}
                    onFormatChange={handleGroupFormatChange}
                    onQuantityChange={handleGroupQuantityChange}
                    onModelChange={handleGroupModelChange}
                    onRemove={handleRemoveGroup}
                  />
                ))}
              </div>

              {catalogSelection.cameraGroups.length === 0 ? (
                <p className={styles.emptyGroups}>
                  Agrega el primer grupo para distribuir las cámaras por ambiente,
                  formato y modelo.
                </p>
              ) : null}

              <button
                type="button"
                className={styles.addGroupButton}
                onClick={handleAddGroup}
              >
                + Agregar otro grupo
              </button>
            </section>
          ) : null}

          {configuration.isComplete &&
          catalogSelection.systemTypeId !== SECURITY_SYSTEM_TYPE_IDS.wifi ? (
            <div className={`${formStyles.field} ${styles.fullWidth}`}>
              <label htmlFor={`${idPrefix}-recorder`}>
                {catalogSelection.systemTypeId === SECURITY_SYSTEM_TYPE_IDS.analog
                  ? "Grabador DVR/XVR"
                  : "Grabador NVR"}
              </label>
              <select
                id={`${idPrefix}-recorder`}
                value={catalogSelection.recorderId ?? ""}
                onChange={handleRecorderChange}
              >
                <option value="">Selecciona un grabador</option>
                {recorderCandidates.map(
                  ({ recorder, compatibility, isRecommended }) => (
                    <option key={recorder.id} value={recorder.id}>
                      {isRecommended ? "Recomendado · " : ""}
                      {compatibility.hasWarning ? "Capacidad insuficiente · " : ""}
                      {recorder.reference} · {recorder.channels} canales
                      {recorder.recorderType === "nvr"
                        ? ` · ${recorder.poePorts} puertos PoE`
                        : ""}
                    </option>
                  ),
                )}
              </select>
              <p className={formStyles.fieldHelp}>
                La recomendación usa la cantidad total sin reservar canales para
                expansión. Puedes elegir una opción insuficiente deliberadamente.
              </p>
            </div>
          ) : null}

          <fieldset className={`${styles.optionGroup} ${styles.presentationGroup}`}>
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
            <p className={formStyles.kicker}>Selección actual</p>
            <h3>
              {selectedCameraGroups.length > 0
                ? `${selectedCameraGroups.length} grupo${
                    selectedCameraGroups.length === 1 ? "" : "s"
                  } con modelo`
                : "Modelos pendientes"}
            </h3>
          </div>
        </div>

        {selectedCameraGroups.length > 0 ? (
          <div className={styles.selectedProducts}>
            {selectedCameraGroups.map(({ group, camera }, index) => (
              <div className={styles.productCard} key={group.id}>
                <div className={styles.productHeading}>
                  <h4>Cámara / grupo {index + 1}</h4>
                  <span>{group.quantity} unidades</span>
                </div>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Ambiente</dt>
                    <dd>{CAMERA_ENVIRONMENT_NAMES[group.environment!]}</dd>
                  </div>
                  <div>
                    <dt>Marca</dt>
                    <dd>{camera.brand}</dd>
                  </div>
                  <div>
                    <dt>Referencia</dt>
                    <dd>{camera.reference}</dd>
                  </div>
                  <div>
                    <dt>Formato</dt>
                    <dd>{camera.format}</dd>
                  </div>
                  <div className={styles.descriptionDetail}>
                    <dt>Descripción técnica publicada</dt>
                    <dd>{camera.description}</dd>
                  </div>
                  <div>
                    <dt>Precio recomendado</dt>
                    <dd>{formatCop(camera.salePriceCop)}</dd>
                  </div>
                  <div>
                    <dt>Precio recomendado con accesorios</dt>
                    <dd>{formatCop(camera.withAccessoriesSalePriceCop)}</dd>
                  </div>
                </dl>
              </div>
            ))}

            {configuration.isComplete &&
            catalogSelection.systemTypeId === SECURITY_SYSTEM_TYPE_IDS.wifi ? (
              <p className={styles.wifiNotice}>
                Para cámaras Wi-Fi no se selecciona grabador en este flujo.
              </p>
            ) : selectedRecorderCandidate ? (
              <div className={styles.productCard}>
                <div className={styles.productHeading}>
                  <h4>Grabador seleccionado</h4>
                  {selectedRecorderCandidate.isRecommended ? (
                    <span>Recomendado</span>
                  ) : null}
                </div>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Marca</dt>
                    <dd>{selectedRecorderCandidate.recorder.brand}</dd>
                  </div>
                  <div>
                    <dt>Referencia</dt>
                    <dd>{selectedRecorderCandidate.recorder.reference}</dd>
                  </div>
                  <div>
                    <dt>Canales</dt>
                    <dd>{selectedRecorderCandidate.recorder.channels}</dd>
                  </div>
                  {selectedRecorderCandidate.recorder.recorderType === "nvr" ? (
                    <div>
                      <dt>Puertos PoE</dt>
                      <dd>{selectedRecorderCandidate.recorder.poePorts}</dd>
                    </div>
                  ) : null}
                  <div className={styles.descriptionDetail}>
                    <dt>Descripción técnica publicada</dt>
                    <dd>{selectedRecorderCandidate.recorder.description}</dd>
                  </div>
                  <div>
                    <dt>Precio recomendado</dt>
                    <dd>{formatCop(selectedRecorderCandidate.recorder.salePriceCop)}</dd>
                  </div>
                </dl>
                {selectedRecorderCandidate.compatibility.hasWarning ? (
                  <p className={styles.warning} role="status">
                    <strong>Advertencia:</strong> este grabador tiene{" "}
                    {selectedRecorderCandidate.recorder.channels} canales para{" "}
                    {totalCameraQuantity.value} cámaras. La selección permanece
                    disponible y no bloquea el flujo.
                  </p>
                ) : null}
              </div>
            ) : configuration.isComplete &&
              catalogSelection.systemTypeId !== SECURITY_SYSTEM_TYPE_IDS.wifi ? (
              <p className={styles.recorderNotice}>
                Selecciona un grabador para consultar sus datos publicados. No se
                elegirá uno automáticamente.
              </p>
            ) : null}
          </div>
        ) : (
          <div className={formStyles.emptyResult}>
            <span aria-hidden="true">CCTV</span>
            <p>
              Elige el tipo de sistema, completa los filtros generales y distribuye
              las cámaras en uno o más grupos.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
