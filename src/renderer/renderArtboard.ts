import { Application, Container } from "pixi.js";
import type {
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "../package/types";
import { renderNode } from "./renderNode";

export async function renderArtboardToPixiApp(params: {
  app: Application;
  scene: ArtboardScene;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
}) {
  const { app, scene, assets, tokens } = params;

  app.stage.removeChildren();

  const artboard = new Container();
  artboard.label = scene.name;
  artboard.x = 0;
  artboard.y = 0;

  app.stage.addChild(artboard);

  for (const node of scene.children) {
    if (node.visible === false) continue;

    const displayObject = await renderNode({
      node,
      assets,
      tokens,
    });

    if (displayObject) {
      displayObject.alpha = node.opacity ?? 1;
      artboard.addChild(displayObject);
    }
  }

  return artboard;
}
