import { describe, it, expect, vi } from "vitest";

vi.mock("pixi.js", () => {
  class MockSprite {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    mask: unknown = null;
    constructor(public texture: unknown) {}
  }
  class MockContainer {
    children: unknown[] = [];
    addChild(child: unknown) { this.children.push(child); }
  }
  class MockGraphics {
    rect() { return this; }
    fill() { return this; }
  }
  return {
    Assets: {
      load: vi.fn(async () => ({ width: 1920, height: 1080 })),
    },
    Sprite: MockSprite,
    Container: MockContainer,
    Graphics: MockGraphics,
  };
});

import { renderImageNode } from "./renderImageNode";
import type { AssetManifestEntry, ImageNode } from "@/package/types";

const assets: Record<string, AssetManifestEntry> = {
  "bg.image": { type: "image", mimeType: "image/jpeg", path: "/img/bg.jpg" },
  "logo.svg": { type: "vector", mimeType: "image/svg+xml", path: "/img/logo.svg" },
};

describe("renderImageNode", () => {
  it("throws if asset is missing", async () => {
    const node: ImageNode = {
      id: "img1",
      type: "image",
      assetId: "nonexistent",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    await expect(renderImageNode({ node, assets })).rejects.toThrow("Missing asset");
  });

  it("renders an image with cover fit", async () => {
    const node: ImageNode = {
      id: "img2",
      type: "image",
      assetId: "bg.image",
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      fit: "cover",
    };
    const result = await renderImageNode({ node, assets });
    expect(result).not.toBeNull();
  });

  it("renders an image with contain fit", async () => {
    const node: ImageNode = {
      id: "img3",
      type: "image",
      assetId: "bg.image",
      x: 10,
      y: 10,
      width: 200,
      height: 100,
      fit: "contain",
    };
    const result = await renderImageNode({ node, assets });
    expect(result).not.toBeNull();
  });

  it("renders an image with fill (default)", async () => {
    const node: ImageNode = {
      id: "img4",
      type: "image",
      assetId: "logo.svg",
      x: 20,
      y: 30,
      width: 300,
      height: 200,
    };
    const result = await renderImageNode({ node, assets });
    expect(result).not.toBeNull();
    expect((result as { x: number }).x).toBe(20);
    expect((result as { y: number }).y).toBe(30);
  });
});
