import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore, findNodeById } from "./store";
import type { SceneNode } from "@/package/types";

describe("useEditorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({
      selectedNodeIds: [],
      hoveredNodeId: null,
      activeArtboardId: null,
      contextMenuPosition: null,
      contextMenuNodeId: null,
    });
  });

  it("has correct initial state", () => {
    const state = useEditorStore.getState();
    expect(state.selectedNodeIds).toEqual([]);
    expect(state.hoveredNodeId).toBeNull();
    expect(state.activeArtboardId).toBeNull();
    expect(state.contextMenuPosition).toBeNull();
  });

  describe("selectNode", () => {
    it("selects a single node", () => {
      useEditorStore.getState().selectNode("node-1");
      expect(useEditorStore.getState().selectedNodeIds).toEqual(["node-1"]);
    });

    it("replaces selection when not additive", () => {
      useEditorStore.getState().selectNode("node-1");
      useEditorStore.getState().selectNode("node-2");
      expect(useEditorStore.getState().selectedNodeIds).toEqual(["node-2"]);
    });

    it("adds to selection when additive", () => {
      useEditorStore.getState().selectNode("node-1");
      useEditorStore.getState().selectNode("node-2", true);
      expect(useEditorStore.getState().selectedNodeIds).toEqual(["node-1", "node-2"]);
    });

    it("toggles off when additive and already selected", () => {
      useEditorStore.getState().selectNode("node-1");
      useEditorStore.getState().selectNode("node-2", true);
      useEditorStore.getState().selectNode("node-1", true);
      expect(useEditorStore.getState().selectedNodeIds).toEqual(["node-2"]);
    });
  });

  describe("deselectAll", () => {
    it("clears selection", () => {
      useEditorStore.getState().selectNode("node-1");
      useEditorStore.getState().deselectAll();
      expect(useEditorStore.getState().selectedNodeIds).toEqual([]);
    });
  });

  describe("setHoveredNode", () => {
    it("sets hovered node", () => {
      useEditorStore.getState().setHoveredNode("node-1");
      expect(useEditorStore.getState().hoveredNodeId).toBe("node-1");
    });

    it("clears hovered node", () => {
      useEditorStore.getState().setHoveredNode("node-1");
      useEditorStore.getState().setHoveredNode(null);
      expect(useEditorStore.getState().hoveredNodeId).toBeNull();
    });
  });

  describe("setActiveArtboard", () => {
    it("sets active artboard", () => {
      useEditorStore.getState().setActiveArtboard("ab-1");
      expect(useEditorStore.getState().activeArtboardId).toBe("ab-1");
    });
  });

  describe("openContextMenu", () => {
    it("opens context menu and selects the node", () => {
      useEditorStore.getState().openContextMenu("node-1", 100, 200);
      const state = useEditorStore.getState();
      expect(state.contextMenuNodeId).toBe("node-1");
      expect(state.contextMenuPosition).toEqual({ x: 100, y: 200 });
      expect(state.selectedNodeIds).toEqual(["node-1"]);
    });

    it("preserves existing multi-selection if node is in it", () => {
      useEditorStore.getState().selectNode("node-1");
      useEditorStore.getState().selectNode("node-2", true);
      useEditorStore.getState().openContextMenu("node-1", 50, 50);
      expect(useEditorStore.getState().selectedNodeIds).toEqual(["node-1", "node-2"]);
    });

    it("replaces selection if node is not in it", () => {
      useEditorStore.getState().selectNode("node-1");
      useEditorStore.getState().openContextMenu("node-3", 50, 50);
      expect(useEditorStore.getState().selectedNodeIds).toEqual(["node-3"]);
    });
  });

  describe("closeContextMenu", () => {
    it("clears context menu state", () => {
      useEditorStore.getState().openContextMenu("node-1", 100, 200);
      useEditorStore.getState().closeContextMenu();
      const state = useEditorStore.getState();
      expect(state.contextMenuNodeId).toBeNull();
      expect(state.contextMenuPosition).toBeNull();
    });
  });

  describe("isSelected", () => {
    it("returns true for selected node", () => {
      useEditorStore.getState().selectNode("node-1");
      expect(useEditorStore.getState().isSelected("node-1")).toBe(true);
    });

    it("returns false for unselected node", () => {
      expect(useEditorStore.getState().isSelected("node-1")).toBe(false);
    });
  });
});

describe("findNodeById", () => {
  const nodes: SceneNode[] = [
    { id: "a", type: "rect", x: 0, y: 0, width: 100, height: 100, style: {} },
    { id: "b", type: "text", x: 10, y: 10, width: 50, height: 20, text: "Hi", style: { fontFamily: "Inter", fontSize: 16, color: "#fff" } },
  ];

  it("finds existing node", () => {
    expect(findNodeById(nodes, "b")).toBeDefined();
    expect(findNodeById(nodes, "b")!.type).toBe("text");
  });

  it("returns undefined for non-existent node", () => {
    expect(findNodeById(nodes, "z")).toBeUndefined();
  });
});
