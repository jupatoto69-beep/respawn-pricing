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
  isSecuritySystemCameraAccessorySelectionId,
  isSecuritySystemInstallationTypeId,
  isSecuritySystemPresentationId,
  isSecuritySystemRecorderConfigurationId,
  isSecuritySystemTypeId,
  SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_OPTIONS,
  SECURITY_SYSTEM_INSTALLATION_OPTIONS,
  SECURITY_SYSTEM_PRESENTATION_OPTIONS,
  SECURITY_SYSTEM_RECORDER_CONFIGURATION_OPTIONS,
  SECURITY_SYSTEM_TYPE_IDS,
  SECURITY_SYSTEM_TYPE_OPTIONS,
  type SecuritySystemCameraAccessorySelectionId,
  type SecuritySystemInstallationTypeId,
  type SecuritySystemPresentationId,
  type SecuritySystemRecorderConfigurationId,
  type SecuritySystemTypeId,
} from "@/lib/pricing/security-system-options";
import { HARD_DRIVE_CATALOG } from "@/lib/pricing/security-system-catalog/hard-drive-catalog";
import { hasPublishedSalePrice } from "@/lib/pricing/security-system-catalog/catalog-types";
import { createSecuritySystemQuotationLineDraft } from "@/lib/pricing/security-system-quotation-line";
import {
  calculateSecuritySystemPrice,
  SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE,
  SECURITY_SYSTEM_NO_HARD_DRIVE,
  type SecuritySystemCameraGroupPrice,
} from "@/lib/pricing/security-system-pricing";
import type { QuotationLineDraft } from "@/lib/pricing/temporary-quotation";

import formStyles from "./area-pricing-calculator.module.css";
import styles from "./security-systems-pricing-calculator.module.css";

type SecuritySystemsPricingCalculatorProps = Readonly<{
  initialSystemTypeId?: SecuritySystemTypeId;
  initialPresentationId?: SecuritySystemPresentationId;
  initialCatalogSelection?: SecuritySystemCatalogSelection;
  initialCommercialSelection?: SecuritySystemCommercialSelection;
  onAddQuotationLine?: (line: QuotationLineDraft) => void;
}>;

export type SecuritySystemCameraGroupCommercialSelection = Readonly<{
  accessorySelectionId: SecuritySystemCameraAccessorySelectionId | null;
  installationTypeId: SecuritySystemInstallationTypeId | null;
}>;

export type SecuritySystemCommercialSelection = Readonly<{
  cameraGroups: Readonly<
    Record<string, SecuritySystemCameraGroupCommercialSelection>
  >;
  hardDriveSelectionId: string | null;
  recorderConfigurationId: SecuritySystemRecorderConfigurationId | null;
}>;

const EMPTY_GROUP_COMMERCIAL_SELECTION: SecuritySystemCameraGroupCommercialSelection =
  Object.freeze({ accessorySelectionId: null, installationTypeId: null });

function createInitialCommercialSelection(): SecuritySystemCommercialSelection {
  return Object.freeze({
    cameraGroups: Object.freeze({}),
    hardDriveSelectionId: null,
    recorderConfigurationId: null,
  });
}

type CameraGroupEditorProps = Readonly<{
  idPrefix: string;
  selection: SecuritySystemCatalogSelection;
  group: CameraGroup;
  groupNumber: number;
  commercialSelection: SecuritySystemCameraGroupCommercialSelection;
  pricing: SecuritySystemCameraGroupPrice | null;
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
  onAccessorySelectionChange: (
    groupId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onInstallationChange: (
    groupId: string,
    event: ChangeEvent<HTMLInputElement>,
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
  commercialSelection,
  pricing,
  onEnvironmentChange,
  onFormatChange,
  onQuantityChange,
  onModelChange,
  onAccessorySelectionChange,
  onInstallationChange,
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

        {group.cameraId ? (
          <fieldset className={styles.groupCommercialChoice}>
            <legend>Accesorios</legend>
            {SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_OPTIONS.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name={`${idPrefix}-${group.id}-accessories`}
                  value={option.id}
                  checked={commercialSelection.accessorySelectionId === option.id}
                  onChange={(event) =>
                    onAccessorySelectionChange(group.id, event)
                  }
                />
                <span>{option.name}</span>
              </label>
            ))}
          </fieldset>
        ) : null}

        {group.cameraId ? (
          <fieldset className={styles.groupCommercialChoice}>
            <legend>Instalación</legend>
            {Object.values(SECURITY_SYSTEM_INSTALLATION_OPTIONS).map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name={`${idPrefix}-${group.id}-installation`}
                  value={option.id}
                  checked={commercialSelection.installationTypeId === option.id}
                  onChange={(event) => onInstallationChange(group.id, event)}
                />
                <span>{option.name}</span>
              </label>
            ))}
          </fieldset>
        ) : null}
      </div>

      {pricing?.isComplete && pricing.groupSubtotalCop !== null ? (
        <div className={styles.groupSubtotal} aria-live="polite">
          <span>Subtotal del grupo</span>
          <strong>{formatCop(pricing.groupSubtotalCop)}</strong>
        </div>
      ) : null}
    </article>
  );
}

