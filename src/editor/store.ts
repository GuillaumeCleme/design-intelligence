import { create } from "zustand";
import type { SceneNode } from "@/package/types";

export type EditorStore = {
  selectedNodeIds: string[];
  hoveredNodeId: string | null;
  activeArtboardId: string | null;
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuNodeId: string | null;

  selectNode: (nodeId: string, additive?: boolean) => void;
  deselectAll: () => void;
  setHoveredNode: (nodeId: string | null) => void;
  setActiveArtboard: (artboardId: string | null) => void;
  openContextMenu: (nodeId: string, x: number, y: number) => void;
  closeContextMenu: () => void;
  isSelected: (nodeId: string) => boolean;
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  selectedNodeIds: [],
  hoveredNodeId: null,
  activeArtboardId: null,
  contextMenuPosition: null,
  contextMenuNodeId: null,

  selectNode: (nodeId, additive = false) => {
    if (additive) {
      const current = get().selectedNodeIds;
      if (current.includes(nodeId)) {
        set({ selectedNodeIds: current.filter((id) => id !== nodeId) });
      } else {
        set({ selectedNodeIds: [...current, nodeId] });
      }
    } else {
      set({ selectedNodeIds: [nodeId] });
    }
  },

  deselectAll: () => set({ selectedNodeIds: [] }),

  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  setActiveArtboard: (artboardId) => set({ activeArtboardId: artboardId }),

  openContextMenu: (nodeId, x, y) =>
    set({
      contextMenuNodeId: nodeId,
      contextMenuPosition: { x, y },
      selectedNodeIds: get().selectedNodeIds.includes(nodeId)
        ? get().selectedNodeIds
        : [nodeId],
    }),

  closeContextMenu: () =>
    set({ contextMenuNodeId: null, contextMenuPosition: null }),

  isSelected: (nodeId) => get().selectedNodeIds.includes(nodeId),
}));

export function findNodeById(
  children: SceneNode[],
  nodeId: string,
): SceneNode | undefined {
  return children.find((n) => n.id === nodeId);
}
