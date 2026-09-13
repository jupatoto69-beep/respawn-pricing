import { describe, expect, it } from "vitest";
import { SECURITY_SYSTEM_CATALOGS as catalogs } from "./catalog";

describe("approved public source examples", () => {
  it("preserves the analog reference, format, description and both published prices", () => {
    expect(
      catalogs.analogCameras.find(
        (entry) => entry.reference === "DH-HAC-T1A21N-U-028B",
      ),
    ).toMatchObject({
      brand: "Dahua",
      systemType: "analog",
      resolutionGroup: "2-mp",
      format: "Domo",
      description: "1080p; IR 25 m; plástica; interior",
      salePriceCop: 90000,
      withAccessoriesSalePriceCop: 140000,
    });
    expect(
      catalogs.analogCameras.find(
        (entry) => entry.reference === "DH-HAC-HFW1800RN-0280B",
      ),
    ).toMatchObject({
      description: "4K; IR 20 m; IP50; plástica",
      salePriceCop: 200000,
      withAccessoriesSalePriceCop: 250000,
    });
  });

  it("preserves IP camera data without extending published specifications", () => {
    expect(
      catalogs.ipCameras.find(
        (entry) => entry.reference === "DS-2CD1043G2-LIU(2.8mm)",
      ),
    ).toMatchObject({
      brand: "Hikvision",
      systemType: "ip",
      resolutionGroup: "4-mp",
      format: "Bala",
      description: "4 MP; híbrida B/N-ColorVu; micrófono; IR 30 m; IP67",
      salePriceCop: 395000,
      withAccessoriesSalePriceCop: 420000,
    });
    expect(
      catalogs.ipCameras.find(
        (entry) => entry.reference === "DH-IPC-EBW5641P-AS",
      ),
    ).toMatchObject({
      resolutionGroup: "5-8-mp",
      format: "Ojo de pez",
      salePriceCop: 980000,
      withAccessoriesSalePriceCop: 1005000,
    });
  });

  it("keeps Wi-Fi separate even when PoE is also published", () => {
    expect(
      catalogs.wifiCameras.find(
        (entry) => entry.reference === "DS-2CD2421G0-IW(2.8mm)(W)",
      ),
    ).toMatchObject({
      systemType: "wifi",
      resolutionGroup: "2-mp",
      format: "Cubo",
      description: "2 MP; Wi-Fi; PoE; audio 2 vías; IR 10 m; microSD",
      salePriceCop: 375000,
      withAccessoriesSalePriceCop: 390000,
    });
    expect(
      catalogs.wifiCameras.find(
        (entry) => entry.reference === "DH-IPC-P5DP-5F-PV",
      ),
    ).toMatchObject({
      resolutionGroup: "10-mp-combined",
      salePriceCop: 375000,
      withAccessoriesSalePriceCop: 395000,
    });
  });

  it("preserves analog recorder capabilities and NVR PoE without inferring storage semantics", () => {
    expect(
      catalogs.dvrXvr.find((entry) => entry.reference === "DVR-232Q-M2"),
    ).toMatchObject({
      brand: "HiLook",
      recorderType: "dvr-xvr",
      channels: 32,
      description: "Hasta 4 MP Lite; 2 bahías / 10 TB cada una; 4K HDMI",
      salePriceCop: 1470000,
    });
    expect(
      catalogs.nvr.find(
        (entry) => entry.reference === "DS-7604NI-Q1/4P(STD)(D)",
      ),
    ).toMatchObject({
      brand: "Hikvision",
      recorderType: "nvr",
      channels: 4,
      poePorts: 4,
      description: "4 PoE; 2 bahías / 6 TB; 60 Mbps; H.265+",
      salePriceCop: 680000,
    });
    expect(
      catalogs.nvr.find((entry) => entry.reference === "DS-7732NI-K4/16P"),
    ).toMatchObject({
      channels: 32,
      poePorts: 16,
      description: "16 PoE+; hasta 8 MP; 4 bahías / 6 TB; alcance 300 m",
      salePriceCop: 2450000,
    });
  });

  it("preserves disk condition, warranty and published capacity units", () => {
    expect(
      catalogs.hardDrives.find((entry) => entry.reference === "WD10PUR"),
    ).toMatchObject({
      line: "Western Purple",
      capacity: 1,
      capacityUnit: "TB",
      conditionAndWarranty: "Pull remanufacturado; 1 año de garantía directa",
      salePriceCop: 460000,
    });
    expect(
      catalogs.hardDrives.find((entry) => entry.reference === "DPULL500"),
    ).toMatchObject({
      line: "Pull",
      capacity: 500,
      capacityUnit: "GB",
      conditionAndWarranty: "Pull remanufacturado multimarca; 6 meses",
      salePriceCop: 135000,
    });
  });

  it("preserves network, power, cable and accessory examples", () => {
    expect(
      catalogs.poeSwitches.find((entry) => entry.reference === "WK-PS219GF"),
    ).toMatchObject({
      brand: "Witek",
      poePorts: 16,
      description: "10/100 Mbps; 2 uplink gigabit; 1 SFP",
      salePriceCop: 400000,
    });
    expect(
      catalogs.powerSupplies.find((entry) => entry.reference === "FC20A18"),
    ).toMatchObject({
      amperes: 20,
      outputs: 18,
      description: "Fuente centralizada para sistemas CCTV",
      salePriceCop: 175000,
    });
    expect(
      catalogs.exteriorCable.find(
        (entry) => entry.reference === "UTPCAT6EXENERLINE",
      ),
    ).toMatchObject({
      category: "cat-6",
      presentationLengthMeters: 305,
      construction: "Exterior Enerline; doble chaqueta; aleación 70-30",
      salePriceCop: 250000,
    });
    expect(
      catalogs.exteriorCable.find(
        (entry) => entry.reference === "UTPCAT5EXCO100",
      ),
    ).toMatchObject({
      category: "cat-5e",
      presentationLengthMeters: 100,
      construction: "Exterior; 100% cobre",
      salePriceCop: 205000,
    });
    expect(
      catalogs.accessories.find((entry) => entry.reference === "BAL4K"),
    ).toMatchObject({ name: "Video balun hasta 8 MP", salePriceCop: 16000 });
  });

  it("matches exactly the ten approved kits, quantities and final prices", () => {
    const actual = catalogs.cameraKits.map((kit) => ({
      id: kit.id,
      name: kit.name,
      systemType: kit.systemType,
      location: kit.location,
      components: kit.components.map((component) => [
        catalogs.accessories.find(
          (accessory) => accessory.id === component.accessoryId,
        )?.reference,
        component.quantity,
      ]),
      salePriceCop: kit.salePriceCop,
    }));
    expect(actual).toEqual([
      {
        id: "kit-analog-2-mp-interior",
        name: "Analógico 2 MP interior",
        systemType: "analog",
        location: "interior",
        components: [
          ["A1A", 1],
          ["BALHD", 1],
          ["DCH", 1],
          ["CA-IN", 1],
        ],
        salePriceCop: 50000,
      },
      {
        id: "kit-analog-2-mp-exterior",
        name: "Analógico 2 MP exterior",
        systemType: "analog",
        location: "exterior",
        components: [
          ["A1A", 1],
          ["BALHD", 1],
          ["DCH", 1],
          ["CAIP55", 1],
        ],
        salePriceCop: 50000,
      },
      {
        id: "kit-analog-3k-8-mp-interior",
        name: "Analógico 3K a 8 MP interior",
        systemType: "analog",
        location: "interior",
        components: [
          ["A1A", 1],
          ["BAL4K", 1],
          ["DCH", 1],
          ["CA-IN", 1],
        ],
        salePriceCop: 50000,
      },
      {
        id: "kit-analog-3k-8-mp-exterior",
        name: "Analógico 3K a 8 MP exterior",
        systemType: "analog",
        location: "exterior",
        components: [
          ["A1A", 1],
          ["BAL4K", 1],
          ["DCH", 1],
          ["CAIP55", 1],
        ],
        salePriceCop: 50000,
      },
      {
        id: "kit-ip-cat-5e-interior",
        name: "IP Cat 5E interior",
        systemType: "ip",
        location: "interior",
        components: [
          ["RJ45CAT5EZ", 2],
          ["CA-IN", 1],
        ],
        salePriceCop: 25000,
      },
      {
        id: "kit-ip-cat-5e-exterior",
        name: "IP Cat 5E exterior",
        systemType: "ip",
        location: "exterior",
        components: [
          ["RJ45CAT5EZ", 2],
          ["CAIP55", 1],
        ],
        salePriceCop: 25000,
      },
      {
        id: "kit-ip-cat-6-interior",
        name: "IP Cat 6 interior",
        systemType: "ip",
        location: "interior",
        components: [
          ["RJ45CAT6EZ", 2],
          ["CA-IN", 1],
        ],
        salePriceCop: 25000,
      },
      {
        id: "kit-ip-cat-6-exterior",
        name: "IP Cat 6 exterior",
        systemType: "ip",
        location: "exterior",
        components: [
          ["RJ45CAT6EZ", 2],
          ["CAIP55", 1],
        ],
        salePriceCop: 25000,
      },
      {
        id: "kit-wifi-interior",
        name: "Wi-Fi interior",
        systemType: "wifi",
        location: "interior",
        components: [["CA-IN", 1]],
        salePriceCop: 15000,
      },
      {
        id: "kit-wifi-exterior",
        name: "Wi-Fi exterior",
        systemType: "wifi",
        location: "exterior",
        components: [["CAIP55", 1]],
        salePriceCop: 20000,
      },
    ]);
  });
});
