// @vitest-environment jsdom

import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  QUOTATION_OPEN_FAILURE_MESSAGE,
  type QuotationRepository,
} from "@/lib/quotations/quotation-repository";
import type {
  HistoricalQuotation,
  HistoricalQuotationSummary,
} from "@/lib/quotations/quotation-snapshot";

import { QuotationHistory, QuotationHistoryList } from "./quotation-history";

const QUOTATIONS: readonly HistoricalQuotationSummary[] = Object.freeze([
  Object.freeze({
    id: "11111111-1111-4111-8111-111111111111",
    quotationNumber: "DR-2026-0002",
    status: "sent",
    quotationDate: "2026-09-24",
    validityDays: 15,
    customerName: "Empresa Reciente SAS",
    totalCop: 616_700,
    createdAt: "2026-09-24T14:30:00.000Z",
  }),
  Object.freeze({
    id: "22222222-2222-4222-8222-222222222222",
    quotationNumber: "DR-2026-0001",
    status: "accepted",
    quotationDate: "2026-09-23",
    validityDays: 15,
    customerName: null,
    totalCop: 50_000,
    createdAt: "2026-09-23T14:30:00.000Z",
  }),
]);

const LIVE_QA_QUOTATION: HistoricalQuotation = Object.freeze({
  id: "c196bfef-7fa7-4d9a-8b82-4beeee8f7628",
  quotationNumber: "DR-2026-0003",
  status: "sent",
  quotationDate: "2026-09-24",
  validityDays: 15,
  customerName: "Empresa Ejemplo SAS",
  customerDocument: "12057478-3",
  customerPhoneCountryIso2: null,
  customerPhoneNumber: null,
  customerEmail: "cotizaciones@example.com",
  customerCity: "ficticity",
  notes: "prueba",
  totalCop: 116_000,
  lines: Object.freeze([
    Object.freeze({
      source: "custom" as const,
      title: "lamina sublimada",
      description: "lamina sublimada",
      quantity: 2,
      unitPriceCop: 58_000,
      details: Object.freeze([]) as readonly [],
      lineTotalCop: 116_000,
    }),
  ]),
  createdAt: "2026-09-24T17:07:53.178992+00:00",
  createdBy: "9a5b3d2c-9ad2-4084-a32d-00029c06bb31",
});

function createRepository(
  loadResult: Awaited<ReturnType<QuotationRepository["load"]>> = {
    ok: true,
    value: LIVE_QA_QUOTATION,
  },
): QuotationRepository {
  return {
    save: vi.fn(),
    list: vi.fn(async () => ({
      ok: true as const,
      value: Object.freeze([
        Object.freeze({
          id: LIVE_QA_QUOTATION.id,
          quotationNumber: LIVE_QA_QUOTATION.quotationNumber,
          status: LIVE_QA_QUOTATION.status,
          quotationDate: LIVE_QA_QUOTATION.quotationDate,
          validityDays: LIVE_QA_QUOTATION.validityDays,
          customerName: LIVE_QA_QUOTATION.customerName,
          totalCop: LIVE_QA_QUOTATION.totalCop,
          createdAt: LIVE_QA_QUOTATION.createdAt,
        }),
      ]),
    })),
    load: vi.fn(async () => loadResult),
    changeStatus: vi.fn(async (_quotationId, status) => ({ ok: true as const, value: status })),
  };
}

async function waitFor(assertion: () => void): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      if (attempt === 19) {
        throw error;
      }
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);

  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) {
      return;
    }

    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(async () => {
  if (root !== null) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  document.body.style.overflow = "";
  root = null;
  container = null;
  vi.restoreAllMocks();
});

describe("QuotationHistoryList", () => {
  it("renders stored order, identifying fields, totals and open actions", () => {
    const markup = renderToStaticMarkup(
      <QuotationHistoryList
        quotations={QUOTATIONS}
        openingQuotationId={null}
        changingQuotationId={null}
        onChangeStatus={() => undefined}
        onOpen={() => undefined}
      />,
    );

    expect(markup.indexOf("Empresa Reciente SAS")).toBeLessThan(
      markup.indexOf("Cotización sin nombre de cliente"),
    );
    expect(markup).toContain("Fecha de cotización: 24/09/2026");
    expect(markup).toContain("DR-2026-0002");
    expect(markup).toContain("Estado: Aceptada");
    expect(markup).toContain("Cambiar estado de DR-2026-0002");
    expect(markup).toContain("COP 616.700");
    expect(markup.match(/Ver cotización/g)).toHaveLength(2);
  });

  it("renders an empty historical state", () => {
    const markup = renderToStaticMarkup(
      <QuotationHistoryList
        quotations={[]}
        openingQuotationId={null}
        changingQuotationId={null}
        onChangeStatus={() => undefined}
        onOpen={() => undefined}
      />,
    );

    expect(markup).toContain("Aún no hay cotizaciones guardadas.");
  });

  it("shows expiration only for sent quotations in the rendered history", () => {
    const old = QUOTATIONS.map((quotation, index) => ({
      ...quotation,
      quotationDate: "2020-01-01",
      status: (index === 0 ? "sent" : "rejected") as "sent" | "rejected",
    }));
    const markup = renderToStaticMarkup(
      <QuotationHistoryList
        quotations={old}
        openingQuotationId={null}
        changingQuotationId={null}
        onChangeStatus={() => undefined}
        onOpen={() => undefined}
      />,
    );
    expect(markup).toContain("Estado: Vencida");
    expect(markup).toContain("Estado: Rechazada");
    expect(markup.match(/Vencida/g)).toHaveLength(1);
  });
});

