import { Application } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import type {
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "../package/types";
import { renderArtboardToPixiApp } from "../renderer/renderArtboard";

type Props = {
  scene: ArtboardScene;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
  scale?: number;
};

export function ArtboardPreview({ scene, assets, tokens, scale = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application();

    let destroyed = false;

    async function init() {
      try {
        await app.init({
          width: scene.width,
          height: scene.height,
          backgroundAlpha: 0,
          antialias: true,
          resolution: 1,
          autoDensity: true,
        });

        if (destroyed || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(app.canvas);

        app.canvas.style.width = `${scene.width * scale}px`;
        app.canvas.style.height = `${scene.height * scale}px`;

        await renderArtboardToPixiApp({
          app,
          scene,
          assets,
          tokens,
        });
      } catch (err) {
        if (!destroyed) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      try {
        app.destroy(true);
      } catch {
        // ignore destroy errors
      }
    };
  }, [scene, assets, tokens, scale]);

  if (error) {
    return (
      <div
        style={{
          width: scene.width * scale,
          height: scene.height * scale,
          overflow: "hidden",
          background: "#1e1e1e",
          color: "#ff6b6b",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui",
          fontSize: 12,
          padding: 8,
        }}
      >
        Render error: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: scene.width * scale,
        height: scene.height * scale,
        overflow: "hidden",
        background: "#1e1e1e",
      }}
    />
  );
}
