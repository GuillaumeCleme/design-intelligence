import { describe, it, expect, beforeEach } from "vitest";
import { useExportRegistry } from "./registry";
import type { ExportPlugin, ExportContext } from "./types";
import { ExportScope } from "./types";

const mockPlugin: ExportPlugin = {
  id: "test:mock",
  name: "Mock Export",
  description: "A mock export plugin for testing",
  fileExtension: "mock",
  mimeType: "application/x-mock",
  icon: "File",
  version: "1.0.0",
  capabilities: {
    scopes: [ExportScope.SingleArtboard],
    supportsLayers: false,
    supportsTransparency: true,
  },
  optionFields: [
    {
      key: "quality",
      label: "Quality",
      type: "number",
      defaultValue: 80,
    },
    {
      key: "compress",
      label: "Compress",
      type: "boolean",
      defaultValue: true,
    },
  ],
  execute: async (_context, options) => {
    return {
      blob: new Blob([`mock-${options.quality}`], { type: "application/x-mock" }),
      filename: "test.mock",
      mimeType: "application/x-mock",
    };
  },
  validate: (context) => {
    if (Object.keys(context.scenes).length === 0) {
      return "No scenes";
    }
    return null;
  },
};

const mockContext: ExportContext = {
  manifest: {
    id: "test",
    name: "Test",
    format: "designpkg",
    version: "0.1.0",
    document: "document.json",
    tokens: "tokens.json",
    artboards: [],
    assets: {},
  },
  tokens: { colors: {}, fonts: {}, effects: {} },
  scenes: { "ab.1": { id: "ab.1", type: "artboard", name: "A", width: 100, height: 100, unit: "px", children: [] } },
  assets: {},
  selectedArtboardId: "ab.1",
};

describe("useExportRegistry", () => {
  beforeEach(() => {
    useExportRegistry.setState({ plugins: new Map(), pluginStates: new Map() });
  });

  it("registers a plugin with default options", () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    const plugin = useExportRegistry.getState().getPlugin("test:mock");
    expect(plugin).toBeDefined();
    expect(plugin!.name).toBe("Mock Export");

    expect(useExportRegistry.getState().isPluginEnabled("test:mock")).toBe(true);
  });

  it("sets default options from optionFields", () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    const states = useExportRegistry.getState().pluginStates;
    const state = states.get("test:mock");
    expect(state!.options.quality).toBe(80);
    expect(state!.options.compress).toBe(true);
  });

  it("enables and disables plugins", () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    useExportRegistry.getState().disablePlugin("test:mock");
    expect(useExportRegistry.getState().isPluginEnabled("test:mock")).toBe(false);

    useExportRegistry.getState().enablePlugin("test:mock");
    expect(useExportRegistry.getState().isPluginEnabled("test:mock")).toBe(true);
  });

  it("updates plugin options", () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    useExportRegistry.getState().setPluginOption("test:mock", "quality", 95);

    const states = useExportRegistry.getState().pluginStates;
    expect(states.get("test:mock")!.options.quality).toBe(95);
  });

  it("getEnabledPlugins returns only enabled", () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    expect(useExportRegistry.getState().getEnabledPlugins()).toHaveLength(1);

    useExportRegistry.getState().disablePlugin("test:mock");
    expect(useExportRegistry.getState().getEnabledPlugins()).toHaveLength(0);
  });

  it("unregisters a plugin", () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    useExportRegistry.getState().unregisterPlugin("test:mock");
    expect(useExportRegistry.getState().getPlugin("test:mock")).toBeUndefined();
  });

  it("executeExport runs the plugin", async () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    const result = await useExportRegistry.getState().executeExport("test:mock", mockContext);
    expect(result.filename).toBe("test.mock");
    expect(result.mimeType).toBe("application/x-mock");
  });

  it("executeExport throws if plugin not found", async () => {
    await expect(
      useExportRegistry.getState().executeExport("nonexistent", mockContext)
    ).rejects.toThrow("not found");
  });

  it("executeExport throws if plugin disabled", async () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    useExportRegistry.getState().disablePlugin("test:mock");
    await expect(
      useExportRegistry.getState().executeExport("test:mock", mockContext)
    ).rejects.toThrow("disabled");
  });

  it("executeExport runs validation", async () => {
    useExportRegistry.getState().registerPlugin(mockPlugin);
    const emptyContext = { ...mockContext, scenes: {} };
    await expect(
      useExportRegistry.getState().executeExport("test:mock", emptyContext)
    ).rejects.toThrow("validation failed");
  });
});
