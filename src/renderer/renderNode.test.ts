import { describe, it, expect, vi } from "vitest";

vi.mock("./renderImageNode", () => ({
  renderImageNode: vi.fn(async () => ({ type: "image-result" })),
}));
vi.mock("./renderRectNode", () => ({
  renderRectNode: vi.fn(() => ({ type: "rect-result" })),
}));
vi.mock("./renderTextNode", () => ({
  renderTextNode: vi.fn(() => ({ type: "text-result" })),
}));

import { renderNode } from "./renderNode";
import type { Tokens } from "@/package/types";

const tokens: Tokens = { colors: {}, fonts: {}, effects: {} };
const assets = {};

describe("renderNode", () => {
  it("delegates image nodes to renderImageNode", async () => {
    const result = await renderNode({
      node: { id: "n1", type: "image", assetId: "bg", x: 0, y: 0, width: 100, height: 100 },
      assets,
      tokens,
    });
    expect(result).toEqual({ type: "image-result" });
  });

  it("delegates rect nodes to renderRectNode", async () => {
    const result = await renderNode({
      node: { id: "n2", type: "rect", x: 0, y: 0, width: 50, height: 50, style: {} },
      assets,
      tokens,
    });
    expect(result).toEqual({ type: "rect-result" });
  });

  it("delegates text nodes to renderTextNode", async () => {
    const result = await renderNode({
      node: {
        id: "n3",
        type: "text",
        x: 0,
        y: 0,
        width: 200,
        height: 50,
        text: "Hi",
        style: { fontFamily: "Inter", fontSize: 16, color: "#000" },
      },
      assets,
      tokens,
    });
    expect(result).toEqual({ type: "text-result" });
  });

  it("returns null for unknown node types", async () => {
    const result = await renderNode({
      node: { id: "n4", type: "unknown" as "text", x: 0, y: 0, width: 10, height: 10, text: "", style: { fontFamily: "", fontSize: 1, color: "" } },
      assets,
      tokens,
    });
    expect(result).toBeNull();
  });
});
