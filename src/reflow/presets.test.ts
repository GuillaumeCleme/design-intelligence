import { describe, it, expect } from "vitest";
import { REFLOW_PRESETS, findPresetById } from "./presets";

describe("REFLOW_PRESETS", () => {
  it("contains expected presets", () => {
    const ids = REFLOW_PRESETS.map((p) => p.id);
    expect(ids).toContain("square-1080");
    expect(ids).toContain("wide-1920");
    expect(ids).toContain("portrait-1080");
    expect(ids).toContain("story-1080");
  });

  it("all presets have positive dimensions", () => {
    for (const preset of REFLOW_PRESETS) {
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    }
  });

  it("all presets have required fields", () => {
    for (const preset of REFLOW_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.aspectRatio).toBeTruthy();
    }
  });
});

describe("findPresetById", () => {
  it("finds existing preset", () => {
    const preset = findPresetById("square-1080");
    expect(preset).toBeDefined();
    expect(preset!.width).toBe(1080);
    expect(preset!.height).toBe(1080);
  });

  it("returns undefined for non-existent preset", () => {
    expect(findPresetById("nonexistent")).toBeUndefined();
  });
});
