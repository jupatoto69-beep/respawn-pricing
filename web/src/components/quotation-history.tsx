"use client";

import {
  type MouseEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "@/lib/quotation/business-profile";
import {
  createHistoricalQuotationPreviewViewModel,
  formatQuotationCop,
} from "@/lib/quotation/quotation-preview-view-model";
import {
  createSupabaseQuotationRepository,
  QUOTATION_OPEN_FAILURE_MESSAGE,
  type QuotationRepository,
} from "@/lib/quotations/quotation-repository";
import type {
  HistoricalQuotation,
  HistoricalQuotationSummary,
  QuotationStatus,
} from "@/lib/quotations/quotation-snapshot";
import { quotationDisplayStatus } from "@/lib/quotations/quotation-status";
import { createClient } from "@/lib/supabase/client";

import { QuotationPreviewModal } from "./quotation-preview-modal";
import styles from "./quotation-history.module.css";

type QuotationHistoryProps = Readonly<{
  refreshRevision: number;
  repository?: QuotationRepository;
}>;

type QuotationHistoryListProps = Readonly<{
  quotations: readonly HistoricalQuotationSummary[];
  openingQuotationId: string | null;
  changingQuotationId: string | null;
  onChangeStatus: (quotationId: string, status: QuotationStatus) => void;
  onOpen: (
    quotationId: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
}>;

const savedAtFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

function formatStoredDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatSavedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : savedAtFormatter.format(date);
}

export function QuotationHistoryList({
  quotations,
  openingQuotationId,
  changingQuotationId,
  onChangeStatus,
  onOpen,
}: QuotationHistoryListProps) {
  if (quotations.length === 0) {
    return <p className={styles.emptyState}>Aún no hay cotizaciones guardadas.</p>;
  }

  return (
    <ol className={styles.historyList}>
      {quotations.map((quotation) => (
        <li key={quotation.id} className={styles.historyItem}>
          <div>
            <strong>
              {quotation.quotationNumber}
            </strong>
            <span>{quotation.customerName ?? "Cotización sin nombre de cliente"}</span>
            <span>Fecha de cotización: {formatStoredDate(quotation.quotationDate)}</span>
            <span>Guardada: {formatSavedAt(quotation.createdAt)}</span>
            <span>Estado: {quotationDisplayStatus(quotation.status, quotation.quotationDate, quotation.validityDays)}</span>
          </div>
          <div className={styles.historyActions}>
            <data value={quotation.totalCop}>
              {formatQuotationCop(quotation.totalCop)}
            </data>
            <label className={styles.statusControl}>
              Cambiar estado
              <select
                aria-label={`Cambiar estado de ${quotation.quotationNumber}`}
                value={quotation.status}
                disabled={changingQuotationId !== null}
                aria-busy={changingQuotationId === quotation.id}
                onChange={(event) => onChangeStatus(quotation.id, event.currentTarget.value as QuotationStatus)}
              >
                <option value="sent">Enviada</option>
                <option value="accepted">Aceptada</option>
                <option value="rejected">Rechazada</option>
              </select>
            </label>
            <button
              type="button"
              disabled={openingQuotationId !== null}
              aria-busy={openingQuotationId === quotation.id}
              onClick={(event) => onOpen(quotation.id, event)}
            >
              {openingQuotationId === quotation.id ? "Abriendo…" : "Ver cotización"}
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function QuotationHistory({
  refreshRevision,
  repository,
}: QuotationHistoryProps) {
  const titleId = useId();
  const repositoryRef = useRef<QuotationRepository | null>(repository ?? null);
  const openTriggerRef = useRef<HTMLButtonElement>(null);
  const statusChangeLockRef = useRef(false);
  const [quotations, setQuotations] = useState<
    readonly HistoricalQuotationSummary[]
  >([]);
  const [selectedQuotation, setSelectedQuotation] =
    useState<HistoricalQuotation | null>(null);
  const [loadedRevision, setLoadedRevision] = useState<number | null>(null);
  const [openingQuotationId, setOpeningQuotationId] = useState<string | null>(
    null,
  );
  const [changingQuotationId, setChangingQuotationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoading = loadedRevision !== refreshRevision;

  function getRepository(): QuotationRepository {
    repositoryRef.current ??= createSupabaseQuotationRepository(createClient());
    return repositoryRef.current;
  }

  useEffect(() => {
    let isActive = true;

    async function loadHistory() {
      try {
        const result = await getRepository().list();

        if (!isActive) {
          return;
        }

        if (!result.ok) {
          setError(result.message);
          return;
        }

        setQuotations(result.value);
        setError(null);
      } catch {
        if (isActive) {
          setError(
            "No pudimos cargar el historial de cotizaciones. Inténtalo de nuevo.",
          );
        }
      } finally {
        if (isActive) {
          setLoadedRevision(refreshRevision);
        }
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, [refreshRevision]);

  async function handleOpen(
    quotationId: string,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (openingQuotationId !== null) {
      return;
    }

    openTriggerRef.current = event.currentTarget;
    setOpeningQuotationId(quotationId);
    setError(null);

    try {
      const result = await getRepository().load(quotationId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSelectedQuotation(result.value);
    } catch {
      setError("No pudimos abrir la cotización guardada. Inténtalo de nuevo.");
    } finally {
      setOpeningQuotationId(null);
    }
  }

  async function handleChangeStatus(quotationId: string, status: QuotationStatus) {
    if (statusChangeLockRef.current) {
      return;
    }

    statusChangeLockRef.current = true;
    setChangingQuotationId(quotationId);
    setError(null);

    try {
      const result = await getRepository().changeStatus(quotationId, status);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setQuotations((current) => current.map((quotation) =>
        quotation.id === quotationId
          ? Object.freeze({ ...quotation, status: result.value })
          : quotation,
      ));
      setSelectedQuotation((current) =>
        current?.id === quotationId
          ? Object.freeze({ ...current, status: result.value })
          : current,
      );
    } catch {
      setError("No pudimos cambiar el estado de la cotización. Inténtalo de nuevo.");
    } finally {
      statusChangeLockRef.current = false;
      setChangingQuotationId(null);
    }
  }

  const { selectedPreview, selectedPreviewError } = useMemo(() => {
    if (selectedQuotation === null) {
      return { selectedPreview: null, selectedPreviewError: null };
    }

    try {
      return {
        selectedPreview: createHistoricalQuotationPreviewViewModel({
          quotation: selectedQuotation,
          businessProfile: DIGITAL_RESPAWN_BUSINESS_PROFILE,
        }),
        selectedPreviewError: null,
      };
    } catch {
      return {
        selectedPreview: null,
        selectedPreviewError: QUOTATION_OPEN_FAILURE_MESSAGE,
      };
    }
  }, [selectedQuotation]);

  return (
    <section className={styles.history} aria-labelledby={titleId}>
      <div className={styles.heading}>
        <div>
          <p>Archivo histórico</p>
          <h2 id={titleId}>Cotizaciones guardadas</h2>
        </div>
        <span>Últimas 50</span>
      </div>

      {error === null && selectedPreviewError === null ? null : (
        <p className={styles.error} role="alert">
          {error ?? selectedPreviewError}
        </p>
      )}

      {isLoading ? (
        <p className={styles.status}>Cargando cotizaciones…</p>
      ) : (
        <QuotationHistoryList
          quotations={quotations}
          openingQuotationId={openingQuotationId}
          changingQuotationId={changingQuotationId}
          onChangeStatus={handleChangeStatus}
          onOpen={handleOpen}
        />
      )}

      {selectedPreview === null ? null : (
        <QuotationPreviewModal
          isOpen
          preview={selectedPreview}
          returnFocusRef={openTriggerRef}
          onRequestClose={() => setSelectedQuotation(null)}
        />
      )}
    </section>
  );
}
