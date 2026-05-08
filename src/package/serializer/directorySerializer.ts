import type { DesignPackageInstance } from "../types";

/**
 * Serialize a package instance to a flat record of path → content.
 * Useful for representing the directory taxonomy in memory
 * or for testing without writing to disk.
 */
export function serializeToDirectory(
  instance: DesignPackageInstance
): Record<string, string> {
  const files: Record<string, string> = {};

  const manifest = {
    ...instance.manifest,
    modifiedAt: new Date().toISOString(),
  };

  files["manifest.json"] = JSON.stringify(manifest, null, 2);
  files[manifest.document] = JSON.stringify(instance.document, null, 2);
  files[manifest.tokens] = JSON.stringify(instance.tokens, null, 2);

  for (const artboard of manifest.artboards) {
    const scene = instance.scenes[artboard.id];
    if (scene) {
      files[artboard.path] = JSON.stringify(scene, null, 2);
    }
  }

  return files;
}
