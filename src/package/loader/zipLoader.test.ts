import { describe, it, expect, vi } from "vitest";

vi.mock("jszip", () => {
  const mockFiles: Record<string, string> = {
    "manifest.json": JSON.stringify({
      id: "zip-pkg",
      name: "Zip Test",
      format: "designpkg",
      version: "1.0.0",
      document: "document.json",
      tokens: "tokens.json",
      artboards: [
        { id: "ab.1", name: "Board", path: "artboards/ab-1/scene.json", width: 100, height: 100 },
      ],
      assets: {
        "img.bg": { type: "image", mimeType: "image/png", path: "assets/bg.png" },
      },
    }),
    "document.json": JSON.stringify({
      id: "doc",
      version: "1.0.0",
      unit: "px",
      colorSpace: "srgb",
      rootId: "root",
      artboards: ["ab.1"],
      assets: ["img.bg"],
      dependencies: { "ab.1": ["img.bg"] },
    }),
    "tokens.json": JSON.stringify({
      colors: { red: "#FF0000" },
      fonts: {},
      effects: {},
    }),
    "artboards/ab-1/scene.json": JSON.stringify({
      id: "ab.1",
      type: "artboard",
      name: "Board",
      width: 100,
      height: 100,
      unit: "px",
      children: [],
    }),
  };

  return {
    default: class MockJSZip {
      static async loadAsync() {
        return new MockJSZip();
      }
      file(path: string) {
        const content = mockFiles[path];
        if (!content) return null;
        return {
          async: async (type: string) => {
            if (type === "string") return content;
            if (type === "blob") return new Blob([content]);
            return content;
          },
        };
      }
    },
  };
});

vi.stubGlobal("URL", {
  createObjectURL: vi.fn(() => "blob:mock-url"),
  revokeObjectURL: vi.fn(),
});

import { loadPackageFromZip } from "./zipLoader";

describe("loadPackageFromZip", () => {
  it("loads package from ArrayBuffer", async () => {
    const buffer = new ArrayBuffer(10);
    const instance = await loadPackageFromZip(buffer, "test.designpkg");

    expect(instance.manifest.id).toBe("zip-pkg");
    expect(instance.document.id).toBe("doc");
    expect(instance.tokens.colors.red).toBe("#FF0000");
    expect(instance.scenes["ab.1"]).toBeDefined();
    expect(instance.state).toBe("ready");
    expect(instance.source.type).toBe("zip");
  });

  it("loads package from File", async () => {
    const file = new File([new ArrayBuffer(10)], "my-package.designpkg");
    const instance = await loadPackageFromZip(file);

    expect(instance.manifest.id).toBe("zip-pkg");
    expect(instance.source.type).toBe("zip");
  });

  it("creates blob URLs for assets found in zip", async () => {
    const buffer = new ArrayBuffer(10);
    const instance = await loadPackageFromZip(buffer);

    expect(instance.resolvedAssets["img.bg"]).toBeDefined();
  });
});
