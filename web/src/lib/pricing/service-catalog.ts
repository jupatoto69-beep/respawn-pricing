import {
  COMPUTER_SERVICE_CATEGORY,
  COMPUTER_SERVICE_CATALOG,
  type ComputerService,
  type ComputerServiceId,
} from "./computer-service-catalog";

export const SERVICE_CATEGORY_IDS = {
  computers: COMPUTER_SERVICE_CATEGORY.id,
  audiovisual: "audiovisual",
} as const;

export type ServiceCategoryId =
  (typeof SERVICE_CATEGORY_IDS)[keyof typeof SERVICE_CATEGORY_IDS];

export const AUDIOVISUAL_SERVICE_IDS = {
  simpleVideoEditing: "simple-video-editing",
} as const;

export type AudiovisualServiceId =
  (typeof AUDIOVISUAL_SERVICE_IDS)[keyof typeof AUDIOVISUAL_SERVICE_IDS];

export type VideoEditingService = Readonly<{
  id: typeof AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing;
  name: "Edición de video sencilla";
  description: string;
  pricingStrategy: "duration";
}>;

export type Service = ComputerService | VideoEditingService;
export type ServiceId = ComputerServiceId | AudiovisualServiceId;

export type ServiceCategory = Readonly<{
  id: ServiceCategoryId;
  name: string;
  services: readonly Service[];
}>;

export const SIMPLE_VIDEO_EDITING_SERVICE: VideoEditingService = {
  id: AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing,
  name: "Edición de video sencilla",
  description:
    "Edición sencilla cobrada según la duración real del video terminado.",
  pricingStrategy: "duration",
};

export const SERVICE_CATEGORY_CATALOG: readonly ServiceCategory[] = [
  {
    id: SERVICE_CATEGORY_IDS.computers,
    name: COMPUTER_SERVICE_CATEGORY.name,
    services: COMPUTER_SERVICE_CATALOG,
  },
  {
    id: SERVICE_CATEGORY_IDS.audiovisual,
    name: "Audiovisual",
    services: [SIMPLE_VIDEO_EDITING_SERVICE],
  },
] as const;

export function isServiceCategoryId(
  value: string,
): value is ServiceCategoryId {
  return SERVICE_CATEGORY_CATALOG.some((category) => category.id === value);
}

export function getServiceCategory(
  categoryId: string,
): ServiceCategory | null {
  return (
    SERVICE_CATEGORY_CATALOG.find((category) => category.id === categoryId) ??
    null
  );
}

export function getServicesForCategory(
  categoryId: string,
): readonly Service[] {
  return getServiceCategory(categoryId)?.services ?? [];
}

export function isServiceIdForCategory(
  categoryId: string,
  serviceId: string,
): serviceId is ServiceId {
  return getServicesForCategory(categoryId).some(
    (service) => service.id === serviceId,
  );
}

export function getService(
  categoryId: string,
  serviceId: string,
): Service | null {
  return (
    getServicesForCategory(categoryId).find(
      (service) => service.id === serviceId,
    ) ?? null
  );
}
