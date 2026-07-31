export type AreaProductVariant = Readonly<{
  id: string;
  name: string;
  ratePerSquareMeter: number;
}>;

export type AreaProduct = Readonly<{
  id: string;
  name: string;
  variants: readonly AreaProductVariant[];
}>;

export const AREA_PRODUCT_CATALOG: readonly AreaProduct[] = [
  {
    id: "printed-vinyl",
    name: "Vinilo impreso",
    variants: [
      {
        id: "standard-without-lamination",
        name: "Estándar sin laminado",
        ratePerSquareMeter: 80_000,
      },
      {
        id: "standard-lamination",
        name: "Laminado estándar",
        ratePerSquareMeter: 85_000,
      },
      {
        id: "floorgraphic-lamination",
        name: "Laminado floorgraphic",
        ratePerSquareMeter: 95_000,
      },
    ],
  },
  {
    id: "cut-vinyl",
    name: "Vinilo de corte",
    variants: [
      {
        id: "standard",
        name: "Estándar",
        ratePerSquareMeter: 80_000,
      },
    ],
  },
  {
    id: "banner",
    name: "Banner",
    variants: [
      {
        id: "standard-without-lamination",
        name: "Estándar sin laminado",
        ratePerSquareMeter: 80_000,
      },
      {
        id: "laminated",
        name: "Laminado",
        ratePerSquareMeter: 85_000,
      },
    ],
  },
  {
    id: "panaflex",
    name: "Panaflex",
    variants: [
      {
        id: "standard-material",
        name: "Material estándar",
        ratePerSquareMeter: 85_000,
      },
    ],
  },
] as const;

