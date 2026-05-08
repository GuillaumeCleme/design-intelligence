import { Assets, Container, Graphics, Sprite } from "pixi.js";
import type { AssetManifestEntry, ImageNode } from "../package/types";

export async function renderImageNode(params: {
  node: ImageNode;
  assets: Record<string, AssetManifestEntry>;
}) {
  const { node, assets } = params;

  const asset = assets[node.assetId];

  if (!asset) {
    throw new Error(`Missing asset: ${node.assetId}`);
  }

  const texture = await Assets.load(asset.path);
  const sprite = new Sprite(texture);

  sprite.x = node.x;
  sprite.y = node.y;

  const imageRatio = texture.width / texture.height;
  const boxRatio = node.width / node.height;

  if (node.fit === "cover") {
    if (imageRatio > boxRatio) {
      sprite.height = node.height;
      sprite.width = node.height * imageRatio;
      sprite.x = node.x - (sprite.width - node.width) / 2;
    } else {
      sprite.width = node.width;
      sprite.height = node.width / imageRatio;
      sprite.y = node.y - (sprite.height - node.height) / 2;
    }

    const mask = new Graphics()
      .rect(node.x, node.y, node.width, node.height)
      .fill(0xffffff);

    sprite.mask = mask;

    const group = new Container();
    group.addChild(sprite);
    group.addChild(mask);

    return group;
  }

  if (node.fit === "contain") {
    if (imageRatio > boxRatio) {
      sprite.width = node.width;
      sprite.height = node.width / imageRatio;
    } else {
      sprite.height = node.height;
      sprite.width = node.height * imageRatio;
    }

    sprite.x = node.x + (node.width - sprite.width) / 2;
    sprite.y = node.y + (node.height - sprite.height) / 2;

    return sprite;
  }

  sprite.x = node.x;
  sprite.y = node.y;
  sprite.width = node.width;
  sprite.height = node.height;

  return sprite;
}
