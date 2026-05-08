import { describe, it, expect, vi } from "vitest";

vi.mock("ag-psd", () => ({
  writePsd: vi.fn(() => new ArrayBuffer(100)),
}));

vi.stubGlobal("document", {
  createElement: vi.fn(() => {
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        fillStyle: "",
        font: "",
        textBaseline: "",
        textAlign: "",
        fillRect: vi.fn(),
        fillText: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        drawImage: vi.fn(),
      })),
    };
    return canvas;
  }),
});

vi.stubGlobal("Image", class MockImage {
  crossOrigin = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 1920;
  naturalHeight = 1080;
  set src(_: string) {
    setTimeout(() => this.onload?.(), 0);
  }
});

import { psdExportPlugin } from "./psd";
import type { ExportContext } from "../types";

const mockContext: ExportContext = {
  manifest: {
    id: "test",
    name: "Test Package",
    format: "designpkg",
    version: "1.0.0",
    document: "document.json",
    tokens: "tokens.json",
    artboards: [
      { id: "ab.1", name: "Artboard 1", path: "artboards/ab1/scene.json", width: 1080, height: 1080 },
    ],
    assets: {
      "bg.img": { type: "image", mimeType: "image/jpeg", path: "/img/bg.jpg" },
    },
  },
  tokens: {
    colors: { white: "#FFFFFF", yellow: "#FFD21F", darkGrey: "#1E1E1E" },
    fonts: { headline: { fontFamily: "Inter", fontWeight: 700 } },
    effects: {
      shadow: {
        type: "linear-gradient",
        angle: 270,
        stops: [
          { offset: 0, color: "#000000", opacity: 0.8 },
          { offset: 1, color: "#000000", opacity: 0 },
        ],
      },
    },
  },
  scenes: {
    "ab.1": {
      id: "ab.1",
      type: "artboard",
      name: "Artboard 1",
      width: 1080,
      height: 1080,
      unit: "px",
      children: [
        { id: "n1", type: "image", assetId: "bg.img", x: 0, y: 0, width: 1080, height: 1080, fit: "cover" },
        { id: "n2", type: "rect", x: 0, y: 0, width: 1080, height: 1080, style: { fill: "{effects.shadow}" } },
        { id: "n3", type: "rect", x: 50, y: 50, width: 200, height: 100, style: { fill: { type: "solid", color: "{colors.darkGrey}", opacity: 0.9 }, radius: 12 } },
        { id: "n4", type: "text", x: 80, y: 80, width: 300, height: 60, text: "HELLO", style: { fontFamily: "{fonts.headline.fontFamily}", fontWeight: 700, fontSize: 48, color: "{colors.yellow}", textTransform: "uppercase" } },
      ],
    },
  },
  assets: {
    "bg.img": { type: "image", mimeType: "image/jpeg", path: "/img/bg.jpg" },
  },
  selectedArtboardId: "ab.1",
};

describe("psdExportPlugin", () => {
  it("has correct metadata", () => {
    expect(psdExportPlugin.id).toBe("builtin:psd");
    expect(psdExportPlugin.fileExtension).toBe("psd");
    expect(psdExportPlugin.mimeType).toBe("image/vnd.adobe.photoshop");
    expect(psdExportPlugin.capabilities.supportsLayers).toBe(true);
    expect(psdExportPlugin.capabilities.scopes).toHaveLength(3);
  });

  it("has configurable option fields", () => {
    expect(psdExportPlugin.optionFields.length).toBeGreaterThan(0);
    const keys = psdExportPlugin.optionFields.map((f) => f.key);
    expect(keys).toContain("includeAllArtboards");
    expect(keys).toContain("resolution");
    expect(keys).toContain("preserveLayerNames");
  });

  it("validates successfully with valid context", () => {
    const error = psdExportPlugin.validate?.(mockContext);
    expect(error).toBeNull();
  });

  it("validates with error when no scenes", () => {
    const emptyContext = { ...mockContext, scenes: {} };
    const error = psdExportPlugin.validate?.(emptyContext);
    expect(error).toContain("No artboards");
  });

  it("executes export and returns a PSD blob", async () => {
    const result = await psdExportPlugin.execute(mockContext, {
      includeAllArtboards: true,
      flattenImages: false,
      preserveLayerNames: true,
      resolution: 72,
    });

    expect(result.filename).toMatch(/\.psd$/);
    expect(result.mimeType).toBe("image/vnd.adobe.photoshop");
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it("exports only selected artboard when includeAllArtboards is false", async () => {
    const result = await psdExportPlugin.execute(mockContext, {
      includeAllArtboards: false,
      flattenImages: false,
      preserveLayerNames: true,
      resolution: 72,
    });

    expect(result.blob).toBeInstanceOf(Blob);
  });
});