export function SecuritySystemsPricingCalculator({
  initialSystemTypeId,
  initialPresentationId,
  initialCatalogSelection,
  initialCommercialSelection,
  onAddQuotationLine,
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
  const [commercialSelection, setCommercialSelection] =
    useState<SecuritySystemCommercialSelection>(
      initialCommercialSelection ?? createInitialCommercialSelection,
    );
  const [addFeedbackSequence, setAddFeedbackSequence] = useState(0);

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
  const selectedHardDrive =
    commercialSelection.hardDriveSelectionId === SECURITY_SYSTEM_NO_HARD_DRIVE
      ? SECURITY_SYSTEM_NO_HARD_DRIVE
      : HARD_DRIVE_CATALOG.find(
          (hardDrive) =>
            hardDrive.id === commercialSelection.hardDriveSelectionId,
        ) ?? null;
  const pricingResult = catalogSelection.systemTypeId
      ? calculateSecuritySystemPrice({
        systemTypeId: catalogSelection.systemTypeId,
        totalCameraQuantity: totalCameraQuantity.isValid
          ? totalCameraQuantity.value
          : null,
        cameraGroups: catalogSelection.cameraGroups.map((group) => {
          const quantity = validateSecuritySystemCameraQuantity(group.quantity);
          const groupCommercialSelection =
            commercialSelection.cameraGroups[group.id] ??
            EMPTY_GROUP_COMMERCIAL_SELECTION;
          return {
            id: group.id,
            camera: getCameraForGroup(catalogSelection, group),
            quantity: quantity.isValid ? quantity.value : null,
            accessorySelectionId:
              groupCommercialSelection.accessorySelectionId,
            installationTypeId: groupCommercialSelection.installationTypeId,
          };
        }),
        recorder: selectedRecorderCandidate?.recorder ?? null,
        hardDrive: selectedHardDrive,
        recorderConfigurationId: commercialSelection.recorderConfigurationId,
      })
    : null;
  const canAddToQuotation = Boolean(
    configuration.isComplete &&
      pricingResult?.isPriceComplete &&
      pricingResult.finalTotalCop !== null &&
      presentationId &&
      onAddQuotationLine,
  );

  function handleSystemTypeChange(event: ChangeEvent<HTMLInputElement>) {
    const nextSystemTypeId = event.currentTarget.value;
    if (isSecuritySystemTypeId(nextSystemTypeId)) {
      setCatalogSelection((selection) =>
        changeSecuritySystemType(selection, nextSystemTypeId),
      );
      setCommercialSelection(createInitialCommercialSelection());
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
    setCommercialSelection((selection) => {
      if (!(groupId in selection.cameraGroups)) return selection;
      const cameraGroups = { ...selection.cameraGroups };
      delete cameraGroups[groupId];
      return Object.freeze({
        ...selection,
        cameraGroups: Object.freeze(cameraGroups),
      });
    });
  }

  function updateGroupCommercialSelection(
    groupId: string,
    updates: Partial<SecuritySystemCameraGroupCommercialSelection>,
  ) {
    setCommercialSelection((selection) => {
      const current =
        selection.cameraGroups[groupId] ?? EMPTY_GROUP_COMMERCIAL_SELECTION;
      return Object.freeze({
        ...selection,
        cameraGroups: Object.freeze({
          ...selection.cameraGroups,
          [groupId]: Object.freeze({ ...current, ...updates }),
        }),
      });
    });
  }

  function handleGroupAccessorySelectionChange(
    groupId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const accessorySelectionId = event.currentTarget.value;
    if (isSecuritySystemCameraAccessorySelectionId(accessorySelectionId)) {
      updateGroupCommercialSelection(groupId, { accessorySelectionId });
    }
  }

  function handleGroupInstallationChange(
    groupId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const installationTypeId = event.currentTarget.value;
    if (isSecuritySystemInstallationTypeId(installationTypeId)) {
      updateGroupCommercialSelection(groupId, {
        installationTypeId,
      });
    }
  }

  function handleRecorderChange(event: ChangeEvent<HTMLSelectElement>) {
    const recorderId = event.currentTarget.value;
    setCatalogSelection((selection) =>
      changeSecuritySystemRecorder(selection, recorderId),
    );
  }

  function handleHardDriveChange(event: ChangeEvent<HTMLSelectElement>) {
    const hardDriveSelectionId = event.currentTarget.value;
    if (hardDriveSelectionId === "") {
      setCommercialSelection((selection) =>
        Object.freeze({ ...selection, hardDriveSelectionId: null }),
      );
      return;
    }
    if (
      hardDriveSelectionId === SECURITY_SYSTEM_NO_HARD_DRIVE ||
      HARD_DRIVE_CATALOG.some(
        (hardDrive) => hardDrive.id === hardDriveSelectionId,
      )
    ) {
      setCommercialSelection((selection) =>
        Object.freeze({ ...selection, hardDriveSelectionId }),
      );
    }
  }

  function handleRecorderConfigurationChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const recorderConfigurationId = event.currentTarget.value;
    if (isSecuritySystemRecorderConfigurationId(recorderConfigurationId)) {
      setCommercialSelection((selection) =>
        Object.freeze({ ...selection, recorderConfigurationId }),
      );
    }
  }

  function handlePresentationChange(event: ChangeEvent<HTMLInputElement>) {
    const nextPresentationId = event.currentTarget.value;
    if (isSecuritySystemPresentationId(nextPresentationId)) {
      setPresentationId(nextPresentationId);
    }
  }

  function handleAddQuotationLine() {
    if (
      !canAddToQuotation ||
      !pricingResult ||
      !presentationId ||
      !onAddQuotationLine
    ) {
      return;
    }
    onAddQuotationLine(
      createSecuritySystemQuotationLineDraft(pricingResult, presentationId),
    );
    setAddFeedbackSequence((sequence) => sequence + 1);
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
                    commercialSelection={
                      commercialSelection.cameraGroups[group.id] ??
                      EMPTY_GROUP_COMMERCIAL_SELECTION
                    }
                    pricing={
                      pricingResult?.cameraGroups.find(
                        (pricedGroup) => pricedGroup.id === group.id,
                      ) ?? null
                    }
                    onEnvironmentChange={handleGroupEnvironmentChange}
                    onFormatChange={handleGroupFormatChange}
                    onQuantityChange={handleGroupQuantityChange}
                    onModelChange={handleGroupModelChange}
                    onAccessorySelectionChange={
                      handleGroupAccessorySelectionChange
                    }
                    onInstallationChange={handleGroupInstallationChange}
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

          {configuration.isComplete &&
          catalogSelection.systemTypeId !== SECURITY_SYSTEM_TYPE_IDS.wifi ? (
            <div className={`${formStyles.field} ${styles.fullWidth}`}>
              <label htmlFor={`${idPrefix}-hard-drive`}>Disco duro</label>
              <select
                id={`${idPrefix}-hard-drive`}
                value={commercialSelection.hardDriveSelectionId ?? ""}
                onChange={handleHardDriveChange}
              >
                <option value="">Selecciona una opción</option>
                <option value={SECURITY_SYSTEM_NO_HARD_DRIVE}>Sin disco</option>
                {HARD_DRIVE_CATALOG.map((hardDrive) => (
                  <option key={hardDrive.id} value={hardDrive.id}>
                    {hardDrive.reference} · {hardDrive.capacity}{" "}
                    {hardDrive.capacityUnit} ·{" "}
                    {hasPublishedSalePrice(hardDrive)
                      ? formatCop(hardDrive.salePriceCop)
                      : "Consultar"}
                  </option>
                ))}
              </select>
              {pricingResult?.hardDrive.status === "manual-confirmation" ? (
                <p className={styles.warning} role="status">
                  <strong>Precio por confirmar:</strong> este disco figura como
                  “Consultar”. No se asignará COP 0 y el sistema no puede agregarse
                  a la cotización hasta contar con un precio publicado.
                </p>
              ) : null}
            </div>
          ) : null}

          {configuration.isComplete &&
          catalogSelection.systemTypeId !== SECURITY_SYSTEM_TYPE_IDS.wifi ? (
            <fieldset className={`${styles.optionGroup} ${styles.fullWidth}`}>
              <legend>Configuración DVR/NVR</legend>
              {SECURITY_SYSTEM_RECORDER_CONFIGURATION_OPTIONS.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name={`${idPrefix}-recorder-configuration`}
                    value={option.id}
                    checked={
                      commercialSelection.recorderConfigurationId === option.id
                    }
                    onChange={handleRecorderConfigurationChange}
                  />
                  <span>
                    <strong>{option.name}</strong>
                    <small>
                      {option.id === "included"
                        ? `${formatCop(option.priceCop)} por sistema. Configuración en celular incluida; acceso remoto no incluido.`
                        : "No se cobra el servicio de configuración."}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
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
            <p className={formStyles.kicker}>Resumen del sistema</p>
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
            {selectedCameraGroups.map(({ group, camera }, index) => {
              const pricedGroup = pricingResult?.cameraGroups.find(
                (candidate) => candidate.id === group.id,
              );
              return (
                <div className={styles.productCard} key={group.id}>
                  <div className={styles.productHeading}>
                    <h4>Cámara / grupo {index + 1}</h4>
                    <span>{group.quantity} unidades</span>
                  </div>
                  <dl className={styles.detailList}>
                    <div>
                      <dt>Ambiente y formato</dt>
                      <dd>
                        {CAMERA_ENVIRONMENT_NAMES[group.environment!]} ·{" "}
                        {camera.format}
                      </dd>
                    </div>
                    <div>
                      <dt>Modelo</dt>
                      <dd>{camera.reference}</dd>
                    </div>
                    <div className={styles.descriptionDetail}>
                      <dt>Descripción técnica publicada</dt>
                      <dd>{camera.description}</dd>
                    </div>
                    <div>
                      <dt>Precio sin accesorios</dt>
                      <dd>{formatCop(camera.salePriceCop)}</dd>
                    </div>
                    <div>
                      <dt>Precio con accesorios</dt>
                      <dd>{formatCop(camera.withAccessoriesSalePriceCop)}</dd>
                    </div>
                    {pricedGroup?.cameraSubtotalCop !== null &&
                    pricedGroup?.cameraSubtotalCop !== undefined ? (
                      <div>
                        <dt>Cámaras</dt>
                        <dd>
                          {pricedGroup.quantity} ×{" "}
                          {formatCop(pricedGroup.cameraUnitPriceCop!)} ={" "}
                          {formatCop(pricedGroup.cameraSubtotalCop)}
                        </dd>
                      </div>
                    ) : (
                      <div>
                        <dt>Accesorios</dt>
                        <dd>Selección pendiente</dd>
                      </div>
                    )}
                    {pricedGroup?.installationSubtotalCop !== null &&
                    pricedGroup?.installationSubtotalCop !== undefined ? (
                      <div>
                        <dt>Instalación</dt>
                        <dd>
                          {pricedGroup.installationName}
                          {pricedGroup.installationSubtotalCop > 0
                            ? ` · ${formatCop(pricedGroup.installationSubtotalCop)}`
                            : ""}
                        </dd>
                      </div>
                    ) : (
                      <div>
                        <dt>Instalación</dt>
                        <dd>Selección pendiente</dd>
                      </div>
                    )}
                    {pricedGroup?.groupSubtotalCop !== null &&
                    pricedGroup?.groupSubtotalCop !== undefined ? (
                      <div className={styles.totalDetail}>
                        <dt>Subtotal del grupo</dt>
                        <dd>{formatCop(pricedGroup.groupSubtotalCop)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              );
            })}

            {configuration.isComplete &&
            catalogSelection.systemTypeId === SECURITY_SYSTEM_TYPE_IDS.wifi ? (
              <p className={styles.wifiNotice}>
                Para cámaras Wi-Fi no se selecciona grabador en este flujo. Tampoco
                se incluye disco duro ni configuración DVR/NVR.
              </p>
            ) : selectedRecorderCandidate ? (
              <div className={styles.productCard}>
                <div className={styles.productHeading}>
                  <h4>Grabador</h4>
                  {selectedRecorderCandidate.isRecommended ? (
                    <span>Recomendado</span>
                  ) : null}
                </div>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Modelo</dt>
                    <dd>{selectedRecorderCandidate.recorder.reference}</dd>
                  </div>
                  <div>
                    <dt>Capacidad</dt>
                    <dd>{selectedRecorderCandidate.recorder.channels} canales</dd>
                  </div>
                  {selectedRecorderCandidate.recorder.recorderType === "nvr" ? (
                    <div>
                      <dt>Puertos PoE</dt>
                      <dd>{selectedRecorderCandidate.recorder.poePorts}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Precio</dt>
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
                Selecciona explícitamente un grabador para completar el precio.
              </p>
            ) : null}

            {pricingResult?.hardDrive.status === "priced" ? (
              <div className={styles.productCard}>
                <h4>Disco duro</h4>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Modelo y capacidad</dt>
                    <dd>
                      {pricingResult.hardDrive.reference} ·{" "}
                      {pricingResult.hardDrive.capacityLabel}
                    </dd>
                  </div>
                  <div>
                    <dt>Precio</dt>
                    <dd>{formatCop(pricingResult.hardDrive.priceCop!)}</dd>
                  </div>
                </dl>
              </div>
            ) : pricingResult?.hardDrive.status === "none" ? (
              <p className={styles.recorderNotice}>Disco duro: sin disco.</p>
            ) : null}

            {pricingResult?.recorderConfiguration.status === "included" ? (
              <div className={styles.productCard}>
                <h4>Configuración DVR/NVR</h4>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Servicio</dt>
                    <dd>
                      {formatCop(pricingResult.recorderConfiguration.priceCop!)}
                    </dd>
                  </div>
                  <div className={styles.descriptionDetail}>
                    <dt>Alcance</dt>
                    <dd>
                      Configuración del DVR/NVR y configuración en celular incluida.
                      Acceso remoto no incluido.
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <p className={styles.cableNotice}>
              <strong>Importante:</strong> {SECURITY_SYSTEM_CABLE_EXCLUSION_NOTE}
            </p>

            {pricingResult?.isPriceComplete &&
            pricingResult.rawTotalCop !== null &&
            pricingResult.finalTotalCop !== null ? (
              <div className={styles.systemTotal} aria-live="polite">
                <div>
                  <span>Subtotal antes de redondeo</span>
                  <strong>{formatCop(pricingResult.rawTotalCop)}</strong>
                </div>
                <div>
                  <span>Total del sistema</span>
                  <strong>{formatCop(pricingResult.finalTotalCop)}</strong>
                </div>
              </div>
            ) : (
              <p className={styles.recorderNotice}>
                Completa todas las decisiones comerciales para obtener el total.
              </p>
            )}

            {canAddToQuotation ? (
              <div className={formStyles.quotationAction}>
                <button
                  className={formStyles.primaryButton}
                  type="button"
                  aria-label="Agregar sistema de seguridad a la cotización"
                  onClick={handleAddQuotationLine}
                >
                  Agregar a la cotización
                </button>
                <p
                  key={addFeedbackSequence}
                  className={formStyles.quotationFeedback}
                  aria-live="polite"
                >
                  {addFeedbackSequence > 0
                    ? "Sistema agregado a la cotización."
                    : ""}
                </p>
              </div>
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
