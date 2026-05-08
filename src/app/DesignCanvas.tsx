import type {
  ArtboardManifestEntry,
  ArtboardScene,
  AssetManifestEntry,
  SceneNode,
  Tokens,
} from "../package/types";
import { ArtboardPreview } from "./ArtboardPreview";
import { SelectionOverlay } from "@/editor/SelectionOverlay";
import { cn } from "@/lib/utils";

type Props = {
  manifestArtboards: ArtboardManifestEntry[];
  scenes: Record<string, ArtboardScene>;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
  selectedArtboardId?: string;
  zoom: number;
  onSelectArtboard: (id: string) => void;
  onUpdateNode: (artboardId: string, nodeId: string, patch: Partial<SceneNode>) => void;
};

export function DesignCanvas({
  manifestArtboards,
  scenes,
  assets,
  tokens,
  selectedArtboardId,
  zoom,
  onSelectArtboard,
  onUpdateNode,
}: Props) {
  return (
    <div className="w-full h-full overflow-auto bg-[#1a1a1a]">
      <div
        className="relative"
        style={{
          width: 3400 * zoom,
          height: 1400 * zoom,
          transformOrigin: "top left",
          margin: "60px auto",
          minWidth: "fit-content",
        }}
      >
        {manifestArtboards.map((artboard) => {
          const isSelected = selectedArtboardId === artboard.id;
          const shouldHydrate = isSelected || zoom > 0.3;
          const scene = scenes[artboard.id];

          return (
            <div
              key={artboard.id}
              className="absolute overflow-visible"
              style={{
                left: (artboard.x ?? 0) * zoom,
                top: (artboard.y ?? 0) * zoom,
                width: artboard.width * zoom,
                height: artboard.height * zoom,
              }}
            >
              {/* Artboard clickable container */}
              <button
                onClick={() => onSelectArtboard(artboard.id)}
                className={cn(
                  "absolute inset-0 p-0 cursor-pointer transition-shadow",
                  isSelected
                    ? "ring-2 ring-ring shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    : "ring-1 ring-border/50 hover:ring-border",
                )}
                style={{
                  background: "transparent",
                  border: "none",
                }}
              >
                {shouldHydrate && scene ? (
                  <ArtboardPreview
                    scene={scene}
                    assets={assets}
                    tokens={tokens}
                    scale={zoom}
                  />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      {artboard.name}
                    </span>
                  </div>
                )}
              </button>

              {/* Selection overlay — only for selected artboard, above the canvas */}
              {isSelected && scene && (
                <div className="absolute inset-0 z-10">
                  <SelectionOverlay
                    scene={scene}
                    scale={zoom}
                    onUpdateNode={onUpdateNode}
                  />
                </div>
              )}

              {/* Artboard label */}
              <div
                className="absolute -top-6 left-0 text-xs text-muted-foreground font-medium whitespace-nowrap pointer-events-none"
                style={{ fontSize: Math.max(10, 12 * zoom) }}
              >
                {artboard.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
