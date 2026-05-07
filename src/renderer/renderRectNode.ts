import { Graphics, Sprite } from "pixi.js";
import type { RectNode, Tokens } from "../package/types";
import { createGradientTexture } from "./gradients";
import { resolvePaint } from "./tokenResolver";

export function renderRectNode(params: { node: RectNode; tokens: Tokens }) {
  const { node, tokens } = params;

  const fill = resolvePaint(node.style.fill, tokens);

  if (!fill) {
    return null;
  }

  if (fill.type === "solid") {
    const graphics = new Graphics();

    graphics
      .roundRect(
        node.x,
        node.y,
        node.width,
        node.height,
        node.style.radius ?? 0
      )
      .fill({
        color: fill.color,
        alpha: fill.opacity ?? 1,
      });

    return graphics;
  }

  if (fill.type === "linear-gradient") {
    const gradientTexture = createGradientTexture({
      width: node.width,
      height: node.height,
      angle: fill.angle,
      stops: fill.stops,
    });

    const sprite = new Sprite(gradientTexture);

    sprite.x = node.x;
    sprite.y = node.y;
    sprite.width = node.width;
    sprite.height = node.height;

    return sprite;
  }

  return null;
}
