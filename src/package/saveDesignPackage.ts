import JSZip from "jszip";
import type {
  ArtboardScene,
  DesignPackageManifest,
  Tokens,
} from "./types";

export async function saveDesignPackage(params: {
  manifest: DesignPackageManifest;
  tokens: Tokens;
  scenes: Record<string, ArtboardScene>;
}) {
  const { manifest, tokens, scenes } = params;

  const zip = new JSZip();

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("tokens.json", JSON.stringify(tokens, null, 2));

  for (const artboard of manifest.artboards) {
    const scene = scenes[artboard.id];

    if (!scene) {
      throw new Error(`Missing scene for artboard: ${artboard.id}`);
    }

    zip.file(artboard.path, JSON.stringify(scene, null, 2));
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
  });
}
