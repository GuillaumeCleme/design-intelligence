import type {
  AssetManifestEntry,
  SceneNode,
  Tokens,
} from "../package/types";
import { renderImageNode } from "./renderImageNode";
import { renderRectNode } from "./renderRectNode";
import { renderTextNode } from "./renderTextNode";

export async function renderNode(params: {
  node: SceneNode;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
}) {
  const { node, assets, tokens } = params;

  switch (node.type) {
    case "image":
      return renderImageNode({
        node,
        assets,
      });

    case "rect":
      return renderRectNode({
        node,
        tokens,
      });

    case "text":
      return renderTextNode({
        node,
        tokens,
      });

    default:
      return null;
  }
}
