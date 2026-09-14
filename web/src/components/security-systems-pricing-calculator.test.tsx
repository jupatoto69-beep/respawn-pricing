import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  addSecuritySystemCameraGroup,
  changeSecuritySystemCameraBrand,
  changeSecuritySystemCameraGroupEnvironment,
  changeSecuritySystemCameraGroupFormat,
  changeSecuritySystemCameraGroupModel,
  changeSecuritySystemCameraGroupQuantity,
  changeSecuritySystemCameraResolution,
  changeSecuritySystemRecorder,
  changeSecuritySystemTotalCameraQuantity,
  createInitialSecuritySystemCatalogSelection,
  type CameraEnvironment,
  type CameraResolutionGroup,
  type SecuritySystemCatalogSelection,
} from "@/lib/pricing/security-system-catalog-selection";
import type {
  CameraBrand,
  CameraFormat,
} from "@/lib/pricing/security-system-catalog/catalog-types";
import { ACCESSORY_CATALOG } from "@/lib/pricing/security-system-catalog/accessory-catalog";
import { POE_SWITCH_CATALOG } from "@/lib/pricing/security-system-catalog/poe-switch-catalog";
import { POWER_SUPPLY_CATALOG } from "@/lib/pricing/security-system-catalog/power-supply-catalog";
import type { SecuritySystemTypeId } from "@/lib/pricing/security-system-options";
import {
  SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS,
  SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS,
} from "@/lib/pricing/security-system-options";

import { SecuritySystemsPricingCalculator } from "./security-systems-pricing-calculator";

function createSelection({
  systemTypeId,
  totalCameraQuantity,
  brand,
  resolutionGroup,
  groups,
  recorderId,
}: Readonly<{
  systemTypeId: SecuritySystemTypeId;
  totalCameraQuantity: string;
  brand: CameraBrand;
  resolutionGroup: CameraResolutionGroup;
  groups: readonly Readonly<{
    id: string;
    environment: CameraEnvironment;
    format: CameraFormat;
    quantity: string;
    cameraId: string;
  }>[];
  recorderId?: string;
}>): SecuritySystemCatalogSelection {
  let selection = createInitialSecuritySystemCatalogSelection(systemTypeId);
  selection = changeSecuritySystemTotalCameraQuantity(
    selection,
    totalCameraQuantity,
  );
  selection = changeSecuritySystemCameraBrand(selection, brand);
  selection = changeSecuritySystemCameraResolution(selection, resolutionGroup);

  for (const group of groups) {
    selection = addSecuritySystemCameraGroup(selection, group.id);
    selection = changeSecuritySystemCameraGroupEnvironment(
      selection,
      group.id,
      group.environment,
    );
    selection = changeSecuritySystemCameraGroupFormat(
      selection,
      group.id,
      group.format,
    );
    selection = changeSecuritySystemCameraGroupQuantity(
      selection,
      group.id,
      group.quantity,
    );
    selection = changeSecuritySystemCameraGroupModel(
      selection,
      group.id,
      group.cameraId,
    );
  }

  return recorderId
    ? changeSecuritySystemRecorder(selection, recorderId)
    : selection;
}

