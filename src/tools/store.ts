import { create } from "zustand";
import { ToolId, ActionId } from "./types";

type ToolStore = {
  activeTool: ToolId;
  zoom: number;
  showGrid: boolean;
  showSnap: boolean;
  commandBarOpen: boolean;
  commandBarValue: string;

  setActiveTool: (tool: ToolId) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomTo100: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  openCommandBar: () => void;
  closeCommandBar: () => void;
  setCommandBarValue: (value: string) => void;
  executeAction: (actionId: ActionId) => void;
};

export const useToolStore = create<ToolStore>((set, get) => ({
  activeTool: ToolId.Select,
  zoom: 0.35,
  showGrid: false,
  showSnap: true,
  commandBarOpen: false,
  commandBarValue: "",

  setActiveTool: (tool) => set({ activeTool: tool }),

  setZoom: (zoom) => set({ zoom: Math.max(0.05, Math.min(2, zoom)) }),

  zoomIn: () => {
    const { zoom } = get();
    set({ zoom: Math.min(2, zoom + 0.1) });
  },

  zoomOut: () => {
    const { zoom } = get();
    set({ zoom: Math.max(0.05, zoom - 0.1) });
  },

  zoomToFit: () => set({ zoom: 0.35 }),

  zoomTo100: () => set({ zoom: 1 }),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  toggleSnap: () => set((s) => ({ showSnap: !s.showSnap })),

  openCommandBar: () => set({ commandBarOpen: true, commandBarValue: "" }),

  closeCommandBar: () => set({ commandBarOpen: false, commandBarValue: "" }),

  setCommandBarValue: (value) => set({ commandBarValue: value }),

  executeAction: (actionId) => {
    switch (actionId) {
      case ActionId.ZoomIn:
        get().zoomIn();
        break;
      case ActionId.ZoomOut:
        get().zoomOut();
        break;
      case ActionId.ZoomToFit:
        get().zoomToFit();
        break;
      case ActionId.ZoomTo100:
        get().zoomTo100();
        break;
      case ActionId.ToggleGrid:
        get().toggleGrid();
        break;
      case ActionId.ToggleSnap:
        get().toggleSnap();
        break;
      default:
        console.log(`[Action] ${actionId} triggered`);
        break;
    }
  },
}));
