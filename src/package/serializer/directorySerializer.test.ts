import { describe, it, expect } from "vitest";
import { serializeToDirectory } from "./directorySerializer";
import type { DesignPackageInstance } from "../types";
import { PackageState } from "../types";

const mockInstance: DesignPackageInstance = {
  manifest: {
    id: "test-pkg",
    name: "Test Package",
    format: "designpkg",
    version: "1.0.0",
    document: "document.json",
    tokens: "tokens.json",
    artboards: [
      {
        id: "ab.1",
        name: "Artboard 1",
        path: "artboards/ab-1/scene.json",
        width: 800,
        height: 600,
      },
    ],
    assets: {},
  },
  document: {
    id: "doc.test",
    version: "1.0.0",
    unit: "px",
    colorSpace: "srgb",
    rootId: "root",
    artboards: ["ab.1"],
    assets: [],
    dependencies: { "ab.1": [] },
  },
  tokens: {
    colors: { primary: "#FF0000" },
    fonts: {},
    effects: {},
  },
  scenes: {
    "ab.1": {
      id: "ab.1",
      type: "artboard",
      name: "Artboard 1",
      width: 800,
      height: 600,
      unit: "px",
      children: [],
    },
  },
  resolvedAssets: {},
  source: { type: "memory", id: "test" },
  state: PackageState.Ready,
};

describe("serializeToDirectory", () => {
  it("produces manifest.json", () => {
    const files = serializeToDirectory(mockInstance);
    expect(files["manifest.json"]).toBeDefined();
    const manifest = JSON.parse(files["manifest.json"]);
    expect(manifest.id).toBe("test-pkg");
    expect(manifest.modifiedAt).toBeDefined();
  });

  it("produces document.json at the correct path", () => {
    const files = serializeToDirectory(mockInstance);
    expect(files["document.json"]).toBeDefined();
    const doc = JSON.parse(files["document.json"]);
    expect(doc.id).toBe("doc.test");
  });

  it("produces tokens.json", () => {
    const files = serializeToDirectory(mockInstance);
    expect(files["tokens.json"]).toBeDefined();
    const tokens = JSON.parse(files["tokens.json"]);
    expect(tokens.colors.primary).toBe("#FF0000");
  });

  it("produces scene files for each artboard", () => {
    const files = serializeToDirectory(mockInstance);
    expect(files["artboards/ab-1/scene.json"]).toBeDefined();
    const scene = JSON.parse(files["artboards/ab-1/scene.json"]);
    expect(scene.id).toBe("ab.1");
    expect(scene.width).toBe(800);
  });

  it("returns correct number of files", () => {
    const files = serializeToDirectory(mockInstance);
    expect(Object.keys(files)).toHaveLength(4);
  });
});
