import { describe, it, expect, vi } from "vitest";

vi.mock("pixi.js", () => {
  class MockGraphics {
    roundRect() { return this; }
    fill() { return this; }
  }
  class MockSprite {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    constructor() {}
  }
  return {
    Graphics: MockGraphics,
    Sprite: MockSprite,
    Texture: { from: vi.fn(() => ({})) },
  };
});

vi.mock("./gradients", () => ({
  createGradientTexture: vi.fn(() => ({ width: 100, height: 100 })),
}));

import { renderRectNode } from "./renderRectNode";
import type { RectNode, Tokens } from "@/package/types";

const tokens: Tokens = {
  colors: { red: "#FF0000", darkGrey: "#1E1E1E" },
  fonts: {},
  effects: {
    gradient: {
      type: "linear-gradient",
      angle: 90,
      stops: [
        { offset: 0, color: "#000", opacity: 1 },
        { offset: 1, color: "#FFF", opacity: 0 },
      ],
    },
  },
};

describe("renderRectNode", () => {
  it("returns null if no fill is defined", () => {
    const node: RectNode = {
      id: "r1",
      type: "rect",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      style: {},
    };
    const result = renderRectNode({ node, tokens });
    expect(result).toBeNull();
  });

  it("renders a solid fill rect", () => {
    const node: RectNode = {
      id: "r2",
      type: "rect",
      x: 10,
      y: 20,
      width: 200,
      height: 150,
      style: {
        fill: { type: "solid", color: "#FF0000", opacity: 0.8 },
        radius: 12,
      },
    };
    const result = renderRectNode({ node, tokens });
    expect(result).not.toBeNull();
  });

  it("renders a gradient fill rect as sprite", () => {
    const node: RectNode = {
      id: "r3",
      type: "rect",
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      style: {
        fill: "{effects.gradient}",
      },
    };
    const result = renderRectNode({ node, tokens });
    expect(result).not.toBeNull();
  });

  it("resolves token reference for fill color", () => {
    const node: RectNode = {
      id: "r4",
      type: "rect",
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      style: {
        fill: { type: "solid", color: "{colors.darkGrey}" },
      },
    };
    const result = renderRectNode({ node, tokens });
    expect(result).not.toBeNull();
  });
});
