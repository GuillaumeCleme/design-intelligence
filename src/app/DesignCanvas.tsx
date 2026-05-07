import type {
  ArtboardManifestEntry,
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "../package/types";
import { ArtboardPreview } from "./ArtboardPreview";

type Props = {
  manifestArtboards: ArtboardManifestEntry[];
  scenes: Record<string, ArtboardScene>;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
  selectedArtboardId?: string;
  zoom: number;
  onSelectArtboard: (id: string) => void;
};

export function DesignCanvas({
  manifestArtboards,
  scenes,
  assets,
  tokens,
  selectedArtboardId,
  zoom,
  onSelectArtboard,
}: Props) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "auto",
        background: "#2b2b2b",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 3400 * zoom,
          height: 1400 * zoom,
          transformOrigin: "top left",
        }}
      >
        {manifestArtboards.map((artboard) => {
          const isSelected = selectedArtboardId === artboard.id;
          const shouldHydrate = isSelected || zoom > 0.3;
          const scene = scenes[artboard.id];

          return (
            <button
              key={artboard.id}
              onClick={() => onSelectArtboard(artboard.id)}
              style={{
                position: "absolute",
                left: (artboard.x ?? 0) * zoom,
                top: (artboard.y ?? 0) * zoom,
                width: artboard.width * zoom,
                height: artboard.height * zoom,
                border: isSelected ? "4px solid #3b82f6" : "1px solid #555",
                padding: 0,
                background: "transparent",
                cursor: "pointer",
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
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#111",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "system-ui",
                  }}
                >
                  {artboard.name}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
