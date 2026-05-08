import { describe, it, expect } from "vitest";
import { applyPatch, DesignPatchSchema } from "./patches";
import type { ArtboardScene } from "./types";

const mockScene: ArtboardScene = {
  id: "artboard.test",
  type: "artboard",
  name: "Test",
  width: 1080,
  height: 1080,
  unit: "px",
  children: [
    {
      id: "node.1",
      type: "text",
      name: "Title",
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      text: "Hello",
      style: {
        fontFamily: "Inter",
        fontSize: 24,
        color: "#FFFFFF",
      },
    },
    {
      id: "node.2",
      type: "rect",
      name: "Box",
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      style: { fill: { type: "solid", color: "#FF0000" } },
    },
  ],
};

describe("DesignPatchSchema", () => {
  it("validates an addNode patch", () => {
    const result = DesignPatchSchema.safeParse({
      op: "addNode",
      artboardId: "artboard.test",
      node: {
        id: "new.rect",
        type: "rect",
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        style: { fill: { type: "solid", color: "#00FF00" } },
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates an updateNode patch", () => {
    const result = DesignPatchSchema.safeParse({
      op: "updateNode",
      artboardId: "artboard.test",
      nodeId: "node.1",
      patch: { text: "Updated" },
    });
    expect(result.success).toBe(true);
  });

  it("validates a deleteNode patch", () => {
    const result = DesignPatchSchema.safeParse({
      op: "deleteNode",
      artboardId: "artboard.test",
      nodeId: "node.2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid op", () => {
    const result = DesignPatchSchema.safeParse({
      op: "moveNode",
      artboardId: "artboard.test",
      nodeId: "node.1",
    });
    expect(result.success).toBe(false);
  });
});

describe("applyPatch", () => {
  it("adds a node at the end", () => {
    const patch = {
      op: "addNode" as const,
      artboardId: "artboard.test",
      node: {
        id: "new.node",
        type: "rect" as const,
        x: 50,
        y: 50,
        width: 80,
        height: 80,
        style: { fill: { type: "solid" as const, color: "#0000FF" } },
      },
    };
    const result = applyPatch(mockScene, patch);
    expect(result.children).toHaveLength(3);
    expect(result.children[2].id).toBe("new.node");
  });

  it("adds a node at a specific index", () => {
    const patch = {
      op: "addNode" as const,
      artboardId: "artboard.test",
      node: {
        id: "inserted",
        type: "rect" as const,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        style: {},
      },
      index: 1,
    };
    const result = applyPatch(mockScene, patch);
    expect(result.children[1].id).toBe("inserted");
  });

  it("updates a node by ID", () => {
    const patch = {
      op: "updateNode" as const,
      artboardId: "artboard.test",
      nodeId: "node.1",
      patch: { text: "Updated Text" },
    };
    const result = applyPatch(mockScene, patch);
    const textNode = result.children[0] as { text: string };
    expect(textNode.text).toBe("Updated Text");
  });

  it("deletes a node by ID", () => {
    const patch = {
      op: "deleteNode" as const,
      artboardId: "artboard.test",
      nodeId: "node.2",
    };
    const result = applyPatch(mockScene, patch);
    expect(result.children).toHaveLength(1);
    expect(result.children[0].id).toBe("node.1");
  });

  it("throws if patch targets wrong artboard", () => {
    const patch = {
      op: "deleteNode" as const,
      artboardId: "artboard.other",
      nodeId: "node.1",
    };
    expect(() => applyPatch(mockScene, patch)).toThrow("Patch targets artboard.other");
  });
});
