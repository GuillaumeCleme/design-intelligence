import { describe, it, expect, vi } from "vitest";

const mockAddChild = vi.fn();
const mockRemoveChildren = vi.fn();

vi.mock("pixi.js", () => ({
  Application: class {
    stage = { removeChildren: mockRemoveChildren, addChild: mockAddChild };
  },
  Container: class {
    label = "";
    x = 0;
    y = 0;
    addChild = vi.fn();
  },
}));

vi.mock("./renderNode", () => ({
  renderNode: vi.fn(async ({ node }: { node: { id: string; visible?: boolean } }) => {
    if (node.id === "hidden") return null;
    return { alpha: 1, id: node.id };
  }),
}));

import { renderArtboardToPixiApp } from "./renderArtboard";
import { Application } from "pixi.js";
import type { ArtboardScene, Tokens } from "@/package/types";

const tokens: Tokens = { colors: {}, fonts: {}, effects: {} };
const assets = {};

describe("renderArtboardToPixiApp", () => {
  it("clears existing children from stage", async () => {
    const app = new Application();
    const scene: ArtboardScene = {
      id: "ab.1",
      type: "artboard",
      name: "Test",
      width: 100,
      height: 100,
      unit: "px",
      children: [],
    };

    await renderArtboardToPixiApp({ app, scene, assets, tokens });
    expect(mockRemoveChildren).toHaveBeenCalled();
  });

  it("adds an artboard container to stage", async () => {
    const app = new Application();
    const scene: ArtboardScene = {
      id: "ab.1",
      type: "artboard",
      name: "My Board",
      width: 500,
      height: 300,
      unit: "px",
      children: [],
    };

    await renderArtboardToPixiApp({ app, scene, assets, tokens });
    expect(mockAddChild).toHaveBeenCalled();
  });

  it("skips invisible nodes", async () => {
    const app = new Application();
    const scene: ArtboardScene = {
      id: "ab.1",
      type: "artboard",
      name: "Test",
      width: 100,
      height: 100,
      unit: "px",
      children: [
        { id: "vis", type: "rect", x: 0, y: 0, width: 10, height: 10, style: {} },
        { id: "invis", type: "rect", x: 0, y: 0, width: 10, height: 10, visible: false, style: {} },
      ],
    };

    const artboard = await renderArtboardToPixiApp({ app, scene, assets, tokens });
    expect(artboard.addChild).toHaveBeenCalledTimes(1);
  });
});
