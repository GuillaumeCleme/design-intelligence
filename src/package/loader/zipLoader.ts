import JSZip from "jszip";
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

/**
 * Load a design package from a .designpkg zip file (File or ArrayBuffer).
 */
export async function loadPackageFromZip(
  input: File | ArrayBuffer,
  filename?: string
): Promise<DesignPackageInstance> {
  const data = input instanceof File ? await input.arrayBuffer() : input;
  const zip = await JSZip.loadAsync(data);

  const source: PackageSource = {
    type: "zip",
    filename: filename ?? (input instanceof File ? input.name : "package.designpkg"),
    data,
  };

  const manifest = await readJsonFromZip<DesignPackageManifest>(
    zip,
    "manifest.json",
    DesignPackageManifestSchema
  );

  const document = await readJsonFromZip<DesignDocument>(
    zip,
    manifest.document,
    DesignDocumentSchema
  );

  const tokens = await readJsonFromZip<Tokens>(
    zip,
    manifest.tokens,
    TokensSchema
  );

  const scenes: Record<string, ArtboardScene> = {};
  for (const artboard of manifest.artboards) {
    scenes[artboard.id] = await readJsonFromZip<ArtboardScene>(
      zip,
      artboard.path,
      ArtboardSceneSchema
    );
  }

  const resolvedAssets: Record<string, ResolvedAsset> = {};
  for (const [assetId, entry] of Object.entries(manifest.assets)) {
    const file = zip.file(entry.path);
    let url: string;

    if (file) {
      const blob = await file.async("blob");
      url = URL.createObjectURL(blob);
    } else {
      url = entry.path;
    }

    resolvedAssets[assetId] = {
      entry,
      url,
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

async function readJsonFromZip<T>(
  zip: JSZip,
  path: string,
  schema: { parse: (data: unknown) => unknown }
): Promise<T> {
  const file = zip.file(path);
  if (!file) {
    throw new Error(`Package missing file: ${path}`);
  }

  const text = await file.async("string");
  return schema.parse(JSON.parse(text)) as T;
}
