import { describe, it, expect, vi } from "vitest";

const mockZipFile = vi.fn();
const mockGenerateAsync = vi.fn(async () => new Blob(["zip-blob"]));

vi.mock("jszip", () => {
  return {
    default: class MockJSZip {
      file = mockZipFile;
      generateAsync = mockGenerateAsync;
    },
  };
});

import { serializeToZip } from "./zipSerializer";
import type { DesignPackageInstance } from "../types";
import { PackageState } from "../types";

const mockInstance: DesignPackageInstance = {
  manifest: {
    id: "pkg-1",
    name: "Test Package",
    format: "designpkg",
    version: "1.0.0",
    document: "document.json",
    tokens: "tokens.json",
    artboards: [
      { id: "ab.1", name: "Board", path: "artboards/ab-1/scene.json", width: 500, height: 300 },
    ],
    assets: { "img.bg": { type: "image", mimeType: "image/jpeg", path: "assets/bg.jpg" } },
  },
  document: {
    id: "doc.1",
    version: "1.0.0",
    unit: "px",
    colorSpace: "srgb",
    rootId: "root",
    artboards: ["ab.1"],
    assets: ["img.bg"],
    dependencies: { "ab.1": ["img.bg"] },
  },
  tokens: { colors: { white: "#FFF" }, fonts: {}, effects: {} },
  scenes: {
    "ab.1": {
      id: "ab.1",
      type: "artboard",
      name: "Board",
      width: 500,
      height: 300,
      unit: "px",
      children: [],
    },
  },
  resolvedAssets: {
    "img.bg": {
      entry: { type: "image", mimeType: "image/jpeg", path: "assets/bg.jpg" },
      url: "/static/bg.jpg",
      loaded: false,
    },
  },
  source: { type: "memory", id: "test" },
  state: PackageState.Ready,
};

describe("serializeToZip", () => {
  it("generates a zip blob", async () => {
    const result = await serializeToZip(mockInstance);
    expect(result).toBeInstanceOf(Blob);
  });

  it("adds manifest.json to the zip", async () => {
    await serializeToZip(mockInstance);
    expect(mockZipFile).toHaveBeenCalledWith("manifest.json", expect.any(String));
  });

  it("adds document.json to the zip", async () => {
    await serializeToZip(mockInstance);
    expect(mockZipFile).toHaveBeenCalledWith("document.json", expect.any(String));
  });

  it("adds tokens.json to the zip", async () => {
    await serializeToZip(mockInstance);
    expect(mockZipFile).toHaveBeenCalledWith("tokens.json", expect.any(String));
  });

  it("adds scene files for artboards", async () => {
    await serializeToZip(mockInstance);
    expect(mockZipFile).toHaveBeenCalledWith("artboards/ab-1/scene.json", expect.any(String));
  });

  it("uses DEFLATE compression", async () => {
    await serializeToZip(mockInstance);
    expect(mockGenerateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blob",
        compression: "DEFLATE",
      })
    );
  });
});
