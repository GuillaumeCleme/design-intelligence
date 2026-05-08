import { describe, it, expect, vi } from "vitest";

const mockAnchor = { set: vi.fn() };

vi.mock("pixi.js", () => {
  class MockText {
    x = 0;
    y = 0;
    anchor = mockAnchor;
    text = "";
    constructor(opts: { text: string }) {
      this.text = opts.text;
    }
  }
  class MockTextStyle {
    constructor(public opts: unknown) {}
  }
  return {
    Text: MockText,
    TextStyle: MockTextStyle,
  };
});

import { renderTextNode } from "./renderTextNode";
import type { TextNode, Tokens } from "@/package/types";

const tokens: Tokens = {
  colors: { white: "#FFFFFF", yellow: "#FFD21F" },
  fonts: {
    headline: { fontFamily: "Inter", fontWeight: 700 },
  },
  effects: {},
};

describe("renderTextNode", () => {
  it("renders a basic text node at correct position", () => {
    const node: TextNode = {
      id: "t1",
      type: "text",
      x: 50,
      y: 100,
      width: 300,
      height: 80,
      text: "Hello World",
      style: {
        fontFamily: "Inter",
        fontSize: 32,
        color: "#FFFFFF",
      },
    };
    const result = renderTextNode({ node, tokens });
    expect(result).not.toBeNull();
    expect(result.x).toBe(50);
    expect(result.y).toBe(100);
  });

  it("resolves token references for fontFamily and color", () => {
    const node: TextNode = {
      id: "t2",
      type: "text",
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      text: "Token Test",
      style: {
        fontFamily: "{fonts.headline.fontFamily}",
        fontSize: 24,
        color: "{colors.yellow}",
      },
    };
    const result = renderTextNode({ node, tokens });
    expect(result).not.toBeNull();
  });

  it("applies uppercase textTransform", () => {
    const node: TextNode = {
      id: "t3",
      type: "text",
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      text: "lowercase text",
      style: {
        fontFamily: "Inter",
        fontSize: 18,
        color: "#000",
        textTransform: "uppercase",
      },
    };
    const result = renderTextNode({ node, tokens });
    expect(result.text).toBe("LOWERCASE TEXT");
  });

  it("handles right-aligned text", () => {
    mockAnchor.set.mockClear();
    const node: TextNode = {
      id: "t4",
      type: "text",
      x: 100,
      y: 50,
      width: 400,
      height: 80,
      text: "Right aligned",
      style: {
        fontFamily: "Inter",
        fontSize: 24,
        color: "#FFF",
        align: "right",
      },
    };
    const result = renderTextNode({ node, tokens });
    expect(result.x).toBe(500);
    expect(mockAnchor.set).toHaveBeenCalledWith(1, 0);
  });
});
