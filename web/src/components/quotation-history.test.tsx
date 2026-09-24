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
    quotationDate: "2026-09-24",
    customerName: "Empresa Reciente SAS",
    totalCop: 616_700,
    createdAt: "2026-09-24T14:30:00.000Z",
  }),
  Object.freeze({
    id: "22222222-2222-4222-8222-222222222222",
    quotationDate: "2026-09-23",
    customerName: null,
    totalCop: 50_000,
    createdAt: "2026-09-23T14:30:00.000Z",
  }),
]);

const LIVE_QA_QUOTATION: HistoricalQuotation = Object.freeze({
  id: "c196bfef-7fa7-4d9a-8b82-4beeee8f7628",
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
          quotationDate: LIVE_QA_QUOTATION.quotationDate,
          customerName: LIVE_QA_QUOTATION.customerName,
          totalCop: LIVE_QA_QUOTATION.totalCop,
          createdAt: LIVE_QA_QUOTATION.createdAt,
        }),
      ]),
    })),
    load: vi.fn(async () => loadResult),
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
        onOpen={() => undefined}
      />,
    );

    expect(markup.indexOf("Empresa Reciente SAS")).toBeLessThan(
      markup.indexOf("Cotización sin nombre de cliente"),
    );
    expect(markup).toContain("Fecha de cotización: 24/09/2026");
    expect(markup).toContain("COP 616.700");
    expect(markup.match(/Ver cotización/g)).toHaveLength(2);
  });

  it("renders an empty historical state", () => {
    const markup = renderToStaticMarkup(
      <QuotationHistoryList
        quotations={[]}
        openingQuotationId={null}
        onOpen={() => undefined}
      />,
    );

    expect(markup).toContain("Aún no hay cotizaciones guardadas.");
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
    expect(dialog?.textContent).toContain("lamina sublimada");
    expect(dialog?.textContent).toContain("COP 58.000");
    expect(dialog?.textContent).toContain("COP 116.000");
    expect(dialog?.textContent).toContain("prueba");
    expect(dialog?.textContent).toContain("Vigencia");
    expect(dialog?.textContent).toContain("15 días");
    expect(dialog?.textContent).toContain("Descargar PDF");
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
