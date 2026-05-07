import { Application } from "pixi.js";
import type {
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "../package/types";
import { renderArtboardToPixiApp } from "./renderArtboard";

export async function exportArtboardToPng(params: {
  scene: ArtboardScene;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
}) {
  const { scene, assets, tokens } = params;

  const app = new Application();

  await app.init({
    width: scene.width,
    height: scene.height,
    backgroundAlpha: 0,
    antialias: true,
    resolution: 1,
    autoDensity: true,
    preference: "webgl",
  });

  await renderArtboardToPixiApp({
    app,
    scene,
    assets,
    tokens,
  });

  const canvas = app.canvas;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Failed to create PNG blob"));
        return;
      }

      resolve(result);
    }, "image/png");
  });

  app.destroy(true);

  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}
