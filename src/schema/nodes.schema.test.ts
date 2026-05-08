import { describe, it, expect } from "vitest";
import {
  ArtboardSceneSchema,
  ImageNodeSchema,
  RectNodeSchema,
  TextNodeSchema,
  SceneNodeSchema,
  TokenRefSchema,
  PaintOrTokenSchema,
} from "./nodes.schema";

describe("TokenRefSchema", () => {
  it("matches a valid token reference", () => {
    expect(TokenRefSchema.safeParse("{colors.white}").success).toBe(true);
    expect(TokenRefSchema.safeParse("{fonts.headline.fontFamily}").success).toBe(true);
  });

  it("rejects non-token strings", () => {
    expect(TokenRefSchema.safeParse("#FFFFFF").success).toBe(false);
    expect(TokenRefSchema.safeParse("plain text").success).toBe(false);
  });
});

describe("PaintOrTokenSchema", () => {
  it("accepts a solid paint", () => {
    const result = PaintOrTokenSchema.safeParse({
      type: "solid",
      color: "#FF0000",
      opacity: 0.5,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a token reference string", () => {
    expect(PaintOrTokenSchema.safeParse("{effects.shadow}").success).toBe(true);
  });

  it("rejects invalid objects", () => {
    expect(PaintOrTokenSchema.safeParse({ type: "invalid" }).success).toBe(false);
  });
});

describe("ImageNodeSchema", () => {
  it("validates a valid image node", () => {
    const result = ImageNodeSchema.safeParse({
      id: "img1",
      type: "image",
      name: "Background",
      assetId: "background.hero",
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      fit: "cover",
      opacity: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid fit value", () => {
    const result = ImageNodeSchema.safeParse({
      id: "img1",
      type: "image",
      assetId: "bg",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fit: "stretch",
    });
    expect(result.success).toBe(false);
  });
});

describe("RectNodeSchema", () => {
  it("validates a rect with solid fill", () => {
    const result = RectNodeSchema.safeParse({
      id: "rect1",
      type: "rect",
      x: 10,
      y: 20,
      width: 200,
      height: 100,
      style: {
        fill: { type: "solid", color: "#333", opacity: 0.8 },
        radius: 8,
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates a rect with token fill", () => {
    const result = RectNodeSchema.safeParse({
      id: "rect2",
      type: "rect",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      style: { fill: "{effects.shadow}" },
    });
    expect(result.success).toBe(true);
  });
});

describe("TextNodeSchema", () => {
  it("validates a text node", () => {
    const result = TextNodeSchema.safeParse({
      id: "txt1",
      type: "text",
      x: 50,
      y: 50,
      width: 300,
      height: 100,
      text: "Hello World",
      style: {
        fontFamily: "Inter",
        fontWeight: 700,
        fontSize: 24,
        lineHeight: 28,
        color: "#FFFFFF",
        align: "left",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero fontSize", () => {
    const result = TextNodeSchema.safeParse({
      id: "txt1",
      type: "text",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      text: "Hi",
      style: { fontFamily: "Inter", fontSize: 0, color: "#000" },
    });
    expect(result.success).toBe(false);
  });
});

describe("SceneNodeSchema", () => {
  it("discriminates image nodes", () => {
    const result = SceneNodeSchema.safeParse({
      id: "n1",
      type: "image",
      assetId: "bg",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown node types", () => {
    const result = SceneNodeSchema.safeParse({
      id: "n1",
      type: "video",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("ArtboardSceneSchema", () => {
  it("validates a full artboard scene", () => {
    const result = ArtboardSceneSchema.safeParse({
      id: "artboard.1",
      type: "artboard",
      name: "Test Board",
      width: 1080,
      height: 1080,
      unit: "px",
      children: [
        {
          id: "child1",
          type: "rect",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          style: { fill: { type: "solid", color: "#000" } },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects artboard with negative width", () => {
    const result = ArtboardSceneSchema.safeParse({
      id: "artboard.bad",
      type: "artboard",
      name: "Bad",
      width: -1,
      height: 100,
      unit: "px",
      children: [],
    });
    expect(result.success).toBe(false);
  });
});
