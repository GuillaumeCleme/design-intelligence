import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadPackageFromDirectory } from "./directoryLoader";

const mockManifest = {
  id: "test-pkg",
  name: "Test",
  format: "designpkg",
  version: "1.0.0",
  document: "document.json",
  tokens: "tokens.json",
  artboards: [
    { id: "ab.1", name: "Board 1", path: "artboards/ab-1/scene.json", width: 800, height: 600 },
  ],
  assets: {
    "img.bg": { type: "image", mimeType: "image/jpeg", path: "assets/images/bg.jpg" },
  },
};

const mockDocument = {
  id: "doc.test",
  version: "1.0.0",
  unit: "px",
  colorSpace: "srgb",
  rootId: "root",
  artboards: ["ab.1"],
  assets: ["img.bg"],
  dependencies: { "ab.1": ["img.bg"] },
};

const mockTokens = {
  colors: { white: "#FFF" },
  fonts: { heading: { fontFamily: "Inter" } },
  effects: {},
};

const mockScene = {
  id: "ab.1",
  type: "artboard",
  name: "Board 1",
  width: 800,
  height: 600,
  unit: "px",
  children: [],
};

const mockResponses: Record<string, unknown> = {
  "/packages/test/manifest.json": mockManifest,
  "/packages/test/document.json": mockDocument,
  "/packages/test/tokens.json": mockTokens,
  "/packages/test/artboards/ab-1/scene.json": mockScene,
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const data = mockResponses[url];
    if (data) {
      return { ok: true, json: async () => data };
    }
    return { ok: false, status: 404, statusText: "Not Found" };
  }));
});

describe("loadPackageFromDirectory", () => {
  it("loads and parses all package files", async () => {
    const instance = await loadPackageFromDirectory("/packages/test/");

    expect(instance.manifest.id).toBe("test-pkg");
    expect(instance.document.id).toBe("doc.test");
    expect(instance.tokens.colors.white).toBe("#FFF");
    expect(instance.scenes["ab.1"]).toBeDefined();
    expect(instance.scenes["ab.1"].width).toBe(800);
  });

  it("resolves assets to URLs relative to basePath", async () => {
    const instance = await loadPackageFromDirectory("/packages/test/");

    expect(instance.resolvedAssets["img.bg"]).toBeDefined();
    expect(instance.resolvedAssets["img.bg"].url).toBe(
      "/packages/test/assets/images/bg.jpg"
    );
  });

  it("sets state to ready", async () => {
    const instance = await loadPackageFromDirectory("/packages/test/");
    expect(instance.state).toBe("ready");
  });

  it("sets source type to directory", async () => {
    const instance = await loadPackageFromDirectory("/packages/test/");
    expect(instance.source.type).toBe("directory");
  });

  it("normalizes basePath without trailing slash", async () => {
    const instance = await loadPackageFromDirectory("/packages/test");
    expect(instance.source).toEqual({ type: "directory", basePath: "/packages/test/" });
  });

  it("throws on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, statusText: "Server Error" })));
    await expect(loadPackageFromDirectory("/bad/")).rejects.toThrow("Failed to fetch");
  });
});
