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
  DEFAULT_QUOTATION_QUERY,
  QUOTATION_PAGE_SIZE,
  QUOTATION_DELETE_FAILURE_MESSAGE,
  QUOTATION_OPEN_FAILURE_MESSAGE,
  type QuotationListQuery,
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
import { QuotationDeleteDialog } from "./quotation-delete-dialog";
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
  onDelete: (quotation: HistoricalQuotationSummary) => void;
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
  onDelete,
  onOpen,
}: QuotationHistoryListProps) {
  if (quotations.length === 0) {
    return <p className={styles.emptyState}>Aún no hay cotizaciones guardadas.</p>;
  }

  return (
    <div className={styles.listRegion}>
      <div className={styles.columnHeadings} aria-hidden="true">
        <span>Consecutivo y cliente</span>
        <span>Fecha de cotización</span>
        <span>Guardada</span>
        <span>Total</span>
        <span>Estado</span>
        <span>Cambiar estado</span>
        <span>Acciones</span>
      </div>
      <ol className={styles.historyList}>
        {quotations.map((quotation) => (
          <li key={quotation.id} className={styles.historyItem}>
            <div className={styles.identity}>
              <strong>{quotation.quotationNumber}</strong>
              <span>{quotation.customerName ?? "Cotización sin nombre de cliente"}</span>
            </div>
            <span className={styles.date}>Fecha de cotización: {formatStoredDate(quotation.quotationDate)}</span>
            <span className={styles.savedAt}>Guardada: {formatSavedAt(quotation.createdAt)}</span>
            <data className={styles.total} value={quotation.totalCop}>
              {formatQuotationCop(quotation.totalCop)}
            </data>
            <span className={styles.displayStatus}>
              Estado: {quotationDisplayStatus(quotation.status, quotation.quotationDate, quotation.validityDays)}
            </span>
            <label className={styles.statusControl}>
              <span className={styles.visuallyHidden}>Cambiar estado</span>
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
            <div className={styles.actions}>
              <button
                className={styles.openButton}
                type="button"
                disabled={openingQuotationId !== null}
                aria-busy={openingQuotationId === quotation.id}
                onClick={(event) => onOpen(quotation.id, event)}
              >
                {openingQuotationId === quotation.id ? "Abriendo…" : "Ver cotización"}
              </button>
              <button className={styles.deleteButton} type="button"
                onClick={() => onDelete(quotation)}
                aria-label={`Eliminar cotización ${quotation.quotationNumber}`}>
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
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
  const deleteLockRef = useRef(false);
  const [query, setQuery] = useState<QuotationListQuery>(DEFAULT_QUOTATION_QUERY);
  const [searchInput, setSearchInput] = useState("");
  const [reloadRevision, setReloadRevision] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [total, setTotal] = useState(0);
  const [deletingQuotation, setDeletingQuotation] = useState<HistoricalQuotationSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [quotations, setQuotations] = useState<
    readonly HistoricalQuotationSummary[]
  >([]);
  const [selectedQuotation, setSelectedQuotation] =
    useState<HistoricalQuotation | null>(null);
  const [openingQuotationId, setOpeningQuotationId] = useState<string | null>(
    null,
  );
  const [changingQuotationId, setChangingQuotationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestKey = JSON.stringify([query, refreshRevision, reloadRevision]);
  const isLoading = loadedKey !== requestKey || searchInput !== query.search;

  function updateQuery(patch: Partial<QuotationListQuery>) {
    setQuery((current) => ({ ...current, ...patch, page: 1 }));
    setSuccess(null);
  }

  function clearFilters() {
    setSearchInput("");
    setQuery(DEFAULT_QUOTATION_QUERY);
    setSuccess(null);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((current) => current.search === searchInput
        ? current : { ...current, search: searchInput, page: 1 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function getRepository(): QuotationRepository {
    repositoryRef.current ??= createSupabaseQuotationRepository(createClient());
    return repositoryRef.current;
  }

  useEffect(() => {
    let isActive = true;

    async function loadHistory() {
      try {
        const result = await getRepository().list(query);

        if (!isActive) {
          return;
        }

        if (!result.ok) {
          setError(result.message);
          setQuotations([]);
          setTotal(0);
          return;
        }

        if (query.page > 1 && result.value.quotations.length === 0) {
          setQuery((current) => ({ ...current, page: Math.max(1, Math.ceil(result.value.total / QUOTATION_PAGE_SIZE)) }));
          return;
        }
        setQuotations(result.value.quotations);
        setTotal(result.value.total);
        setError(null);
      } catch {
        if (isActive) {
          setError(
            "No pudimos cargar el historial de cotizaciones. Inténtalo de nuevo.",
          );
          setQuotations([]);
          setTotal(0);
        }
      } finally {
        if (isActive) {
          setLoadedKey(requestKey);
        }
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, [query, requestKey]);

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
      if (query.status !== "all") {
        setReloadRevision((current) => current + 1);
      }
    } catch {
      setError("No pudimos cambiar el estado de la cotización. Inténtalo de nuevo.");
    } finally {
      statusChangeLockRef.current = false;
      setChangingQuotationId(null);
    }
  }

  async function handleDelete(expectedQuotationNumber: string) {
    if (!deletingQuotation || expectedQuotationNumber !== deletingQuotation.quotationNumber || deleteLockRef.current) return;
    deleteLockRef.current = true;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await getRepository().delete(deletingQuotation.id, expectedQuotationNumber);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      const number = deletingQuotation.quotationNumber;
      setDeletingQuotation(null);
      setQuotations((current) => current.filter((item) => item.id !== deletingQuotation.id));
      setTotal((current) => Math.max(0, current - 1));
      setSuccess(`Cotización ${number} eliminada permanentemente.`);
      if (query.page > 1 && (query.page - 1) * QUOTATION_PAGE_SIZE >= total - 1) {
        setQuery((current) => ({ ...current, page: current.page - 1 }));
      } else {
        setReloadRevision((current) => current + 1);
      }
    } catch {
      setDeleteError(QUOTATION_DELETE_FAILURE_MESSAGE);
    } finally {
      deleteLockRef.current = false;
      setIsDeleting(false);
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
          <p>Resultados</p>
          <h2 id={titleId}>Gestionar cotizaciones</h2>
        </div>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.searchField}>Buscar
          <input type="search" value={searchInput} maxLength={120}
            placeholder="Consecutivo, cliente, documento, teléfono, email o ciudad"
            onChange={(event) => setSearchInput(event.currentTarget.value)} />
        </label>
        <label>Estado
          <select value={query.status} onChange={(event) => updateQuery({ status: event.currentTarget.value as QuotationListQuery["status"] })}>
            <option value="all">Todas</option><option value="sent">Enviadas</option>
            <option value="accepted">Aceptadas</option><option value="rejected">Rechazadas</option>
            <option value="expired">Vencidas</option>
          </select>
        </label>
        <label>Desde
          <input type="date" value={query.dateFrom} max={query.dateTo || undefined}
            onChange={(event) => {
              const dateFrom = event.currentTarget.value;
              updateQuery({ dateFrom, dateTo: query.dateTo && dateFrom > query.dateTo ? "" : query.dateTo });
            }} />
        </label>
        <label>Hasta
          <input type="date" value={query.dateTo} min={query.dateFrom || undefined}
            onChange={(event) => {
              const dateTo = event.currentTarget.value;
              updateQuery({ dateTo, dateFrom: query.dateFrom && dateTo && dateTo < query.dateFrom ? "" : query.dateFrom });
            }} />
        </label>
        <label>Ordenar por
          <select value={query.sort} onChange={(event) => updateQuery({ sort: event.currentTarget.value as QuotationListQuery["sort"] })}>
            <option value="recent">Más recientes</option><option value="oldest">Más antiguas</option>
            <option value="number_asc">Consecutivo ascendente</option><option value="number_desc">Consecutivo descendente</option>
            <option value="customer_asc">Cliente A-Z</option><option value="customer_desc">Cliente Z-A</option>
            <option value="total_desc">Mayor total</option><option value="total_asc">Menor total</option>
          </select>
        </label>
        <button type="button" className={styles.clearButton} onClick={clearFilters}>Limpiar filtros</button>
      </div>

      {success && <p className={styles.success} role="status">{success}</p>}

      {error === null && selectedPreviewError === null ? null : (
        <p className={styles.error} role="alert">
          {error ?? selectedPreviewError}
        </p>
      )}

      {isLoading ? (
        <p className={styles.status}>Cargando cotizaciones…</p>
      ) : (
        <>
        <p className={styles.count} aria-live="polite">{quotations.length} de {total} cotizaciones · Página {query.page}</p>
        {quotations.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No encontramos cotizaciones con estos criterios.</p>
            <button type="button" className={styles.clearButton} onClick={clearFilters}>Limpiar filtros</button>
          </div>
        ) : <QuotationHistoryList
          quotations={quotations}
          openingQuotationId={openingQuotationId}
          changingQuotationId={changingQuotationId}
          onChangeStatus={handleChangeStatus}
          onOpen={handleOpen}
          onDelete={(quotation) => { setDeletingQuotation(quotation); setDeleteError(null); setSuccess(null); }}
        />}
        <nav className={styles.pagination} aria-label="Páginas de cotizaciones">
          <button type="button" disabled={query.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>Anterior</button>
          <span>Página {query.page} de {Math.max(1, Math.ceil(total / QUOTATION_PAGE_SIZE))}</span>
          <button type="button" disabled={query.page >= Math.ceil(total / QUOTATION_PAGE_SIZE)} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Siguiente</button>
        </nav>
        </>
      )}

      {deletingQuotation && <QuotationDeleteDialog key={deletingQuotation.id}
        quotation={deletingQuotation} deleting={isDeleting} error={deleteError}
        onCancel={() => setDeletingQuotation(null)} onConfirm={(typedNumber) => { void handleDelete(typedNumber); }} />}

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
