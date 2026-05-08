import { describe, it, expect, beforeEach } from "vitest";
import { useCustomPresetsStore } from "./store";

describe("useCustomPresetsStore", () => {
  beforeEach(() => {
    useCustomPresetsStore.setState({ customPresets: [] });
  });

  it("starts with an empty list", () => {
    expect(useCustomPresetsStore.getState().customPresets).toEqual([]);
  });

  it("adds a custom preset", () => {
    const preset = useCustomPresetsStore.getState().addPreset("My Banner", 800, 600);
    expect(preset.name).toBe("My Banner");
    expect(preset.width).toBe(800);
    expect(preset.height).toBe(600);
    expect(preset.aspectRatio).toBe("4:3");
    expect(preset.id).toContain("custom-800x600");

    const { customPresets } = useCustomPresetsStore.getState();
    expect(customPresets).toHaveLength(1);
    expect(customPresets[0]).toEqual(preset);
  });

  it("removes a custom preset by id", () => {
    const preset = useCustomPresetsStore.getState().addPreset("Temp", 500, 500);
    expect(useCustomPresetsStore.getState().customPresets).toHaveLength(1);

    useCustomPresetsStore.getState().removePreset(preset.id);
    expect(useCustomPresetsStore.getState().customPresets).toHaveLength(0);
  });

  it("hasPreset returns true for existing dimensions", () => {
    useCustomPresetsStore.getState().addPreset("Wide", 1600, 900);
    expect(useCustomPresetsStore.getState().hasPreset(1600, 900)).toBe(true);
  });

  it("hasPreset returns false for non-existing dimensions", () => {
    expect(useCustomPresetsStore.getState().hasPreset(999, 888)).toBe(false);
  });

  it("supports multiple custom presets", () => {
    useCustomPresetsStore.getState().addPreset("A", 100, 100);
    useCustomPresetsStore.getState().addPreset("B", 200, 300);
    useCustomPresetsStore.getState().addPreset("C", 400, 500);

    const { customPresets } = useCustomPresetsStore.getState();
    expect(customPresets).toHaveLength(3);
    expect(customPresets.map((p) => p.name)).toEqual(["A", "B", "C"]);
  });

  it("removing non-existent id does nothing", () => {
    useCustomPresetsStore.getState().addPreset("Keep", 100, 100);
    useCustomPresetsStore.getState().removePreset("nonexistent-id");
    expect(useCustomPresetsStore.getState().customPresets).toHaveLength(1);
  });
});
