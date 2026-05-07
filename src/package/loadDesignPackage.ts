import JSZip from "jszip";
import { DesignPackageManifestSchema } from "../schema/designPackage.schema";
import { ArtboardSceneSchema } from "../schema/nodes.schema";
import type {
  ArtboardScene,
  DesignPackageManifest,
  Tokens,
} from "./types";

export async function loadDesignPackage(file: File) {
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file("manifest.json");

  if (!manifestFile) {
    throw new Error("Package missing manifest.json");
  }

  const manifestJson = await manifestFile.async("string");
  const manifest = DesignPackageManifestSchema.parse(
    JSON.parse(manifestJson)
  ) as DesignPackageManifest;

  const tokensFile = zip.file(manifest.tokens);

  if (!tokensFile) {
    throw new Error(`Package missing tokens file: ${manifest.tokens}`);
  }

  const tokensJson = await tokensFile.async("string");
  const tokens = JSON.parse(tokensJson) as Tokens;

  const scenes: Record<string, ArtboardScene> = {};

  for (const artboard of manifest.artboards) {
    const sceneFile = zip.file(artboard.path);

    if (!sceneFile) {
      throw new Error(`Package missing artboard scene: ${artboard.path}`);
    }

    const sceneJson = await sceneFile.async("string");

    scenes[artboard.id] = ArtboardSceneSchema.parse(
      JSON.parse(sceneJson)
    ) as ArtboardScene;
  }

  return {
    manifest,
    tokens,
    scenes,
  };
}
