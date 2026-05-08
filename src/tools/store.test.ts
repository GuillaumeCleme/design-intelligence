import { describe, it, expect, beforeEach } from "vitest";
import { useToolStore } from "./store";
import { ToolId, ActionId } from "./types";

describe("useToolStore", () => {
  beforeEach(() => {
    useToolStore.setState({
      activeTool: ToolId.Select,
      zoom: 0.35,
      showGrid: false,
      showSnap: true,
      commandBarOpen: false,
      commandBarValue: "",
    });
  });

  it("has correct initial state", () => {
    const state = useToolStore.getState();
    expect(state.activeTool).toBe(ToolId.Select);
    expect(state.zoom).toBe(0.35);
    expect(state.showGrid).toBe(false);
    expect(state.showSnap).toBe(true);
  });

  it("sets active tool", () => {
    useToolStore.getState().setActiveTool(ToolId.Brush);
    expect(useToolStore.getState().activeTool).toBe(ToolId.Brush);
  });

  it("zooms in with clamp", () => {
    useToolStore.getState().setZoom(1.5);
    useToolStore.getState().zoomIn();
    expect(useToolStore.getState().zoom).toBe(1.6);

    useToolStore.getState().setZoom(1.95);
    useToolStore.getState().zoomIn();
    expect(useToolStore.getState().zoom).toBe(2);
  });

  it("zooms out with clamp", () => {
    useToolStore.getState().setZoom(0.1);
    useToolStore.getState().zoomOut();
    expect(useToolStore.getState().zoom).toBe(0.05);

    useToolStore.getState().zoomOut();
    expect(useToolStore.getState().zoom).toBe(0.05);
  });

  it("zooms to fit", () => {
    useToolStore.getState().setZoom(1);
    useToolStore.getState().zoomToFit();
    expect(useToolStore.getState().zoom).toBe(0.35);
  });

  it("zooms to 100%", () => {
    useToolStore.getState().zoomTo100();
    expect(useToolStore.getState().zoom).toBe(1);
  });

  it("toggles grid", () => {
    useToolStore.getState().toggleGrid();
    expect(useToolStore.getState().showGrid).toBe(true);
    useToolStore.getState().toggleGrid();
    expect(useToolStore.getState().showGrid).toBe(false);
  });

  it("toggles snap", () => {
    useToolStore.getState().toggleSnap();
    expect(useToolStore.getState().showSnap).toBe(false);
  });

  it("opens and closes command bar", () => {
    useToolStore.getState().openCommandBar();
    expect(useToolStore.getState().commandBarOpen).toBe(true);

    useToolStore.getState().closeCommandBar();
    expect(useToolStore.getState().commandBarOpen).toBe(false);
  });

  it("executes zoom actions", () => {
    useToolStore.getState().executeAction(ActionId.ZoomIn);
    expect(useToolStore.getState().zoom).toBeCloseTo(0.45);

    useToolStore.getState().executeAction(ActionId.ZoomOut);
    expect(useToolStore.getState().zoom).toBeCloseTo(0.35);

    useToolStore.getState().executeAction(ActionId.ZoomTo100);
    expect(useToolStore.getState().zoom).toBe(1);

    useToolStore.getState().executeAction(ActionId.ZoomToFit);
    expect(useToolStore.getState().zoom).toBe(0.35);
  });

  it("executes toggle actions", () => {
    useToolStore.getState().executeAction(ActionId.ToggleGrid);
    expect(useToolStore.getState().showGrid).toBe(true);

    useToolStore.getState().executeAction(ActionId.ToggleSnap);
    expect(useToolStore.getState().showSnap).toBe(false);
  });
});
