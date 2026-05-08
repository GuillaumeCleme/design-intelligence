import type { ReflowPreset } from "./types";

export const REFLOW_PRESETS: ReflowPreset[] = [
  {
    id: "square-1080",
    name: "Square Social",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
  },
  {
    id: "wide-1920",
    name: "Wide Display",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
  },
  {
    id: "portrait-1080",
    name: "Portrait Social",
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
  },
  {
    id: "story-1080",
    name: "Story / Vertical",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
  },
  {
    id: "leaderboard-728",
    name: "Leaderboard",
    width: 728,
    height: 90,
    aspectRatio: "728:90",
  },
  {
    id: "half-page-300",
    name: "Half Page",
    width: 300,
    height: 600,
    aspectRatio: "1:2",
  },
];

export function findPresetById(id: string): ReflowPreset | undefined {
  return REFLOW_PRESETS.find((p) => p.id === id);
}
