import type { ReflowPreset } from "./types";

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Computes a human-readable aspect ratio string from pixel dimensions.
 * Uses GCD reduction for clean ratios (e.g. 1920×1080 → "16:9").
 * Falls back to decimal notation when the reduced form has large numbers
 * (e.g. 728×90 → "8.09:1").
 */
export function computeAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "";

  const d = gcd(width, height);
  const rw = width / d;
  const rh = height / d;

  if (rw <= 100 && rh <= 100) {
    return `${rw}:${rh}`;
  }

  const ratio = width / height;
  if (ratio >= 1) {
    return `${+ratio.toFixed(2)}:1`;
  }
  return `1:${+(1 / ratio).toFixed(2)}`;
}

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
    aspectRatio: "8.09:1",
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
