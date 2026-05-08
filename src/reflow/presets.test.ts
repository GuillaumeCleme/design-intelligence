import { describe, it, expect } from "vitest";
import { REFLOW_PRESETS, findPresetById, computeAspectRatio } from "./presets";

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

describe("computeAspectRatio", () => {
  it("computes 1:1 for equal dimensions", () => {
    expect(computeAspectRatio(1080, 1080)).toBe("1:1");
  });

  it("computes 16:9 for 1920×1080", () => {
    expect(computeAspectRatio(1920, 1080)).toBe("16:9");
  });

  it("computes 9:16 for 1080×1920", () => {
    expect(computeAspectRatio(1080, 1920)).toBe("9:16");
  });

  it("computes 4:5 for 1080×1350", () => {
    expect(computeAspectRatio(1080, 1350)).toBe("4:5");
  });

  it("computes 1:2 for 300×600", () => {
    expect(computeAspectRatio(300, 600)).toBe("1:2");
  });

  it("uses decimal fallback for large unreducible ratios", () => {
    expect(computeAspectRatio(728, 90)).toBe("8.09:1");
  });

  it("handles small dimensions", () => {
    expect(computeAspectRatio(3, 4)).toBe("3:4");
    expect(computeAspectRatio(2, 1)).toBe("2:1");
  });

  it("returns empty string for zero or negative dimensions", () => {
    expect(computeAspectRatio(0, 100)).toBe("");
    expect(computeAspectRatio(100, 0)).toBe("");
    expect(computeAspectRatio(-1, 100)).toBe("");
  });

  it("handles common ad sizes", () => {
    expect(computeAspectRatio(300, 250)).toBe("6:5");
    expect(computeAspectRatio(320, 50)).toBe("32:5");
    expect(computeAspectRatio(160, 600)).toBe("4:15");
  });
});