describe("QuotationHistory", () => {
  it("opens a complete historical quotation from the saved list", async () => {
    const repository = createRepository();
    root = createRoot(container!);

    await act(async () => {
      root?.render(
        <StrictMode>
          <QuotationHistory refreshRevision={0} repository={repository} />
        </StrictMode>,
      );
    });

    await waitFor(() => {
      expect(container?.textContent).toContain("Empresa Ejemplo SAS");
      expect(container?.textContent).toContain("Ver cotización");
    });

    const openButton = Array.from(
      container!.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "Ver cotización");
    expect(openButton).toBeDefined();

    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      expect(repository.load).toHaveBeenCalledWith(LIVE_QA_QUOTATION.id);
      expect(container?.querySelector('[role="dialog"]')).not.toBeNull();
    });

    const dialog = container!.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Empresa Ejemplo SAS");
    expect(dialog?.textContent).toContain("Cotización DR-2026-0003");
    expect(dialog?.textContent).toContain("lamina sublimada");
    expect(dialog?.textContent).toContain("COP 58.000");
    expect(dialog?.textContent).toContain("COP 116.000");
    expect(dialog?.textContent).toContain("prueba");
    expect(dialog?.textContent).toContain("Vigencia");
    expect(dialog?.textContent).toContain("15 días");
    expect(dialog?.textContent).toContain("Descargar PDF");

    const closeButton = container!.querySelector<HTMLButtonElement>('button[aria-label="Cerrar vista previa de la cotización"]');
    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container?.querySelector('[role="dialog"]')).toBeNull();

    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await waitFor(() => {
      expect(container?.querySelector('[role="dialog"]')?.textContent).toContain("Cotización DR-2026-0003");
    });
  });

  it("changes status without replacing the commercial snapshot", async () => {
    const repository = createRepository();
    root = createRoot(container!);
    await act(async () => {
      root?.render(<StrictMode><QuotationHistory refreshRevision={0} repository={repository} /></StrictMode>);
    });
    await waitFor(() => expect(container?.querySelector("select")).not.toBeNull());

    const select = container!.querySelector<HTMLSelectElement>("select")!;
    await act(async () => {
      select.value = "accepted";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitFor(() => {
      expect(repository.changeStatus).toHaveBeenCalledWith(LIVE_QA_QUOTATION.id, "accepted");
      expect(container?.textContent).toContain("Estado: Aceptada");
    });
    expect(container?.textContent).toContain("Empresa Ejemplo SAS");
    expect(container?.textContent).toContain("COP 116.000");
    expect(container?.textContent).toContain("DR-2026-0003");
  });

  it("shows a safe message and preserves the displayed status when status RPC fails", async () => {
    const repository = createRepository();
    vi.mocked(repository.changeStatus).mockResolvedValue({
      ok: false,
      kind: "status",
      message: "No pudimos cambiar el estado de la cotización. Inténtalo de nuevo.",
    });
    root = createRoot(container!);
    await act(async () => {
      root?.render(<StrictMode><QuotationHistory refreshRevision={0} repository={repository} /></StrictMode>);
    });
    await waitFor(() => expect(container?.querySelector("select")).not.toBeNull());

    const select = container!.querySelector<HTMLSelectElement>("select")!;
    await act(async () => {
      select.value = "rejected";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitFor(() => {
      expect(container?.querySelector('[role="alert"]')?.textContent).toContain("No pudimos cambiar el estado");
    });
    expect(select.value).toBe("sent");
  });

  it("shows the safe Spanish error when the historical load fails", async () => {
    const repository = createRepository({
      ok: false,
      kind: "load",
      message: QUOTATION_OPEN_FAILURE_MESSAGE,
    });
    root = createRoot(container!);

    await act(async () => {
      root?.render(
        <StrictMode>
          <QuotationHistory refreshRevision={0} repository={repository} />
        </StrictMode>,
      );
    });
    await waitFor(() => {
      expect(container?.textContent).toContain("Ver cotización");
    });

    const openButton = Array.from(
      container!.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "Ver cotización");

    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      expect(repository.load).toHaveBeenCalledWith(LIVE_QA_QUOTATION.id);
      expect(container?.querySelector('[role="alert"]')?.textContent).toBe(
        QUOTATION_OPEN_FAILURE_MESSAGE,
      );
    });
    expect(container?.querySelector('[role="dialog"]')).toBeNull();
  });

  it("fails safely if preview creation throws after a successful load", async () => {
    const repository = createRepository({
      ok: true,
      value: {
        ...LIVE_QA_QUOTATION,
        customerPhoneCountryIso2: "ZZ",
        customerPhoneNumber: "3000000000",
      } as unknown as HistoricalQuotation,
    });
    root = createRoot(container!);

    await act(async () => {
      root?.render(
        <StrictMode>
          <QuotationHistory refreshRevision={0} repository={repository} />
        </StrictMode>,
      );
    });
    await waitFor(() => {
      expect(container?.textContent).toContain("Ver cotización");
    });

    const openButton = Array.from(
      container!.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "Ver cotización");

    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      expect(container?.querySelector('[role="alert"]')?.textContent).toBe(
        QUOTATION_OPEN_FAILURE_MESSAGE,
      );
    });
    expect(container?.querySelector('[role="dialog"]')).toBeNull();
  });
});
