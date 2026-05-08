import { describe, it, expect, beforeEach } from "vitest";
import {
  reflowArtboard,
  listPresets,
  listBuiltinPresets,
  listCustomPresets,
  resolvePreset,
  addCustomPreset,
  removeCustomPreset,
} from "./api";
import { useCustomPresetsStore } from "./store";
import { REFLOW_PRESETS } from "./presets";
import type { ArtboardScene, ImageNode, RectNode, TextNode } from "@/package/types";

const testScene: ArtboardScene = {
  id: "test.square",
  type: "artboard",
  name: "Test Square",
  width: 1080,
  height: 1080,
  unit: "px",
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
    } satisfies ImageNode,
    {
      id: "panel",
      type: "rect",
      x: 72,
      y: 520,
      width: 430,
      height: 310,
      style: { fill: { type: "solid", color: "#1E1E1E" }, radius: 28 },
    } satisfies RectNode,
    {
      id: "headline",
      type: "text",
      x: 112,
      y: 660,
      width: 350,
      height: 150,
      text: "HELLO",
      style: {
        fontFamily: "Inter",
        fontSize: 52,
        color: "#FFD21F",
      },
    } satisfies TextNode,
  ],
};

const scenes: Record<string, ArtboardScene> = {
  "test.square": testScene,
};

describe("reflowArtboard", () => {
  it("reflows by pixel dimensions", () => {
    const result = reflowArtboard(
      {
        sourceArtboardId: "test.square",
        targetWidth: 1080,
        targetHeight: 1920,
      },
      scenes,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.scene.width).toBe(1080);
    expect(result.scene.height).toBe(1920);
    expect(result.aspectRatio).toBe("9:16");
    expect(result.scene.children).toHaveLength(3);
  });

  it("reflows by preset ID", () => {
    const result = reflowArtboard(
      {
        sourceArtboardId: "test.square",
        presetId: "wide-1920",
      },
      scenes,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.scene.width).toBe(1920);
    expect(result.scene.height).toBe(1080);
    expect(result.aspectRatio).toBe("16:9");
  });

  it("returns error for missing source artboard", () => {
    const result = reflowArtboard(
      {
        sourceArtboardId: "nonexistent",
        targetWidth: 500,
        targetHeight: 500,
      },
      scenes,
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("not found");
  });

  it("returns error for invalid preset", () => {
    const result = reflowArtboard(
      {
        sourceArtboardId: "test.square",
        presetId: "nonexistent-preset",
      },
      scenes,
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("Preset not found");
  });

  it("returns error when neither preset nor dimensions provided", () => {
    const result = reflowArtboard(
      {
        sourceArtboardId: "test.square",
      },
      scenes,
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("must be provided");
  });

  it("returns error for negative dimensions", () => {
    const result = reflowArtboard(
      {
        sourceArtboardId: "test.square",
        targetWidth: -100,
        targetHeight: 500,
      },
      scenes,
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("Invalid dimensions");
  });

  it("accepts custom artboard id and name", () => {
    const result = reflowArtboard(
      {
        sourceArtboardId: "test.square",
        targetWidth: 600,
        targetHeight: 800,
        newArtboardId: "custom.id",
        newArtboardName: "My Custom",
      },
      scenes,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.scene.id).toBe("custom.id");
    expect(result.scene.name).toBe("My Custom");
  });

  it("includes classification data", () => {
    const result = reflowArtboard(
      {
        sourceArtboardId: "test.square",
        targetWidth: 1080,
        targetHeight: 1920,
      },
      scenes,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.classifications).toHaveLength(3);
    expect(result.classifications[0].role).toBe("full-bleed");
    expect(result.classifications[1].role).toBe("content");
  });
});

describe("preset management API", () => {
  beforeEach(() => {
    useCustomPresetsStore.setState({ customPresets: [] });
  });

  it("listPresets returns built-in presets", () => {
    const presets = listPresets();
    expect(presets.length).toBe(REFLOW_PRESETS.length);
  });

  it("listPresets includes custom presets", () => {
    addCustomPreset({ name: "Test", width: 400, height: 300 });
    const presets = listPresets();
    expect(presets.length).toBe(REFLOW_PRESETS.length + 1);
  });

  it("listBuiltinPresets returns only built-in", () => {
    addCustomPreset({ name: "Test", width: 400, height: 300 });
    const builtins = listBuiltinPresets();
    expect(builtins.length).toBe(REFLOW_PRESETS.length);
  });

  it("listCustomPresets returns only custom", () => {
    addCustomPreset({ name: "A", width: 100, height: 200 });
    addCustomPreset({ name: "B", width: 300, height: 400 });
    const custom = listCustomPresets();
    expect(custom.length).toBe(2);
    expect(custom[0].name).toBe("A");
    expect(custom[1].name).toBe("B");
  });

  it("resolvePreset finds built-in presets", () => {
    const preset = resolvePreset("square-1080");
    expect(preset).toBeDefined();
    expect(preset!.width).toBe(1080);
  });

  it("resolvePreset finds custom presets", () => {
    const created = addCustomPreset({ name: "Custom", width: 777, height: 555 });
    expect("id" in created).toBe(true);
    if (!("id" in created)) return;

    const found = resolvePreset(created.id);
    expect(found).toBeDefined();
    expect(found!.width).toBe(777);
  });

  it("addCustomPreset validates dimensions", () => {
    const result = addCustomPreset({ name: "Bad", width: 0, height: 100 });
    expect("success" in result && result.success === false).toBe(true);
  });

  it("addCustomPreset computes aspect ratio", () => {
    const result = addCustomPreset({ name: "Wide", width: 1600, height: 900 });
    expect("aspectRatio" in result).toBe(true);
    if (!("aspectRatio" in result)) return;
    expect(result.aspectRatio).toBe("16:9");
  });

  it("removeCustomPreset removes by id", () => {
    const created = addCustomPreset({ name: "Temp", width: 500, height: 500 });
    expect("id" in created).toBe(true);
    if (!("id" in created)) return;

    expect(removeCustomPreset(created.id)).toBe(true);
    expect(listCustomPresets()).toHaveLength(0);
  });

  it("removeCustomPreset returns false for unknown id", () => {
    expect(removeCustomPreset("nonexistent")).toBe(false);
  });

  it("reflowArtboard works with custom preset", () => {
    const created = addCustomPreset({ name: "Email", width: 600, height: 800 });
    expect("id" in created).toBe(true);
    if (!("id" in created)) return;

    const result = reflowArtboard(
      {
        sourceArtboardId: "test.square",
        presetId: created.id,
      },
      scenes,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.scene.width).toBe(600);
    expect(result.scene.height).toBe(800);
  });
});
