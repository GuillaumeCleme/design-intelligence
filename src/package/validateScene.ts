import type {
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "./types";
import { resolveTokenPath } from "../renderer/tokenResolver";

export function validateSceneReferences(params: {
  scene: ArtboardScene;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
}) {
  const { scene, assets, tokens } = params;

  const errors: string[] = [];
  const nodeIds = new Set<string>();

  for (const node of scene.children) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }

    nodeIds.add(node.id);

    if (node.type === "image" && !assets[node.assetId]) {
      errors.push(`Missing image asset ${node.assetId} in node ${node.id}`);
    }

    checkObjectForTokens(node, tokens, errors, node.id);
  }

  return errors;
}

function checkObjectForTokens(
  value: unknown,
  tokens: Tokens,
  errors: string[],
  context: string
) {
  if (typeof value === "string" && value.startsWith("{")) {
    try {
      resolveTokenPath(value, tokens);
    } catch (error) {
      errors.push(`${context}: ${(error as Error).message}`);
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      checkObjectForTokens(item, tokens, errors, context);
    }
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      checkObjectForTokens(child, tokens, errors, context);
    }
  }
}
