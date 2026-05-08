import { describe, it, expect } from "vitest";
import { classifyNode, classifyScene } from "./classifier";
import { NodeRole, AnchorRegion } from "./types";
import type { ArtboardScene, ImageNode, RectNode, TextNode } from "@/package/types";

const artboard: ArtboardScene = {
  id: "test-artboard",
  type: "artboard",
  name: "Test",
  width: 1080,
  height: 1080,
  unit: "px",
  children: [],
};

describe("classifyNode", () => {
  it("classifies a full-bleed image as FullBleed", () => {
    const node: ImageNode = {
      id: "bg",
      type: "image",
      assetId: "hero",
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      fit: "cover",
    };

    const result = classifyNode(node, artboard);
    expect(result.role).toBe(NodeRole.FullBleed);
  });

  it("classifies a full-bleed overlay rect as FullBleed", () => {
    const node: RectNode = {
      id: "overlay",
      type: "rect",
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      style: { fill: { type: "solid", color: "#000" } },
    };

    const result = classifyNode(node, artboard);
    expect(result.role).toBe(NodeRole.FullBleed);
  });

  it("classifies a small panel as Content", () => {
    const node: RectNode = {
      id: "panel",
      type: "rect",
      x: 72,
      y: 520,
      width: 430,
      height: 310,
      style: { fill: { type: "solid", color: "#1E1E1E" }, radius: 28 },
    };

    const result = classifyNode(node, artboard);
    expect(result.role).toBe(NodeRole.Content);
  });

  it("anchors a bottom-left element correctly", () => {
    const node: RectNode = {
      id: "panel",
      type: "rect",
      x: 72,
      y: 800,
      width: 300,
      height: 200,
      style: { fill: { type: "solid", color: "#1E1E1E" } },
    };

    const result = classifyNode(node, artboard);
    expect(result.anchor).toBe(AnchorRegion.BottomLeft);
  });

  it("anchors a center-left element correctly", () => {
    const node: RectNode = {
      id: "panel",
      type: "rect",
      x: 72,
      y: 520,
      width: 430,
      height: 310,
      style: { fill: { type: "solid", color: "#1E1E1E" } },
    };

    const result = classifyNode(node, artboard);
    expect(result.anchor).toBe(AnchorRegion.CenterLeft);
  });

  it("anchors a top-left element correctly", () => {
    const node: ImageNode = {
      id: "logo",
      type: "image",
      assetId: "logo",
      x: 50,
      y: 50,
      width: 180,
      height: 72,
      fit: "contain",
    };

    const result = classifyNode(node, artboard);
    expect(result.anchor).toBe(AnchorRegion.TopLeft);
  });

  it("anchors a center-right element correctly", () => {
    const node: TextNode = {
      id: "headline",
      type: "text",
      text: "Test",
      x: 620,
      y: 420,
      width: 360,
      height: 180,
      style: {
        fontFamily: "Inter",
        fontSize: 44,
        color: "#FFF",
        align: "right",
      },
    };

    const result = classifyNode(node, artboard);
    expect(result.anchor).toBe(AnchorRegion.CenterRight);
  });

  it("computes correct margins", () => {
    const node: RectNode = {
      id: "panel",
      type: "rect",
      x: 100,
      y: 200,
      width: 300,
      height: 400,
      style: { fill: { type: "solid", color: "#000" } },
    };

    const result = classifyNode(node, artboard);
    expect(result.margins).toEqual({
      top: 200,
      right: 680,
      bottom: 480,
      left: 100,
    });
  });
});

describe("classifyScene", () => {
  it("classifies all children", () => {
    const scene: ArtboardScene = {
      ...artboard,
      children: [
        {
          id: "bg",
          type: "image",
          assetId: "hero",
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          fit: "cover",
        },
        {
          id: "panel",
          type: "rect",
          x: 72,
          y: 520,
          width: 430,
          height: 310,
          style: { fill: { type: "solid", color: "#1E1E1E" } },
        },
      ],
    };

    const results = classifyScene(scene);
    expect(results).toHaveLength(2);
    expect(results[0].role).toBe(NodeRole.FullBleed);
    expect(results[1].role).toBe(NodeRole.Content);
  });
});
