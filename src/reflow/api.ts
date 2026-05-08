/**
 * Programmatic Reflow API
 *
 * This module provides agent-accessible functions for reflowing artboards
 * without requiring UI interaction. Agents can call these functions directly
 * to reflow content, manage custom presets, and query available sizes.
 *
 * Usage from an agent context:
 *
 *   import { reflowArtboard, listPresets, addCustomPreset } from "@/reflow/api";
 *
 *   // Reflow to a specific pixel size
 *   const result = reflowArtboard({
 *     sourceArtboardId: "artboard.square.1080",
 *     targetWidth: 1080,
 *     targetHeight: 1920,
 *   });
 *
 *   // Reflow using a preset
 *   const result = reflowArtboard({
 *     sourceArtboardId: "artboard.square.1080",
 *     presetId: "story-1080",
 *   });
 *
 *   // Add a custom preset for future use
 *   addCustomPreset({ name: "Email Banner", width: 600, height: 800 });
 */

import type { ArtboardScene } from "@/package/types";
import type { ReflowPreset, ReflowResult } from "./types";
import { reflowScene } from "./engine";
import { REFLOW_PRESETS, computeAspectRatio, findPresetById } from "./presets";
import { useCustomPresetsStore } from "./store";

export type ReflowArtboardParams = {
  sourceArtboardId: string;
  /** Target width in pixels. Required unless presetId is provided. */
  targetWidth?: number;
  /** Target height in pixels. Required unless presetId is provided. */
  targetHeight?: number;
  /** Preset ID to use instead of explicit dimensions. */
  presetId?: string;
  newArtboardId?: string;
  newArtboardName?: string;
};

export type ReflowApiResult = {
  success: true;
  scene: ArtboardScene;
  sourceArtboardId: string;
  targetWidth: number;
  targetHeight: number;
  aspectRatio: string;
  classifications: ReflowResult["classifications"];
};

export type ReflowApiError = {
  success: false;
  error: string;
};

/**
 * Reflow an artboard to a new size, specified either by pixel dimensions
 * or by a preset ID. Returns the new scene definition.
 *
 * The caller is responsible for adding the returned scene to the package
 * store and updating the manifest (see App.tsx handleReflow for reference).
 */
export function reflowArtboard(
  params: ReflowArtboardParams,
  scenes: Record<string, ArtboardScene>,
): ReflowApiResult | ReflowApiError {
  const sourceScene = scenes[params.sourceArtboardId];
  if (!sourceScene) {
    return {
      success: false,
      error: `Source artboard not found: ${params.sourceArtboardId}`,
    };
  }

  let targetWidth: number;
  let targetHeight: number;

  if (params.presetId) {
    const preset = resolvePreset(params.presetId);
    if (!preset) {
      return {
        success: false,
        error: `Preset not found: ${params.presetId}. Use listPresets() to see available presets.`,
      };
    }
    targetWidth = preset.width;
    targetHeight = preset.height;
  } else if (params.targetWidth && params.targetHeight) {
    targetWidth = params.targetWidth;
    targetHeight = params.targetHeight;
  } else {
    return {
      success: false,
      error: "Either presetId or both targetWidth and targetHeight must be provided.",
    };
  }

  if (targetWidth <= 0 || targetHeight <= 0) {
    return {
      success: false,
      error: `Invalid dimensions: ${targetWidth}×${targetHeight}. Both must be positive.`,
    };
  }

  const { scene, classifications } = reflowScene({
    sourceScene,
    targetWidth,
    targetHeight,
    newArtboardId: params.newArtboardId,
    newArtboardName: params.newArtboardName,
  });

  return {
    success: true,
    scene,
    sourceArtboardId: params.sourceArtboardId,
    targetWidth,
    targetHeight,
    aspectRatio: computeAspectRatio(targetWidth, targetHeight),
    classifications,
  };
}

/**
 * List all available presets (built-in + user-defined custom).
 */
export function listPresets(): ReflowPreset[] {
  const { customPresets } = useCustomPresetsStore.getState();
  return [...REFLOW_PRESETS, ...customPresets];
}

/**
 * List only the built-in presets.
 */
export function listBuiltinPresets(): ReflowPreset[] {
  return [...REFLOW_PRESETS];
}

/**
 * List only the user-defined custom presets.
 */
export function listCustomPresets(): ReflowPreset[] {
  return [...useCustomPresetsStore.getState().customPresets];
}

/**
 * Find a preset by ID. Searches built-in presets first, then custom.
 */
export function resolvePreset(presetId: string): ReflowPreset | undefined {
  const builtin = findPresetById(presetId);
  if (builtin) return builtin;

  const { customPresets } = useCustomPresetsStore.getState();
  return customPresets.find((p) => p.id === presetId);
}

/**
 * Add a custom preset. Returns the created preset (with generated ID and
 * computed aspect ratio). This preset will appear in the UI and in
 * listPresets() results.
 */
export function addCustomPreset(params: {
  name: string;
  width: number;
  height: number;
}): ReflowPreset | ReflowApiError {
  if (params.width <= 0 || params.height <= 0) {
    return {
      success: false,
      error: `Invalid dimensions: ${params.width}×${params.height}. Both must be positive.`,
    };
  }

  return useCustomPresetsStore.getState().addPreset(
    params.name,
    params.width,
    params.height,
  );
}

/**
 * Remove a custom preset by ID. Returns true if removed, false if not found.
 */
export function removeCustomPreset(presetId: string): boolean {
  const { customPresets } = useCustomPresetsStore.getState();
  const exists = customPresets.some((p) => p.id === presetId);
  if (!exists) return false;

  useCustomPresetsStore.getState().removePreset(presetId);
  return true;
}

/**
 * Compute the human-readable aspect ratio for given dimensions.
 * Useful for agents to preview what ratio a custom size will produce.
 */
export { computeAspectRatio } from "./presets";
