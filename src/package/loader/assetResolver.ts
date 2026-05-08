/**
 * Resolve an asset path to a URL the browser can load.
 *
 * Rules:
 * - Absolute paths (starting with / or http) are returned as-is
 * - Relative paths are resolved against the package basePath
 */
export function resolveAssetUrl(assetPath: string, basePath: string): string {
  if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
    return assetPath;
  }

  if (assetPath.startsWith("/")) {
    return assetPath;
  }

  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}${assetPath}`;
}
