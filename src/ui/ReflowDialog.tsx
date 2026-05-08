import * as Dialog from "@radix-ui/react-dialog";
import { X, Scaling, Plus, Trash2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { REFLOW_PRESETS, computeAspectRatio } from "@/reflow/presets";
import { useCustomPresetsStore } from "@/reflow/store";
import type { ArtboardManifestEntry, ArtboardScene } from "@/package/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artboards: ArtboardManifestEntry[];
  scenes: Record<string, ArtboardScene>;
  selectedArtboardId: string;
  onReflow: (sourceArtboardId: string, targetWidth: number, targetHeight: number) => void;
};

export function ReflowDialog({
  open,
  onOpenChange,
  artboards,
  scenes,
  selectedArtboardId,
  onReflow,
}: Props) {
  const [sourceId, setSourceId] = useState(selectedArtboardId);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [customName, setCustomName] = useState("");

  const { customPresets, addPreset, removePreset, hasPreset } = useCustomPresetsStore();

  const sourceScene = scenes[sourceId];

  const allPresets = useMemo(() => {
    return [...REFLOW_PRESETS, ...customPresets];
  }, [customPresets]);

  const availablePresets = useMemo(() => {
    if (!sourceScene) return allPresets;
    return allPresets.filter(
      (p) => p.width !== sourceScene.width || p.height !== sourceScene.height,
    );
  }, [sourceScene, allPresets]);

  const parsedCustomWidth = parseInt(customWidth, 10);
  const parsedCustomHeight = parseInt(customHeight, 10);
  const hasValidCustomSize = parsedCustomWidth > 0 && parsedCustomHeight > 0;

  const customAspectRatio = useMemo(() => {
    if (!hasValidCustomSize) return "";
    return computeAspectRatio(parsedCustomWidth, parsedCustomHeight);
  }, [hasValidCustomSize, parsedCustomWidth, parsedCustomHeight]);

  const targetSize = useMemo(() => {
    if (selectedPresetId) {
      const preset = allPresets.find((p) => p.id === selectedPresetId);
      if (preset) return { width: preset.width, height: preset.height };
    }
    if (hasValidCustomSize) return { width: parsedCustomWidth, height: parsedCustomHeight };
    return null;
  }, [selectedPresetId, hasValidCustomSize, parsedCustomWidth, parsedCustomHeight, allPresets]);

  const targetAspectRatio = useMemo(() => {
    if (!targetSize) return "";
    return computeAspectRatio(targetSize.width, targetSize.height);
  }, [targetSize]);

  const canSaveAsPreset = useMemo(() => {
    if (!hasValidCustomSize) return false;
    if (hasPreset(parsedCustomWidth, parsedCustomHeight)) return false;
    return !REFLOW_PRESETS.some(
      (p) => p.width === parsedCustomWidth && p.height === parsedCustomHeight,
    );
  }, [hasValidCustomSize, parsedCustomWidth, parsedCustomHeight, hasPreset]);

  const handleReflow = useCallback(() => {
    if (!targetSize || !sourceId) return;
    onReflow(sourceId, targetSize.width, targetSize.height);
    onOpenChange(false);
  }, [targetSize, sourceId, onReflow, onOpenChange]);

  const handleSavePreset = useCallback(() => {
    if (!hasValidCustomSize) return;
    const name = customName.trim() || `Custom ${parsedCustomWidth}×${parsedCustomHeight}`;
    const preset = addPreset(name, parsedCustomWidth, parsedCustomHeight);
    setSelectedPresetId(preset.id);
    setCustomWidth("");
    setCustomHeight("");
    setCustomName("");
  }, [hasValidCustomSize, parsedCustomWidth, parsedCustomHeight, customName, addPreset]);

  const builtinPresets = availablePresets.filter(
    (p) => !customPresets.some((cp) => cp.id === p.id),
  );
  const userPresets = availablePresets.filter((p) =>
    customPresets.some((cp) => cp.id === p.id),
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-[calc(100%-2rem)] max-w-[36rem] rounded-2xl border border-border bg-card p-6 shadow-2xl",
            "animate-in fade-in-0 zoom-in-95",
            "overflow-hidden",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand/15">
                <Scaling className="h-4 w-4 text-brand" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-heading">
                Reflow Artboard
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-text hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-text mb-4">
            Reflow elements from a source artboard into a new target size.
            Elements are intelligently repositioned based on their anchor regions.
          </Dialog.Description>

          {/* Source artboard */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-subheading mb-1.5">
              Source Artboard
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              {artboards.map((ab) => (
                <option key={ab.id} value={ab.id}>
                  {ab.name} ({ab.width}×{ab.height})
                </option>
              ))}
            </select>
          </div>

          {/* Preset grid */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-subheading mb-1.5">
              Target Size
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {builtinPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setCustomWidth("");
                    setCustomHeight("");
                  }}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-left transition-colors",
                    selectedPresetId === preset.id
                      ? "border-brand bg-brand/10 ring-1 ring-brand/40"
                      : "border-border hover:border-brand/30 hover:bg-secondary",
                  )}
                >
                  <div className="text-xs font-medium text-foreground truncate">{preset.name}</div>
                  <div className="text-[11px] text-text">
                    {preset.width}×{preset.height}
                  </div>
                  <div className="text-[11px] text-brand font-medium">{preset.aspectRatio}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom presets */}
          {userPresets.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-subheading mb-1.5">
                Custom Sizes
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {userPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 transition-colors flex items-start gap-1",
                      selectedPresetId === preset.id
                        ? "border-brand bg-brand/10 ring-1 ring-brand/40"
                        : "border-border hover:border-brand/30 hover:bg-secondary",
                    )}
                  >
                    <button
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setCustomWidth("");
                        setCustomHeight("");
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="text-xs font-medium text-foreground truncate">{preset.name}</div>
                      <div className="text-[11px] text-text">
                        {preset.width}×{preset.height}
                      </div>
                      <div className="text-[11px] text-brand font-medium">{preset.aspectRatio}</div>
                    </button>
                    <button
                      onClick={() => {
                        removePreset(preset.id);
                        if (selectedPresetId === preset.id) setSelectedPresetId(null);
                      }}
                      className="p-0.5 rounded hover:bg-destructive/20 text-text hover:text-destructive transition-colors shrink-0 mt-0.5"
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom size input */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-subheading mb-1.5">
              Custom Dimensions
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Width"
                min={1}
                value={customWidth}
                onChange={(e) => {
                  setCustomWidth(e.target.value);
                  setSelectedPresetId(null);
                }}
                className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text/50 focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
              <span className="text-text text-sm shrink-0">×</span>
              <input
                type="number"
                placeholder="Height"
                min={1}
                value={customHeight}
                onChange={(e) => {
                  setCustomHeight(e.target.value);
                  setSelectedPresetId(null);
                }}
                className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text/50 focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
              {hasValidCustomSize && (
                <span className="text-brand text-xs font-medium shrink-0">
                  {customAspectRatio}
                </span>
              )}
            </div>

            {/* Save as preset row */}
            {canSaveAsPreset && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Preset name (optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-text/50 focus:outline-none focus:ring-1 focus:ring-brand/50"
                />
                <button
                  onClick={handleSavePreset}
                  className="flex items-center gap-1 shrink-0 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/20 transition-colors"
                  title="Save as preset"
                >
                  <Plus className="h-3 w-3" />
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={handleReflow}
            disabled={!targetSize}
            className={cn(
              "w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              targetSize
                ? "bg-brand text-brand-foreground hover:bg-brand/90"
                : "bg-muted text-text cursor-not-allowed",
            )}
          >
            {targetSize
              ? `Reflow to ${targetSize.width}×${targetSize.height} (${targetAspectRatio})`
              : "Select a target size"}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
