export type QuotationPdfLogo = Readonly<{
  bytes: Uint8Array;
  format: "PNG";
  width: number;
  height: number;
}>;

export type QuotationPdfLogoLoader = (
  localPath: string,
) => Promise<QuotationPdfLogo>;

export type ProportionalSize = Readonly<{
  width: number;
  height: number;
}>;

const PNG_SIGNATURE = Object.freeze([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    bytes[offset + 1] * 0x10000 +
    bytes[offset + 2] * 0x100 +
    bytes[offset + 3]
  );
}

export function isLocalBrandAssetPath(path: string): boolean {
  return (
    path.startsWith("/brand/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !path.includes("?") &&
    !path.includes("#")
  );
}

export function readPngDimensions(bytes: Uint8Array): ProportionalSize {
  if (
    bytes.length < 24 ||
    PNG_SIGNATURE.some((value, index) => bytes[index] !== value) ||
    String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR"
  ) {
    throw new TypeError("The configured brand asset is not a valid PNG image.");
  }

  const width = readUint32BigEndian(bytes, 16);
  const height = readUint32BigEndian(bytes, 20);

  if (width <= 0 || height <= 0) {
    throw new RangeError("The configured brand asset has invalid dimensions.");
  }

  return Object.freeze({ width, height });
}

export function fitProportionally(
  intrinsic: ProportionalSize,
  maximum: ProportionalSize,
): ProportionalSize {
  if (
    intrinsic.width <= 0 ||
    intrinsic.height <= 0 ||
    maximum.width <= 0 ||
    maximum.height <= 0
  ) {
    throw new RangeError("Logo dimensions must be positive.");
  }

  const scale = Math.min(
    maximum.width / intrinsic.width,
    maximum.height / intrinsic.height,
    1,
  );

  return Object.freeze({
    width: intrinsic.width * scale,
    height: intrinsic.height * scale,
  });
}

export const loadLocalQuotationPdfLogo: QuotationPdfLogoLoader = async (
  localPath,
) => {
  if (!isLocalBrandAssetPath(localPath)) {
    throw new TypeError("Only configured local brand assets can be loaded.");
  }

  const response = await fetch(localPath, {
    cache: "force-cache",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("The configured brand asset could not be loaded.");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const dimensions = readPngDimensions(bytes);

  return Object.freeze({
    bytes,
    format: "PNG",
    width: dimensions.width,
    height: dimensions.height,
  });
};
