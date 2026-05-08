import type { SceneNode, ArtboardScene } from "@/package/types";
import { AnchorRegion, NodeRole, type ClassifiedNode } from "./types";

const FULL_BLEED_TOLERANCE = 0.02;

export function classifyNode(
  node: SceneNode,
  artboard: ArtboardScene,
): ClassifiedNode {
  const role = detectRole(node, artboard);
  const anchor = detectAnchor(node, artboard);
  const margins = computeMargins(node, artboard);

  return { node, role, anchor, margins };
}

export function classifyScene(artboard: ArtboardScene): ClassifiedNode[] {
  return artboard.children.map((node) => classifyNode(node, artboard));
}

function detectRole(node: SceneNode, artboard: ArtboardScene): NodeRole {
  const xRatio = node.x / artboard.width;
  const yRatio = node.y / artboard.height;
  const wRatio = node.width / artboard.width;
  const hRatio = node.height / artboard.height;

  const coversWidth = Math.abs(xRatio) <= FULL_BLEED_TOLERANCE && wRatio >= 1 - FULL_BLEED_TOLERANCE;
  const coversHeight = Math.abs(yRatio) <= FULL_BLEED_TOLERANCE && hRatio >= 1 - FULL_BLEED_TOLERANCE;

  if (coversWidth && coversHeight) {
    return NodeRole.FullBleed;
  }

  return NodeRole.Content;
}

function detectAnchor(node: SceneNode, artboard: ArtboardScene): AnchorRegion {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;

  const relX = centerX / artboard.width;
  const relY = centerY / artboard.height;

  const col = relX < 0.33 ? "left" : relX > 0.67 ? "right" : "center";
  const row = relY < 0.33 ? "top" : relY > 0.67 ? "bottom" : "center";

  const key = `${row}-${col}` as const;

  const mapping: Record<string, AnchorRegion> = {
    "top-left": AnchorRegion.TopLeft,
    "top-center": AnchorRegion.TopCenter,
    "top-right": AnchorRegion.TopRight,
    "center-left": AnchorRegion.CenterLeft,
    "center-center": AnchorRegion.Center,
    "center-right": AnchorRegion.CenterRight,
    "bottom-left": AnchorRegion.BottomLeft,
    "bottom-center": AnchorRegion.BottomCenter,
    "bottom-right": AnchorRegion.BottomRight,
  };

  return mapping[key] ?? AnchorRegion.Center;
}

function computeMargins(
  node: SceneNode,
  artboard: ArtboardScene,
): ClassifiedNode["margins"] {
  return {
    top: node.y,
    right: artboard.width - (node.x + node.width),
    bottom: artboard.height - (node.y + node.height),
    left: node.x,
  };
}
