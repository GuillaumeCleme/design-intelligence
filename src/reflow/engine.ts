import type {
  ArtboardScene,
  SceneNode,
  ImageNode,
  RectNode,
  TextNode,
} from "@/package/types";
import { classifyScene } from "./classifier";
import { NodeRole, AnchorRegion, type ReflowOptions, type ReflowResult } from "./types";

export function reflowScene(options: ReflowOptions): ReflowResult {
  const { sourceScene, targetWidth, targetHeight } = options;

  const classifications = classifyScene(sourceScene);

  const scaleX = targetWidth / sourceScene.width;
  const scaleY = targetHeight / sourceScene.height;
  const uniformScale = Math.min(scaleX, scaleY);

  const reflowedChildren: SceneNode[] = classifications.map((classified) => {
    if (classified.role === NodeRole.FullBleed) {
      return reflowFullBleed(classified.node, targetWidth, targetHeight);
    }

    return reflowContent(
      classified.node,
      sourceScene,
      targetWidth,
      targetHeight,
      scaleX,
      scaleY,
      uniformScale,
      classified.anchor,
    );
  });

  const newId =
    options.newArtboardId ??
    `${sourceScene.id}.reflow.${targetWidth}x${targetHeight}`;
  const newName =
    options.newArtboardName ??
    `${sourceScene.name} (${targetWidth}×${targetHeight})`;

  const reflowedScene: ArtboardScene = {
    ...sourceScene,
    id: newId,
    name: newName,
    width: targetWidth,
    height: targetHeight,
    children: reflowedChildren,
  };

  return { scene: reflowedScene, classifications };
}

function reflowFullBleed(
  node: SceneNode,
  targetWidth: number,
  targetHeight: number,
): SceneNode {
  return {
    ...node,
    x: 0,
    y: 0,
    width: targetWidth,
    height: targetHeight,
  };
}

function reflowContent(
  node: SceneNode,
  source: ArtboardScene,
  targetWidth: number,
  targetHeight: number,
  scaleX: number,
  scaleY: number,
  uniformScale: number,
  anchor: string,
): SceneNode {
  const scaledWidth = Math.round(node.width * uniformScale);
  const scaledHeight = Math.round(node.height * uniformScale);

  const position = computeAnchoredPosition(
    node,
    source,
    targetWidth,
    targetHeight,
    scaledWidth,
    scaledHeight,
    scaleX,
    scaleY,
    anchor,
  );

  const base: SceneNode = {
    ...node,
    x: position.x,
    y: position.y,
    width: scaledWidth,
    height: scaledHeight,
  };

  switch (node.type) {
    case "text":
      return reflowTextNode(base as TextNode, uniformScale);
    case "rect":
      return reflowRectNode(base as RectNode, uniformScale);
    case "image":
      return base as ImageNode;
    default:
      return base;
  }
}

function reflowTextNode(node: TextNode, scale: number): TextNode {
  return {
    ...node,
    style: {
      ...node.style,
      fontSize: Math.round(node.style.fontSize * scale),
      lineHeight: node.style.lineHeight
        ? Math.round(node.style.lineHeight * scale)
        : undefined,
      letterSpacing: node.style.letterSpacing
        ? +(node.style.letterSpacing * scale).toFixed(2)
        : undefined,
    },
  };
}

function reflowRectNode(node: RectNode, scale: number): RectNode {
  if (!node.style.radius) return node;

  return {
    ...node,
    style: {
      ...node.style,
      radius: Math.round(node.style.radius * scale),
    },
  };
}

function computeAnchoredPosition(
  node: SceneNode,
  source: ArtboardScene,
  targetWidth: number,
  targetHeight: number,
  scaledWidth: number,
  scaledHeight: number,
  scaleX: number,
  scaleY: number,
  anchor: string,
): { x: number; y: number } {
  const marginLeft = node.x;
  const marginTop = node.y;
  const marginRight = source.width - (node.x + node.width);
  const marginBottom = source.height - (node.y + node.height);

  let x: number;
  let y: number;

  if (
    anchor === AnchorRegion.TopLeft ||
    anchor === AnchorRegion.CenterLeft ||
    anchor === AnchorRegion.BottomLeft
  ) {
    x = Math.round(marginLeft * scaleX);
  } else if (
    anchor === AnchorRegion.TopRight ||
    anchor === AnchorRegion.CenterRight ||
    anchor === AnchorRegion.BottomRight
  ) {
    x = Math.round(targetWidth - marginRight * scaleX - scaledWidth);
  } else {
    x = Math.round((targetWidth - scaledWidth) / 2);
  }

  if (
    anchor === AnchorRegion.TopLeft ||
    anchor === AnchorRegion.TopCenter ||
    anchor === AnchorRegion.TopRight
  ) {
    y = Math.round(marginTop * scaleY);
  } else if (
    anchor === AnchorRegion.BottomLeft ||
    anchor === AnchorRegion.BottomCenter ||
    anchor === AnchorRegion.BottomRight
  ) {
    y = Math.round(targetHeight - marginBottom * scaleY - scaledHeight);
  } else {
    y = Math.round((targetHeight - scaledHeight) / 2);
  }

  x = Math.max(0, Math.min(x, targetWidth - scaledWidth));
  y = Math.max(0, Math.min(y, targetHeight - scaledHeight));

  return { x, y };
}
