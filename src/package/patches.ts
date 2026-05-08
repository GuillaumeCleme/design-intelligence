import { z } from "zod";
import { SceneNodeSchema } from "../schema/nodes.schema";
import type { ArtboardScene, SceneNode } from "./types";

export const AddNodePatchSchema = z.object({
  op: z.literal("addNode"),
  artboardId: z.string(),
  node: SceneNodeSchema,
  index: z.number().optional(),
});

export const UpdateNodePatchSchema = z.object({
  op: z.literal("updateNode"),
  artboardId: z.string(),
  nodeId: z.string(),
  patch: z.record(z.string(), z.unknown()),
});

export const DeleteNodePatchSchema = z.object({
  op: z.literal("deleteNode"),
  artboardId: z.string(),
  nodeId: z.string(),
});

export const DesignPatchSchema = z.discriminatedUnion("op", [
  AddNodePatchSchema,
  UpdateNodePatchSchema,
  DeleteNodePatchSchema,
]);

export type DesignPatch = z.infer<typeof DesignPatchSchema>;

export function applyPatch(scene: ArtboardScene, patch: DesignPatch) {
  if (patch.artboardId !== scene.id) {
    throw new Error(
      `Patch targets ${patch.artboardId}, but scene is ${scene.id}`
    );
  }

  if (patch.op === "addNode") {
    const nextChildren = [...scene.children];
    const index = patch.index ?? nextChildren.length;

    nextChildren.splice(index, 0, patch.node as SceneNode);

    return {
      ...scene,
      children: nextChildren,
    };
  }

  if (patch.op === "updateNode") {
    return {
      ...scene,
      children: scene.children.map((node) =>
        node.id === patch.nodeId
          ? ({
              ...node,
              ...patch.patch,
            } as SceneNode)
          : node
      ),
    };
  }

  if (patch.op === "deleteNode") {
    return {
      ...scene,
      children: scene.children.filter((node) => node.id !== patch.nodeId),
    };
  }

  return scene;
}
