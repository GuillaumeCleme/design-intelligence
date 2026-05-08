import { describe, it, expect } from "vitest";
import { resolveTokenPath, resolveColor, resolvePaint, resolveTextStyle } from "./tokenResolver";
import type { Tokens, Paint } from "@/package/types";

const mockTokens: Tokens = {
  colors: {
    white: "#FFFFFF",
    yellow: "#FFD21F",
    darkGrey: "#1E1E1E",
    overlayBlack: "#000000",
  },
  fonts: {
    headline: { fontFamily: "Inter", fontWeight: 700, assetId: "font.inter.bold" },
    secondary: { fontFamily: "Roboto", fontWeight: 400 },
  },
  effects: {
    shadow: {
      type: "linear-gradient",
      angle: 270,
      stops: [
        { offset: 0, color: "#000000", opacity: 0.8 },
        { offset: 1, color: "#000000", opacity: 0.1 },
      ],
    },
  },
};

describe("resolveTokenPath", () => {
  it("resolves a simple color token", () => {
    expect(resolveTokenPath("{colors.white}", mockTokens)).toBe("#FFFFFF");
  });

  it("resolves a nested font token", () => {
    expect(resolveTokenPath("{fonts.headline.fontFamily}", mockTokens)).toBe("Inter");
  });

  it("returns the value as-is if not a token reference", () => {
    expect(resolveTokenPath("#FF0000", mockTokens)).toBe("#FF0000");
  });

  it("throws on unresolvable token path", () => {
    expect(() => resolveTokenPath("{colors.nonexistent}", mockTokens)).toThrow(
      "Unable to resolve token"
    );
  });

  it("resolves effects token", () => {
    const result = resolveTokenPath("{effects.shadow}", mockTokens) as Paint;
    expect(result.type).toBe("linear-gradient");
  });
});

describe("resolveColor", () => {
  it("resolves a token reference to a color", () => {
    expect(resolveColor("{colors.yellow}", mockTokens)).toBe("#FFD21F");
  });

  it("returns literal hex colors unchanged", () => {
    expect(resolveColor("#123456", mockTokens)).toBe("#123456");
  });
});

describe("resolvePaint", () => {
  it("returns undefined for undefined input", () => {
    expect(resolvePaint(undefined, mockTokens)).toBeUndefined();
  });

  it("resolves a string token to a paint object", () => {
    const result = resolvePaint("{effects.shadow}", mockTokens);
    expect(result).toBeDefined();
    expect(result!.type).toBe("linear-gradient");
  });

  it("resolves solid paint with token color", () => {
    const paint: Paint = { type: "solid", color: "{colors.darkGrey}", opacity: 0.9 };
    const result = resolvePaint(paint, mockTokens);
    expect(result).toEqual({ type: "solid", color: "#1E1E1E", opacity: 0.9 });
  });

  it("resolves linear-gradient with token colors in stops", () => {
    const paint: Paint = {
      type: "linear-gradient",
      angle: 90,
      stops: [
        { offset: 0, color: "{colors.overlayBlack}", opacity: 1 },
        { offset: 1, color: "{colors.white}", opacity: 0.5 },
      ],
    };
    const result = resolvePaint(paint, mockTokens);
    expect(result).toEqual({
      type: "linear-gradient",
      angle: 90,
      stops: [
        { offset: 0, color: "#000000", opacity: 1 },
        { offset: 1, color: "#FFFFFF", opacity: 0.5 },
      ],
    });
  });
});

describe("resolveTextStyle", () => {
  it("resolves fontFamily and color tokens", () => {
    const style = {
      fontFamily: "{fonts.headline.fontFamily}",
      fontSize: 24,
      color: "{colors.yellow}",
    };
    const result = resolveTextStyle(style, mockTokens);
    expect(result.fontFamily).toBe("Inter");
    expect(result.color).toBe("#FFD21F");
    expect(result.fontSize).toBe(24);
  });
});
