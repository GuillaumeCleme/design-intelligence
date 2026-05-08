import { describe, it, expect } from "vitest";
import { validateSceneReferences } from "./validateScene";
import type { ArtboardScene, AssetManifestEntry, Tokens } from "./types";

const tokens: Tokens = {
  colors: { white: "#FFFFFF", yellow: "#FFD21F" },
  fonts: { heading: { fontFamily: "Inter", fontWeight: 700 } },
  effects: {
    gradient: {
      type: "linear-gradient",
      angle: 90,
      stops: [{ offset: 0, color: "#000", opacity: 1 }],
    },
  },
};

const assets: Record<string, AssetManifestEntry> = {
  "bg.image": { type: "image", mimeType: "image/jpeg", path: "assets/bg.jpg" },
  "logo.svg": { type: "vector", mimeType: "image/svg+xml", path: "assets/logo.svg" },
};

describe("validateSceneReferences", () => {
  it("returns no errors for a valid scene", () => {
    const scene: ArtboardScene = {
      id: "ab.1",
      type: "artboard",
      name: "Test",
      width: 1080,
      height: 1080,
      unit: "px",
      children: [
        {
          id: "img1",
          type: "image",
          assetId: "bg.image",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          fit: "cover",
        },
        {
          id: "txt1",
          type: "text",
          x: 0,
          y: 0,
          width: 200,
          height: 50,
          text: "Hello",
          style: {
            fontFamily: "{fonts.heading.fontFamily}",
            fontSize: 24,
            color: "{colors.white}",
          },
        },
      ],
    };

    const errors = validateSceneReferences({ scene, assets, tokens });
    expect(errors).toHaveLength(0);
  });

  it("reports missing asset reference", () => {
    const scene: ArtboardScene = {
      id: "ab.1",
      type: "artboard",
      name: "Test",
      width: 100,
      height: 100,
      unit: "px",
      children: [
        {
          id: "img1",
          type: "image",
          assetId: "nonexistent.asset",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      ],
    };

    const errors = validateSceneReferences({ scene, assets, tokens });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("nonexistent.asset");
  });

  it("reports duplicate node IDs", () => {
    const scene: ArtboardScene = {
      id: "ab.1",
      type: "artboard",
      name: "Test",
      width: 100,
      height: 100,
      unit: "px",
      children: [
        {
          id: "dup",
          type: "rect",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          style: { fill: { type: "solid", color: "#000" } },
        },
        {
          id: "dup",
          type: "rect",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          style: { fill: { type: "solid", color: "#FFF" } },
        },
      ],
    };

    const errors = validateSceneReferences({ scene, assets, tokens });
    expect(errors).toContain("Duplicate node ID: dup");
  });

  it("reports unresolvable token references", () => {
    const scene: ArtboardScene = {
      id: "ab.1",
      type: "artboard",
      name: "Test",
      width: 100,
      height: 100,
      unit: "px",
      children: [
        {
          id: "txt1",
          type: "text",
          x: 0,
          y: 0,
          width: 200,
          height: 50,
          text: "Hi",
          style: {
            fontFamily: "{fonts.nonexistent.fontFamily}",
            fontSize: 16,
            color: "{colors.missing}",
          },
        },
      ],
    };

    const errors = validateSceneReferences({ scene, assets, tokens });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("Unable to resolve token"))).toBe(true);
  });
});
