import { describe, expect, it, vi } from "vitest";

import {
  downloadPdfBlob,
  type BrowserDownloadAnchor,
  type BrowserPdfDownloadPort,
} from "./quotation-pdf-download";

function createPort(options: Readonly<{ failClick?: boolean }> = {}) {
  const anchors: BrowserDownloadAnchor[] = [];
  const activeUrls = new Set<string>();
  const click = options.failClick
    ? vi.fn(() => {
        throw new Error("fictional click failure");
      })
    : vi.fn();
  const remove = vi.fn();
  const createObjectUrl = vi.fn(() => {
    const url = `blob:quotation-${activeUrls.size + 1}`;
    activeUrls.add(url);
    return url;
  });
  const revokeObjectUrl = vi.fn((url: string) => {
    activeUrls.delete(url);
  });
  const appendAnchor = vi.fn();
  const waitForDownloadStart = vi.fn(async () => undefined);
  const port: BrowserPdfDownloadPort = {
    createObjectUrl,
    revokeObjectUrl,
    createAnchor: vi.fn(() => {
      const anchor = { href: "", download: "", click, remove };
      anchors.push(anchor);
      return anchor;
    }),
    appendAnchor,
    waitForDownloadStart,
  };

  return {
    port,
    anchors,
    activeUrls,
    click,
    remove,
    createObjectUrl,
    revokeObjectUrl,
    appendAnchor,
  };
}

describe("browser PDF download boundary", () => {
  it("downloads the correct Blob and filename and cleans every temporary resource", async () => {
    const blob = new Blob(["%PDF-fictional"], { type: "application/pdf" });
    const fixture = createPort();

    await downloadPdfBlob(
      blob,
      "cotizacion-empresa-ejemplo-sas.pdf",
      fixture.port,
    );

    expect(fixture.createObjectUrl).toHaveBeenCalledWith(blob);
    expect(fixture.anchors).toHaveLength(1);
    expect(fixture.anchors[0].href).toBe("blob:quotation-1");
    expect(fixture.anchors[0].download).toBe(
      "cotizacion-empresa-ejemplo-sas.pdf",
    );
    expect(fixture.appendAnchor).toHaveBeenCalledWith(fixture.anchors[0]);
    expect(fixture.click).toHaveBeenCalledOnce();
    expect(fixture.remove).toHaveBeenCalledOnce();
    expect(fixture.revokeObjectUrl).toHaveBeenCalledWith("blob:quotation-1");
    expect(fixture.activeUrls.size).toBe(0);
  });

  it("cleans the anchor and object URL when activation throws", async () => {
    const fixture = createPort({ failClick: true });

    await expect(
      downloadPdfBlob(
        new Blob(["%PDF-fictional"], { type: "application/pdf" }),
        "cotizacion-digital-respawn.pdf",
        fixture.port,
      ),
    ).rejects.toThrow("fictional click failure");
    expect(fixture.remove).toHaveBeenCalledOnce();
    expect(fixture.revokeObjectUrl).toHaveBeenCalledOnce();
    expect(fixture.activeUrls.size).toBe(0);
  });

  it("allows a second download without retaining an anchor or active URL", async () => {
    const fixture = createPort();
    const blob = new Blob(["%PDF-fictional"], { type: "application/pdf" });

    await downloadPdfBlob(blob, "cotizacion-uno.pdf", fixture.port);
    await downloadPdfBlob(blob, "cotizacion-dos.pdf", fixture.port);

    expect(fixture.click).toHaveBeenCalledTimes(2);
    expect(fixture.remove).toHaveBeenCalledTimes(2);
    expect(fixture.revokeObjectUrl).toHaveBeenCalledTimes(2);
    expect(fixture.activeUrls.size).toBe(0);
  });
});
