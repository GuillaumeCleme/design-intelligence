import { describe, it, expect } from "vitest";
import { reflowScene } from "./engine";
import type { ArtboardScene, ImageNode, RectNode, TextNode } from "@/package/types";

function makeScene(overrides?: Partial<ArtboardScene>): ArtboardScene {
  return {
    id: "artboard.square.1080",
    type: "artboard",
    name: "Square Social Banner",
    width: 1080,
    height: 1080,
    unit: "px",
    children: [
      {
        id: "bg",
        type: "image",
        name: "Background",
        assetId: "background.hero",
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        fit: "cover",
        opacity: 1,
      } satisfies ImageNode,
      {
        id: "overlay",
        type: "rect",
        name: "Overlay",
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        style: { fill: { type: "solid", color: "#000", opacity: 0.5 } },
        opacity: 1,
      } satisfies RectNode,
      {
        id: "panel",
        type: "rect",
        name: "Panel",
        x: 72,
        y: 520,
        width: 430,
        height: 310,
        style: {
          fill: { type: "solid", color: "#1E1E1E", opacity: 0.88 },
          radius: 28,
        },
      } satisfies RectNode,
      {
        id: "logo",
        type: "image",
        name: "Logo",
        assetId: "logo.primary",
        x: 112,
        y: 560,
        width: 180,
        height: 72,
        fit: "contain",
      } satisfies ImageNode,
      {
        id: "headline",
        type: "text",
        name: "Headline",
        x: 112,
        y: 660,
        width: 350,
        height: 150,
        text: "CREATE\nWITHOUT\nLIMITS",
        style: {
          fontFamily: "Inter",
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 58,
          letterSpacing: -1.2,
          color: "#FFD21F",
          textTransform: "uppercase",
        },
      } satisfies TextNode,
      {
        id: "subheadline",
        type: "text",
        name: "Subheadline",
        x: 620,
        y: 420,
        width: 360,
        height: 180,
        text: "Design systems that scale.",
        style: {
          fontFamily: "Inter",
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 52,
          letterSpacing: -0.8,
          color: "#FFFFFF",
          align: "right",
        },
      } satisfies TextNode,
    ],
    ...overrides,
  };
}

describe("reflowScene", () => {
  it("produces a new scene with the target dimensions", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 1080,
      targetHeight: 1920,
    });

    expect(scene.width).toBe(1080);
    expect(scene.height).toBe(1920);
    expect(scene.id).toContain("reflow");
    expect(scene.name).toContain("1080×1920");
  });

  it("uses custom id and name when provided", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 1080,
      targetHeight: 1350,
      newArtboardId: "custom-id",
      newArtboardName: "Custom Name",
    });

    expect(scene.id).toBe("custom-id");
    expect(scene.name).toBe("Custom Name");
  });

  it("resizes full-bleed elements to target dimensions", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 1080,
      targetHeight: 1920,
    });

    const bg = scene.children[0] as ImageNode;
    expect(bg.x).toBe(0);
    expect(bg.y).toBe(0);
    expect(bg.width).toBe(1080);
    expect(bg.height).toBe(1920);

    const overlay = scene.children[1] as RectNode;
    expect(overlay.x).toBe(0);
    expect(overlay.y).toBe(0);
    expect(overlay.width).toBe(1080);
    expect(overlay.height).toBe(1920);
  });

  it("preserves children count", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 1920,
      targetHeight: 1080,
    });

    expect(scene.children).toHaveLength(source.children.length);
  });

  it("scales text font size proportionally", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 540,
      targetHeight: 540,
    });

    const headline = scene.children[4] as TextNode;
    expect(headline.style.fontSize).toBe(26);
    expect(headline.style.lineHeight).toBe(29);
  });

  it("scales rect border radius proportionally", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 540,
      targetHeight: 540,
    });

    const panel = scene.children[2] as RectNode;
    expect(panel.style.radius).toBe(14);
  });

  it("keeps content elements within bounds", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 300,
      targetHeight: 250,
    });

    for (const node of scene.children) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      if (node.x + node.width > scene.width) {
        expect(node.x).toBe(0);
      }
    }
  });

  it("handles reflow to a wider aspect ratio", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 1920,
      targetHeight: 1080,
    });

    const bg = scene.children[0] as ImageNode;
    expect(bg.width).toBe(1920);
    expect(bg.height).toBe(1080);

    const headline = scene.children[4] as TextNode;
    expect(headline.x).toBeGreaterThanOrEqual(0);
    expect(headline.y).toBeGreaterThanOrEqual(0);
    expect(headline.width).toBeLessThanOrEqual(scene.width);
  });

  it("handles reflow to a taller aspect ratio (9:16 story)", () => {
    const source = makeScene();
    const { scene } = reflowScene({
      sourceScene: source,
      targetWidth: 1080,
      targetHeight: 1920,
    });

    expect(scene.width).toBe(1080);
    expect(scene.height).toBe(1920);

    const panel = scene.children[2] as RectNode;
    expect(panel.width).toBeLessThanOrEqual(scene.width);
    expect(panel.y + panel.height).toBeLessThanOrEqual(scene.height);
  });

  it("returns classification data", () => {
    const source = makeScene();
    const { classifications } = reflowScene({
      sourceScene: source,
      targetWidth: 1080,
      targetHeight: 1350,
    });

    expect(classifications).toHaveLength(source.children.length);
    expect(classifications[0].role).toBe("full-bleed");
    expect(classifications[2].role).toBe("content");
  });

  it("preserves source scene immutability", () => {
    const source = makeScene();
    const originalWidth = source.width;
    const originalChildren = [...source.children];

    reflowScene({
      sourceScene: source,
      targetWidth: 1920,
      targetHeight: 1080,
    });

    expect(source.width).toBe(originalWidth);
    expect(source.children).toEqual(originalChildren);
  });
});
