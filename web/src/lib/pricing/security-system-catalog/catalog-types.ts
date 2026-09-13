export type PublishedSalePrice = Readonly<{
  pricingStatus: "priced";
  salePriceCop: number;
}>;

export type ManualSalePrice = Readonly<{
  pricingStatus: "manual-confirmation";
  salePriceCop: null;
}>;

export type CatalogPrice = PublishedSalePrice | ManualSalePrice;

export type CameraBrand = "Dahua" | "Hikvision" | "HiLook";
export type CameraFormat =
  | "Domo"
  | "Bala"
  | "Turret"
  | "Mini bala"
  | "Ojo de pez"
  | "Cubo"
  | "Dual PT"
  | "PT";

export type Camera = Readonly<{
  id: string;
  brand: CameraBrand;
  reference: string;
  format: CameraFormat;
  description: string;
  withAccessoriesSalePriceCop: number;
}> &
  PublishedSalePrice &
  (
    | Readonly<{
        systemType: "analog";
        resolutionGroup: "2-mp" | "3k-5-mp" | "8-mp-4k";
      }>
    | Readonly<{
        systemType: "ip";
        resolutionGroup: "2-mp" | "4-mp" | "5-8-mp";
      }>
    | Readonly<{
        systemType: "wifi";
        resolutionGroup:
          | "2-mp"
          | "3-mp-2k"
          | "3-mp"
          | "4-mp"
          | "5-mp"
          | "6-mp-combined"
          | "10-mp-combined";
      }>
  );

export type Recorder = Readonly<{
  id: string;
  brand: CameraBrand;
  reference: string;
  channels: 4 | 8 | 16 | 32;
  description: string;
}> &
  PublishedSalePrice &
  (
    | Readonly<{ recorderType: "dvr-xvr"; systemType: "analog" }>
    | Readonly<{ recorderType: "nvr"; systemType: "ip"; poePorts: number }>
  );

export type HardDrive = Readonly<{
  id: string;
  line: "Western Purple" | "Western Black" | "Pull";
  reference: string;
  capacity: number;
  capacityUnit: "GB" | "TB";
  conditionAndWarranty: string;
}> &
  CatalogPrice;

export type PoeSwitch = Readonly<{
  id: string;
  brand: "Hikvision" | "Witek";
  reference: string;
  poePorts: number;
  description: string;
}> &
  PublishedSalePrice;

export type PowerSupply = Readonly<{
  id: string;
  reference: string;
  amperes: number;
  outputs: number;
  description: string;
}> &
  PublishedSalePrice;

export type ExteriorCable = Readonly<{
  id: string;
  reference: string;
  category: "cat-5e" | "cat-6";
  presentationLengthMeters: 100 | 305;
  construction: string;
}> &
  PublishedSalePrice;

export type Accessory = Readonly<{
  id: string;
  reference: string;
  name: string;
}> &
  PublishedSalePrice;

// Catalog inputs are literal readonly data; freeze nested compositions as well.
export function freezeCatalog<const T extends readonly object[]>(
  entries: T,
): T {
  function freeze(value: object): void {
    for (const child of Object.values(value)) {
      if (child !== null && typeof child === "object") freeze(child);
    }
    Object.freeze(value);
  }
  freeze(entries);
  return entries;
}

export function hasPublishedSalePrice<T extends CatalogPrice>(
  entry: T,
): entry is T & PublishedSalePrice {
  return (
    entry.pricingStatus === "priced" &&
    Number.isSafeInteger(entry.salePriceCop) &&
    entry.salePriceCop > 0
  );
}
