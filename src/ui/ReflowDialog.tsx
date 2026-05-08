import * as Dialog from "@radix-ui/react-dialog";
import { X, Scaling } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { REFLOW_PRESETS } from "@/reflow/presets";
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

  const sourceScene = scenes[sourceId];

  const availablePresets = useMemo(() => {
    if (!sourceScene) return REFLOW_PRESETS;
    return REFLOW_PRESETS.filter(
      (p) => p.width !== sourceScene.width || p.height !== sourceScene.height,
    );
  }, [sourceScene]);

  const targetSize = useMemo(() => {
    if (selectedPresetId) {
      const preset = REFLOW_PRESETS.find((p) => p.id === selectedPresetId);
      if (preset) return { width: preset.width, height: preset.height };
    }
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (w > 0 && h > 0) return { width: w, height: h };
    return null;
  }, [selectedPresetId, customWidth, customHeight]);

  const handleReflow = () => {
    if (!targetSize || !sourceId) return;
    onReflow(sourceId, targetSize.width, targetSize.height);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl",
            "animate-in fade-in-0 zoom-in-95",
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

          {/* Preset grid */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Target Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availablePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setCustomWidth("");
                    setCustomHeight("");
                  }}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors",
                    selectedPresetId === preset.id
                      ? "border-brand bg-brand/10 text-foreground"
                      : "border-border hover:border-border/80 hover:bg-accent/50 text-muted-foreground",
                  )}
                >
                  <span className="text-sm font-medium">{preset.name}</span>
                  <span className="text-xs opacity-70">
                    {preset.width}×{preset.height} ({preset.aspectRatio})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom size */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Custom Size
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
          </div>

          {/* Action */}
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
              ? `Reflow to ${targetSize.width}×${targetSize.height}`
              : "Select a target size"}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
