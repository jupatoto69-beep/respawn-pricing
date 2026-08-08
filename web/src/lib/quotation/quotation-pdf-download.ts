export type BrowserDownloadAnchor = {
  href: string;
  download: string;
  click: () => void;
  remove: () => void;
};

export type BrowserPdfDownloadPort = Readonly<{
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  createAnchor: () => BrowserDownloadAnchor;
  appendAnchor: (anchor: BrowserDownloadAnchor) => void;
  waitForDownloadStart: () => Promise<void>;
}>;

function createBrowserPdfDownloadPort(): BrowserPdfDownloadPort {
  return {
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
    createAnchor: () => document.createElement("a"),
    appendAnchor: (anchor) => document.body.append(anchor as HTMLAnchorElement),
    waitForDownloadStart: () =>
      new Promise((resolve) => {
        window.setTimeout(resolve, 100);
      }),
  };
}

export async function downloadPdfBlob(
  blob: Blob,
  filename: string,
  port: BrowserPdfDownloadPort = createBrowserPdfDownloadPort(),
): Promise<void> {
  let objectUrl: string | null = null;
  let anchor: BrowserDownloadAnchor | null = null;

  try {
    objectUrl = port.createObjectUrl(blob);
    anchor = port.createAnchor();
    anchor.href = objectUrl;
    anchor.download = filename;
    port.appendAnchor(anchor);
    anchor.click();
    await port.waitForDownloadStart();
  } finally {
    anchor?.remove();

    if (objectUrl !== null) {
      port.revokeObjectUrl(objectUrl);
    }
  }
}
