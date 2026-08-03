import { SOFTWARE_INSTALLATION_PRICING_TIERS } from "./calculate-software-installation-price";

export const COMPUTER_SERVICE_CATEGORY = {
  id: "computers",
  name: "Computadores",
} as const;

export const COMPUTER_SERVICE_IDS = {
  maintenance: "computer-maintenance",
  officeInstallation: "office-installation",
  softwareInstallation: "individual-software-installation",
  hardDriveDataRecovery: "hard-drive-data-recovery",
  passwordProtectedSystemAccess: "password-protected-system-access",
} as const;

export type ComputerServiceId =
  (typeof COMPUTER_SERVICE_IDS)[keyof typeof COMPUTER_SERVICE_IDS];

export type FixedPriceComputerServiceId =
  | typeof COMPUTER_SERVICE_IDS.officeInstallation
  | typeof COMPUTER_SERVICE_IDS.hardDriveDataRecovery
  | typeof COMPUTER_SERVICE_IDS.passwordProtectedSystemAccess;

export type ServiceUnit = Readonly<{
  singular: "computador" | "disco" | "programa";
  plural: "computadores" | "discos" | "programas";
}>;

type ComputerServiceBase = Readonly<{
  id: ComputerServiceId;
  name: string;
  description: string;
  unit: ServiceUnit;
}>;

export type MaintenanceComputerService = ComputerServiceBase &
  Readonly<{
    id: typeof COMPUTER_SERVICE_IDS.maintenance;
    pricingStrategy: "maintenance-selection";
  }>;

export type FixedPriceComputerService = ComputerServiceBase &
  Readonly<{
    id: FixedPriceComputerServiceId;
    pricingStrategy: "fixed-price";
    unitPrice: number;
  }>;

export type QuantityTierComputerService = ComputerServiceBase &
  Readonly<{
    id: typeof COMPUTER_SERVICE_IDS.softwareInstallation;
    pricingStrategy: "quantity-tier";
    computerScope: Readonly<{
      id: "one-computer";
      name: "Un computador";
    }>;
    pricingTiers: typeof SOFTWARE_INSTALLATION_PRICING_TIERS;
  }>;

export type ComputerService =
  | MaintenanceComputerService
  | FixedPriceComputerService
  | QuantityTierComputerService;

const COMPUTER_UNIT: ServiceUnit = {
  singular: "computador",
  plural: "computadores",
};

const DRIVE_UNIT: ServiceUnit = {
  singular: "disco",
  plural: "discos",
};

const PROGRAM_UNIT: ServiceUnit = {
  singular: "programa",
  plural: "programas",
};

export const COMPUTER_SERVICE_CATALOG: readonly ComputerService[] = [
  {
    id: COMPUTER_SERVICE_IDS.maintenance,
    name: "Mantenimiento de computador",
    description:
      "Selecciona mantenimiento físico, mantenimiento de sistema o el paquete completo.",
    unit: COMPUTER_UNIT,
    pricingStrategy: "maintenance-selection",
  },
  {
    id: COMPUTER_SERVICE_IDS.officeInstallation,
    name: "Instalación de Office únicamente",
    description: "Instalación de Office en el computador seleccionado.",
    unit: COMPUTER_UNIT,
    pricingStrategy: "fixed-price",
    unitPrice: 50_000,
  },
  {
    id: COMPUTER_SERVICE_IDS.softwareInstallation,
    name: "Instalación individual de programas",
    description:
      "Este cálculo corresponde a la instalación de programas en un solo computador",
    unit: PROGRAM_UNIT,
    pricingStrategy: "quantity-tier",
    computerScope: {
      id: "one-computer",
      name: "Un computador",
    },
    pricingTiers: SOFTWARE_INSTALLATION_PRICING_TIERS,
  },
  {
    id: COMPUTER_SERVICE_IDS.hardDriveDataRecovery,
    name: "Recuperación de información de disco duro",
    description: "Recuperación de información por disco duro.",
    unit: DRIVE_UNIT,
    pricingStrategy: "fixed-price",
    unitPrice: 70_000,
  },
  {
    id: COMPUTER_SERVICE_IDS.passwordProtectedSystemAccess,
    name: "Acceso a sistema protegido por contraseña perdida",
    description:
      "Aplica cuando se necesita acceder al sistema porque la contraseña fue perdida.",
    unit: COMPUTER_UNIT,
    pricingStrategy: "fixed-price",
    unitPrice: 90_000,
  },
] as const;

export const MAINTENANCE_OPTION_IDS = {
  physical: "physical-maintenance",
  system: "system-maintenance",
} as const;

export type MaintenanceOptionId =
  (typeof MAINTENANCE_OPTION_IDS)[keyof typeof MAINTENANCE_OPTION_IDS];

export type MaintenanceOption = Readonly<{
  id: MaintenanceOptionId;
  name: string;
}>;

export const MAINTENANCE_OPTIONS: readonly MaintenanceOption[] = [
  {
    id: MAINTENANCE_OPTION_IDS.physical,
    name: "Mantenimiento físico",
  },
  {
    id: MAINTENANCE_OPTION_IDS.system,
    name: "Mantenimiento de sistema",
  },
] as const;

export const SYSTEM_MAINTENANCE_INCLUSIONS = [
  "Formateo del sistema",
  "Instalación de Office",
] as const;

export function isComputerServiceId(value: string): value is ComputerServiceId {
  return COMPUTER_SERVICE_CATALOG.some((service) => service.id === value);
}

export function getComputerService(
  serviceId: string,
): ComputerService | null {
  return (
    COMPUTER_SERVICE_CATALOG.find((service) => service.id === serviceId) ??
    null
  );
}

export function getFixedPriceComputerService(
  serviceId: FixedPriceComputerServiceId,
): FixedPriceComputerService {
  const service = getComputerService(serviceId);

  if (service?.pricingStrategy !== "fixed-price") {
    throw new RangeError("Fixed-price computer service must be valid.");
  }

  return service;
}