describe("SecuritySystemsPricingCalculator", () => {
  it("starts with only the system type as a commercial choice", () => {
    const markup = renderToStaticMarkup(<SecuritySystemsPricingCalculator />);
    expect(markup).toContain("Tipo de sistema");
    expect(markup).toContain("Analógico");
    expect(markup).toContain("IP");
    expect(markup).toContain("Wi-Fi");
    expect(markup).not.toContain("Cantidad total de cámaras");
    expect(markup).not.toContain("Distribución de cámaras");
    expect(markup).not.toContain("Precio recomendado");
  });

  it("shows manual IP optional families without selecting a paid product", () => {
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialSystemTypeId="ip" />,
    );
    expect(markup).toContain("Componentes opcionales");
    expect(markup).toContain("Switches PoE");
    expect(markup).toContain("Accesorios adicionales");
    expect(markup).toContain("Ningún componente agregado.");
    expect(markup).not.toContain("data-optional-component-type");
    expect(markup).not.toContain("Fuentes centralizadas");
  });

  it("renders selected IP switch quantity, published price and subtotal", () => {
    const selectedSwitch = POE_SWITCH_CATALOG[0];
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator
        initialSystemTypeId="ip"
        initialCommercialSelection={{
          cameraGroups: {},
          hardDriveSelectionId: null,
          recorderConfigurationId: null,
          optionalComponents: [
            {
              id: "switch-row",
              componentType: "poe-switch",
              productId: selectedSwitch.id,
              quantity: "2",
            },
          ],
        }}
      />,
    );
    expect(markup).toContain('data-optional-component-type="poe-switch"');
    expect(markup).toContain(selectedSwitch.reference);
    expect(markup).toContain(selectedSwitch.description);
    expect(markup).toContain(formatExpectedCop(selectedSwitch.salePriceCop * 2));
  });

  it("renders Analog power supplies and multiple additional accessories", () => {
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator
        initialSystemTypeId="analog"
        initialCommercialSelection={{
          cameraGroups: {},
          hardDriveSelectionId: null,
          recorderConfigurationId: null,
          optionalComponents: [
            {
              id: "supply-row",
              componentType: "centralized-power-supply",
              productId: POWER_SUPPLY_CATALOG[0].id,
              quantity: "1",
            },
            {
              id: "accessory-row-1",
              componentType: "additional-accessory",
              productId: ACCESSORY_CATALOG[0].id,
              quantity: "2",
            },
            {
              id: "accessory-row-2",
              componentType: "additional-accessory",
              productId: ACCESSORY_CATALOG[1].id,
              quantity: "3",
            },
          ],
        }}
      />,
    );
    expect(markup).toContain("Fuentes centralizadas");
    expect(markup).not.toContain("Switches PoE");
    expect(markup.match(/data-optional-component-type=/g)).toHaveLength(3);
    expect(markup).toContain(POWER_SUPPLY_CATALOG[0].description);
    expect(markup).toContain(ACCESSORY_CATALOG[0].name);
    expect(markup).toContain(ACCESSORY_CATALOG[1].name);
  });

  it("shows the general fields before camera groups", () => {
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialSystemTypeId="analog" />,
    );
    expect(markup).toContain("Cantidad total de cámaras");
    expect(markup).toContain("Selecciona una marca");
    expect(markup).toContain('value="Dahua"');
    expect(markup).not.toContain("Distribución de cámaras");
  });

  it("renders an empty distribution without auto-selecting a group or model", () => {
    let selection = createInitialSecuritySystemCatalogSelection("analog");
    selection = changeSecuritySystemCameraBrand(selection, "HiLook");
    selection = changeSecuritySystemCameraResolution(selection, "2-mp");
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).toContain("Distribución de cámaras");
    expect(markup).toContain("0 de 1 cámaras asignadas");
    expect(markup).toContain("1 cámara pendiente");
    expect(markup).toContain("+ Agregar otro grupo");
    expect(markup).not.toContain("Selecciona un modelo");
  });

  it("renders two Analog formats and models together with recorder recommendation by total", () => {
    const selection = createSelection({
      systemTypeId: "analog",
      totalCameraQuantity: "4",
      brand: "HiLook",
      resolutionGroup: "2-mp",
      groups: [
        {
          id: "bullets",
          environment: "interior",
          format: "Bala",
          quantity: "2",
          cameraId: "analog-camera-thc-b120-pc-2-8mm",
        },
        {
          id: "turrets",
          environment: "interior",
          format: "Turret",
          quantity: "2",
          cameraId: "analog-camera-thc-t120-pc-2-8mm",
        },
      ],
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).toContain("4 de 4 cámaras asignadas");
    expect(markup).toContain("Distribución completa");
    expect(markup).toContain("THC-B120-PC (2.8mm)");
    expect(markup).toContain("THC-T120-PC (2.8mm)");
    expect(markup).toContain("Grabador DVR/XVR");
    expect(markup).toContain("Recomendado · DVR-104G-M1(C) · 4 canales");
  });

  it("renders Interior and Exterior groups with different compatible Wi-Fi models", () => {
    const selection = createSelection({
      systemTypeId: "wifi",
      totalCameraQuantity: "2",
      brand: "Hikvision",
      resolutionGroup: "2-mp",
      groups: [
        {
          id: "inside",
          environment: "interior",
          format: "PT",
          quantity: "1",
          cameraId: "wifi-camera-ds-2cv2q21g1-idw-w",
        },
        {
          id: "outside",
          environment: "exterior",
          format: "Bala",
          quantity: "1",
          cameraId: "wifi-camera-ds-2cv2021g2-idw-2-8mm",
        },
      ],
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).toContain("DS-2CV2Q21G1-IDW (W)");
    expect(markup).toContain("DS-2CV2021G2-IDW(2.8mm)");
    expect(markup).toContain("Interior");
    expect(markup).toContain("Exterior");
    expect(markup).toContain(
      "Para cámaras Wi-Fi no se selecciona grabador en este flujo.",
    );
    expect(markup).not.toContain("Grabador DVR/XVR");
    expect(markup).not.toContain("Grabador NVR");
  });

  it("shows only exterior formats backed by approved catalog evidence", () => {
    let selection = createInitialSecuritySystemCatalogSelection("wifi");
    selection = changeSecuritySystemCameraBrand(selection, "Hikvision");
    selection = changeSecuritySystemCameraResolution(selection, "2-mp");
    selection = addSecuritySystemCameraGroup(selection, "outside");
    selection = changeSecuritySystemCameraGroupEnvironment(
      selection,
      "outside",
      "exterior",
    );
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).toContain('value="Bala"');
    expect(markup).not.toContain('value="Cubo"');
    expect(markup).not.toContain('value="PT"');
  });

  it("marks an incomplete sum and withholds the recorder flow", () => {
    const selection = createSelection({
      systemTypeId: "ip",
      totalCameraQuantity: "6",
      brand: "Hikvision",
      resolutionGroup: "4-mp",
      groups: [
        {
          id: "group-a",
          environment: "interior",
          format: "Bala",
          quantity: "4",
          cameraId: "ip-camera-ds-2cd1043g2-liu-2-8mm",
        },
      ],
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).toContain("4 de 6 cámaras asignadas");
    expect(markup).toContain("2 cámaras pendientes");
    expect(markup).not.toContain("Grabador NVR");
  });

  it("marks a sum over the total as invalid", () => {
    const selection = createSelection({
      systemTypeId: "ip",
      totalCameraQuantity: "6",
      brand: "Hikvision",
      resolutionGroup: "4-mp",
      groups: [
        {
          id: "group-a",
          environment: "interior",
          format: "Bala",
          quantity: "7",
          cameraId: "ip-camera-ds-2cd1043g2-liu-2-8mm",
        },
      ],
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).toContain("7 de 6 cámaras asignadas");
    expect(markup).toContain("1 cámara por encima del total");
    expect(markup).not.toContain("Grabador NVR");
  });

  it("shows NVR details and a non-blocking warning for an insufficient recorder", () => {
    const selection = createSelection({
      systemTypeId: "ip",
      totalCameraQuantity: "10",
      brand: "Hikvision",
      resolutionGroup: "4-mp",
      groups: [
        {
          id: "all-cameras",
          environment: "interior",
          format: "Bala",
          quantity: "10",
          cameraId: "ip-camera-ds-2cd1043g2-liu-2-8mm",
        },
      ],
      recorderId: "nvr-ds-7104ni-q1-4p-c",
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).toContain("Grabador NVR");
    expect(markup).toContain("DS-7104NI-Q1/4P (C)");
    expect(markup).toContain("Puertos PoE");
    expect(markup).toContain("Advertencia:");
    expect(markup).toContain("4 canales para 10 cámaras");
    expect(markup).toContain("no bloquea el flujo");
  });

  it("keeps published camera information customer-safe", () => {
    const selection = createSelection({
      systemTypeId: "analog",
      totalCameraQuantity: "1",
      brand: "Dahua",
      resolutionGroup: "2-mp",
      groups: [
        {
          id: "inside",
          environment: "interior",
          format: "Domo",
          quantity: "1",
          cameraId: "analog-camera-dh-hac-t1a21n-u-028b",
        },
      ],
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).toContain("1080p; IR 25 m; plástica; interior");
    expect(markup).toContain("COP 90.000");
    expect(markup).toContain("COP 140.000");
    expect(markup).not.toMatch(
      /proveedor|costo de compra|margen|markup|ganancia|rentabilidad/i,
    );
  });

  it("preserves presentation controls without adding out-of-scope actions", () => {
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator
        initialSystemTypeId="wifi"
        initialPresentationId="bundled"
      />,
    );
    expect(markup).toContain("Presentación de la cotización");
    expect(markup).toMatch(/checked="" value="bundled"/);
    expect(markup).not.toContain("Agregar a la cotización");
    expect(markup).not.toContain("Total del sistema");
    expect(markup).not.toContain("Instalación");
  });

  it("shows group commercial choices without selecting them automatically", () => {
    const selection = createSelection({
      systemTypeId: "wifi",
      totalCameraQuantity: "1",
      brand: "Hikvision",
      resolutionGroup: "2-mp",
      groups: [
        {
          id: "inside",
          environment: "interior",
          format: "PT",
          quantity: "1",
          cameraId: "wifi-camera-ds-2cv2q21g1-idw-w",
        },
      ],
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator
        initialCatalogSelection={selection}
        onAddQuotationLine={() => undefined}
      />,
    );
    expect(markup).toContain("Accesorios");
    expect(markup).toContain("Sin accesorios");
    expect(markup).toContain("Con accesorios");
    expect(markup).toContain("Sin instalación");
    expect(markup).toContain("Especial / difícil");
    expect(markup).not.toContain("Agregar a la cotización");
  });

  it("shows a complete Analog total and quotation action", () => {
    const selection = createSelection({
      systemTypeId: "analog",
      totalCameraQuantity: "1",
      brand: "Dahua",
      resolutionGroup: "2-mp",
      groups: [
        {
          id: "inside",
          environment: "interior",
          format: "Domo",
          quantity: "1",
          cameraId: "analog-camera-dh-hac-t1a21n-u-028b",
        },
      ],
      recorderId: "dvr-xvr-dh-xvr1b04-i-t",
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator
        initialCatalogSelection={selection}
        initialPresentationId="itemized"
        initialCommercialSelection={{
          cameraGroups: {
            inside: {
              accessorySelectionId:
                SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withAccessories,
              installationTypeId: "standard",
            },
          },
          hardDriveSelectionId: "none",
          recorderConfigurationId:
            SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS.notIncluded,
          optionalComponents: [],
        }}
        onAddQuotationLine={() => undefined}
      />,
    );
    expect(markup).toContain("Subtotal del grupo");
    expect(markup).toContain("Total del sistema");
    expect(markup).toContain("Agregar a la cotización");
    expect(markup).toContain(
      "El cableado no está incluido en esta cotización.",
    );
  });

  it("keeps manual-confirmation hard drives visibly pending and non-addable", () => {
    const selection = createSelection({
      systemTypeId: "analog",
      totalCameraQuantity: "1",
      brand: "Dahua",
      resolutionGroup: "2-mp",
      groups: [
        {
          id: "inside",
          environment: "interior",
          format: "Domo",
          quantity: "1",
          cameraId: "analog-camera-dh-hac-t1a21n-u-028b",
        },
      ],
      recorderId: "dvr-xvr-dh-xvr1b04-i-t",
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator
        initialCatalogSelection={selection}
        initialPresentationId="bundled"
        initialCommercialSelection={{
          cameraGroups: {
            inside: {
              accessorySelectionId:
                SECURITY_SYSTEM_CAMERA_ACCESSORY_SELECTION_IDS.withoutAccessories,
              installationTypeId: "none",
            },
          },
          hardDriveSelectionId: "hard-drive-wd60pur",
          recorderConfigurationId:
            SECURITY_SYSTEM_RECORDER_CONFIGURATION_IDS.included,
          optionalComponents: [],
        }}
        onAddQuotationLine={() => undefined}
      />,
    );
    expect(markup).toContain("Precio por confirmar:");
    expect(markup).toContain("Consultar");
    expect(markup).not.toContain("Agregar a la cotización");
  });

  it("keeps Wi-Fi free of recorder, disk and configuration selectors", () => {
    const selection = createSelection({
      systemTypeId: "wifi",
      totalCameraQuantity: "1",
      brand: "Hikvision",
      resolutionGroup: "2-mp",
      groups: [
        {
          id: "inside",
          environment: "interior",
          format: "PT",
          quantity: "1",
          cameraId: "wifi-camera-ds-2cv2q21g1-idw-w",
        },
      ],
    });
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator initialCatalogSelection={selection} />,
    );
    expect(markup).not.toContain("Grabador NVR");
    expect(markup).not.toContain(">Disco duro</label>");
    expect(markup).not.toContain("<legend>Configuración DVR/NVR</legend>");
    expect(markup).toContain("Accesorios adicionales");
    expect(markup).not.toContain("Switches PoE");
    expect(markup).not.toContain("Fuentes centralizadas");
  });
});

function formatExpectedCop(value: number): string {
  return `COP ${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}
