import { create } from "zustand";
import type { ReflowPreset } from "./types";
import { computeAspectRatio } from "./presets";

type CustomPresetsStore = {
  customPresets: ReflowPreset[];
  addPreset: (name: string, width: number, height: number) => ReflowPreset;
  removePreset: (id: string) => void;
  hasPreset: (width: number, height: number) => boolean;
};

export const useCustomPresetsStore = create<CustomPresetsStore>((set, get) => ({
  customPresets: [],

  addPreset: (name, width, height) => {
    const id = `custom-${width}x${height}-${Date.now()}`;
    const preset: ReflowPreset = {
      id,
      name,
      width,
      height,
      aspectRatio: computeAspectRatio(width, height),
    };
    set((state) => ({
      customPresets: [...state.customPresets, preset],
    }));
    return preset;
  },

  removePreset: (id) => {
    set((state) => ({
      customPresets: state.customPresets.filter((p) => p.id !== id),
    }));
  },

  hasPreset: (width, height) => {
    return get().customPresets.some(
      (p) => p.width === width && p.height === height,
    );
  },
}));
