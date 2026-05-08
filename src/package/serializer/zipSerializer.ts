import JSZip from "jszip";
import type { DesignPackageInstance } from "../types";

/**
 * Serialize a loaded DesignPackageInstance back to a .designpkg zip blob.
 * Reconstructs the full taxonomy structure inside the zip.
 */
export async function serializeToZip(
  instance: DesignPackageInstance
): Promise<Blob> {
  const zip = new JSZip();

  const manifest = {
    ...instance.manifest,
    modifiedAt: new Date().toISOString(),
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  zip.file(
    manifest.document,
    JSON.stringify(instance.document, null, 2)
  );

  zip.file(manifest.tokens, JSON.stringify(instance.tokens, null, 2));

  for (const artboard of manifest.artboards) {
    const scene = instance.scenes[artboard.id];
    if (scene) {
      zip.file(artboard.path, JSON.stringify(scene, null, 2));
    }
  }

  for (const [, resolved] of Object.entries(instance.resolvedAssets)) {
    if (resolved.url.startsWith("blob:") || resolved.url.startsWith("data:")) {
      try {
        const response = await fetch(resolved.url);
        const blob = await response.blob();
        zip.file(resolved.entry.path, blob);
      } catch {
        // Skip assets that can't be fetched from blob URLs
      }
    }
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
