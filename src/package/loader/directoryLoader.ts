import {
  DesignPackageManifestSchema,
  DesignDocumentSchema,
  TokensSchema,
} from "@/schema/designPackage.schema";
import { ArtboardSceneSchema } from "@/schema/nodes.schema";
import type {
  ArtboardScene,
  DesignDocument,
  DesignPackageInstance,
  DesignPackageManifest,
  PackageSource,
  ResolvedAsset,
  Tokens,
} from "../types";
import { PackageState } from "../types";
import { resolveAssetUrl } from "./assetResolver";

/**
 * Load a design package from a directory served over HTTP.
 * The basePath should point to the package root (containing manifest.json).
 *
 * For local dev, this can be a path like "/packages/campaign-banners/"
 * which Vite serves from the public/ directory.
 */
export async function loadPackageFromDirectory(
  basePath: string
): Promise<DesignPackageInstance> {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const source: PackageSource = { type: "directory", basePath: normalizedBase };

  const manifestJson = await fetchJson(`${normalizedBase}manifest.json`);
  const manifest = DesignPackageManifestSchema.parse(
    manifestJson
  ) as DesignPackageManifest;

  const documentJson = await fetchJson(`${normalizedBase}${manifest.document}`);
  const document = DesignDocumentSchema.parse(documentJson) as DesignDocument;

  const tokensJson = await fetchJson(`${normalizedBase}${manifest.tokens}`);
  const tokens = TokensSchema.parse(tokensJson) as Tokens;

  const scenes: Record<string, ArtboardScene> = {};
  for (const artboard of manifest.artboards) {
    const sceneJson = await fetchJson(`${normalizedBase}${artboard.path}`);
    scenes[artboard.id] = ArtboardSceneSchema.parse(sceneJson) as ArtboardScene;
  }

  const resolvedAssets: Record<string, ResolvedAsset> = {};
  for (const [assetId, entry] of Object.entries(manifest.assets)) {
    resolvedAssets[assetId] = {
      entry,
      url: resolveAssetUrl(entry.path, normalizedBase),
      loaded: false,
    };
  }

  return {
    manifest,
    document,
    tokens,
    scenes,
    resolvedAssets,
    source,
    state: PackageState.Ready,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}
