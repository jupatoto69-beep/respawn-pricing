import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { DIGITAL_RESPAWN_BUSINESS_PROFILE } from "./business-profile";
import {
  fitProportionally,
  isLocalBrandAssetPath,
  loadLocalQuotationPdfLogo,
  readPngDimensions,
} from "./quotation-pdf-logo";

async function readBrandAsset(filename: string): Promise<Uint8Array> {
  const path = fileURLToPath(
    new URL(`../../../public/brand/${filename}`, import.meta.url),
  );
  return new Uint8Array(await readFile(path));
}

describe("Digital Respawn business profile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is immutable and configures explicit local contrast-aware logo paths", () => {
    expect(Object.isFrozen(DIGITAL_RESPAWN_BUSINESS_PROFILE)).toBe(true);
    expect(DIGITAL_RESPAWN_BUSINESS_PROFILE).toEqual({
      businessName: "Digital Respawn",
      logoOnDarkPath: "/brand/digital-respawn-logo-white.png",
      logoOnLightPath: "/brand/digital-respawn-logo-black.png",
    });
    expect(
      isLocalBrandAssetPath(
        DIGITAL_RESPAWN_BUSINESS_PROFILE.logoOnDarkPath,
      ),
    ).toBe(true);
    expect(
      isLocalBrandAssetPath(
        DIGITAL_RESPAWN_BUSINESS_PROFILE.logoOnLightPath,
      ),
    ).toBe(true);
  });

  it.each([
    "https://example.com/logo.png",
    "//example.com/logo.png",
    "/other/logo.png",
    "/brand/logo.png?customer=example",
    "/brand\\logo.png",
  ])("rejects non-local or non-brand paths: %s", (path) => {
    expect(isLocalBrandAssetPath(path)).toBe(false);
  });

  it("confirms both official files are horizontal PNGs with matching proportions", async () => {
    const [white, black] = await Promise.all([
      readBrandAsset("digital-respawn-logo-white.png"),
      readBrandAsset("digital-respawn-logo-black.png"),
    ]);
    const whiteDimensions = readPngDimensions(white);
    const blackDimensions = readPngDimensions(black);

    expect(whiteDimensions.width).toBeGreaterThan(whiteDimensions.height);
    expect(blackDimensions.width).toBeGreaterThan(blackDimensions.height);
    expect(whiteDimensions.width / whiteDimensions.height).toBeCloseTo(
      blackDimensions.width / blackDimensions.height,
      5,
    );
  });

  it("fits the logo within both maximums without changing its aspect ratio", () => {
    const fitted = fitProportionally(
      { width: 2327, height: 703 },
      { width: 58, height: 18 },
    );

    expect(fitted.width).toBeLessThanOrEqual(58);
    expect(fitted.height).toBeLessThanOrEqual(18);
    expect(fitted.width / fitted.height).toBeCloseTo(2327 / 703, 10);
    expect(fitted.width).not.toBe(fitted.height);
    expect(Object.isFrozen(fitted)).toBe(true);
  });

  it("loads only a configured local PNG and preserves its intrinsic dimensions", async () => {
    const bytes = await readBrandAsset("digital-respawn-logo-black.png");
    const fetchMock = vi.fn(async () =>
      new Response(Uint8Array.from(bytes).buffer, {
        status: 200,
        headers: { "Content-Type": "image/png" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const logo = await loadLocalQuotationPdfLogo(
      "/brand/digital-respawn-logo-black.png",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/brand/digital-respawn-logo-black.png",
      { cache: "force-cache", credentials: "same-origin" },
    );
    expect(logo.format).toBe("PNG");
    expect(logo.width).toBeGreaterThan(logo.height);
    expect(logo.bytes).toEqual(bytes);
  });

  it("rejects an external path before making any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loadLocalQuotationPdfLogo("https://example.com/logo.png"),
    ).rejects.toThrow("local brand assets");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
