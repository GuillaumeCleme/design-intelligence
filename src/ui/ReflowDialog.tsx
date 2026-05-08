import * as Dialog from "@radix-ui/react-dialog";
import { X, Scaling, Plus, Trash2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { REFLOW_PRESETS, computeAspectRatio } from "@/reflow/presets";
import { useCustomPresetsStore } from "@/reflow/store";
import type { ReflowPreset } from "@/reflow/types";
import type { ArtboardManifestEntry, ArtboardScene } from "@/package/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artboards: ArtboardManifestEntry[];
  scenes: Record<string, ArtboardScene>;
  selectedArtboardId: string;
  onReflow: (sourceArtboardId: string, targetWidth: number, targetHeight: number) => void;
};

function AspectRatioPreview({ width, height }: { width: number; height: number }) {
  const maxDim = 48;
  const ratio = width / height;
  let w: number;
  let h: number;
  if (ratio >= 1) {
    w = maxDim;
    h = maxDim / ratio;
  } else {
    h = maxDim;
    w = maxDim * ratio;
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: maxDim, height: maxDim }}
    >
      <div
        className="rounded-sm border border-brand/40 bg-brand/10"
        style={{ width: Math.max(4, w), height: Math.max(4, h) }}
      />
    </div>
  );
}

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
    const existsInBuiltin = REFLOW_PRESETS.some(
      (p) => p.width === parsedCustomWidth && p.height === parsedCustomHeight,
    );
    return !existsInBuiltin;
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
            "w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl",
            "animate-in fade-in-0 zoom-in-95",
            "max-h-[90vh] overflow-y-auto",
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand/15">
                <Scaling className="h-4 w-4 text-brand" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Reflow Artboard
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-muted-foreground mb-4">
            Reflow elements from a source artboard into a new target size. Elements are
            intelligently repositioned based on their anchor regions.
          </Dialog.Description>

          {/* Source artboard selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Source Artboard
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {artboards.map((ab) => (
                <option key={ab.id} value={ab.id}>
                  {ab.name} ({ab.width}×{ab.height})
                </option>
              ))}
            </select>
          </div>

          {/* Built-in preset grid */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Standard Sizes
            </label>
            <PresetGrid
              presets={builtinPresets}
              selectedId={selectedPresetId}
              onSelect={(id) => {
                setSelectedPresetId(id);
                setCustomWidth("");
                setCustomHeight("");
              }}
            />
          </div>

          {/* User custom presets */}
          {userPresets.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Custom Sizes
              </label>
              <div className="grid grid-cols-2 gap-2">
                {userPresets.map((preset) => (
                  <PresetButton
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedPresetId === preset.id}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setCustomWidth("");
                      setCustomHeight("");
                    }}
                    onRemove={() => {
                      removePreset(preset.id);
                      if (selectedPresetId === preset.id) setSelectedPresetId(null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom size input */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Enter Custom Size
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
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-muted-foreground text-sm">×</span>
              <input
                type="number"
                placeholder="Height"
                min={1}
                value={customHeight}
                onChange={(e) => {
                  setCustomHeight(e.target.value);
                  setSelectedPresetId(null);
                }}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Live aspect ratio feedback */}
            {hasValidCustomSize && (
              <div className="mt-2 flex items-center gap-3 rounded-lg bg-accent/30 px-3 py-2">
                <AspectRatioPreview width={parsedCustomWidth} height={parsedCustomHeight} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {parsedCustomWidth}×{parsedCustomHeight}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Aspect ratio: {customAspectRatio}
                  </div>
                </div>

                {/* Save as preset */}
                {canSaveAsPreset && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={handleSavePreset}
                      className="flex items-center gap-1 rounded-md bg-brand/15 px-2 py-1 text-xs font-medium text-brand hover:bg-brand/25 transition-colors"
                      title="Save as preset"
                    >
                      <Plus className="h-3 w-3" />
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action button with aspect ratio info */}
          <button
            onClick={handleReflow}
            disabled={!targetSize}
            className={cn(
              "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              targetSize
                ? "bg-brand text-white hover:bg-brand/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
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

function PresetGrid({
  presets,
  selectedId,
  onSelect,
}: {
  presets: ReflowPreset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset.id)}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
            selectedId === preset.id
              ? "border-brand bg-brand/10 text-foreground"
              : "border-border hover:border-border/80 hover:bg-accent/50 text-muted-foreground",
          )}
        >
          <AspectRatioPreview width={preset.width} height={preset.height} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{preset.name}</div>
            <div className="text-xs opacity-70">
              {preset.width}×{preset.height} ({preset.aspectRatio})
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function PresetButton({
  preset,
  isSelected,
  onClick,
  onRemove,
}: {
  preset: ReflowPreset;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors",
        isSelected
          ? "border-brand bg-brand/10 text-foreground"
          : "border-border hover:border-border/80 hover:bg-accent/50 text-muted-foreground",
      )}
    >
      <button onClick={onClick} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
        <AspectRatioPreview width={preset.width} height={preset.height} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{preset.name}</div>
          <div className="text-xs opacity-70">
            {preset.width}×{preset.height} ({preset.aspectRatio})
          </div>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors shrink-0"
        title="Remove preset"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
