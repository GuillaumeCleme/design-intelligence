import { create } from "zustand";
import type {
  ExportPlugin,
  ExportPluginState,
  ExportContext,
  ExportResult,
} from "./types";

type ExportRegistryState = {
  plugins: Map<string, ExportPlugin>;
  pluginStates: Map<string, ExportPluginState>;

  registerPlugin: (plugin: ExportPlugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
  setPluginOption: (
    pluginId: string,
    key: string,
    value: unknown
  ) => void;
  getEnabledPlugins: () => ExportPlugin[];
  getPlugin: (pluginId: string) => ExportPlugin | undefined;
  isPluginEnabled: (pluginId: string) => boolean;
  executeExport: (
    pluginId: string,
    context: ExportContext
  ) => Promise<ExportResult>;
};

export const useExportRegistry = create<ExportRegistryState>((set, get) => ({
  plugins: new Map(),
  pluginStates: new Map(),

  registerPlugin: (plugin) => {
    set((state) => {
      const plugins = new Map(state.plugins);
      plugins.set(plugin.id, plugin);

      const pluginStates = new Map(state.pluginStates);
      if (!pluginStates.has(plugin.id)) {
        const defaultOptions: Record<string, unknown> = {};
        for (const field of plugin.optionFields) {
          defaultOptions[field.key] = field.defaultValue;
        }

        pluginStates.set(plugin.id, {
          pluginId: plugin.id,
          enabled: true,
          options: defaultOptions,
        });
      }

      return { plugins, pluginStates };
    });
  },

  unregisterPlugin: (pluginId) => {
    set((state) => {
      const plugins = new Map(state.plugins);
      plugins.delete(pluginId);

      const pluginStates = new Map(state.pluginStates);
      pluginStates.delete(pluginId);

      return { plugins, pluginStates };
    });
  },

  enablePlugin: (pluginId) => {
    set((state) => {
      const pluginStates = new Map(state.pluginStates);
      const existing = pluginStates.get(pluginId);
      if (existing) {
        pluginStates.set(pluginId, { ...existing, enabled: true });
      }
      return { pluginStates };
    });
  },

  disablePlugin: (pluginId) => {
    set((state) => {
      const pluginStates = new Map(state.pluginStates);
      const existing = pluginStates.get(pluginId);
      if (existing) {
        pluginStates.set(pluginId, { ...existing, enabled: false });
      }
      return { pluginStates };
    });
  },

  setPluginOption: (pluginId, key, value) => {
    set((state) => {
      const pluginStates = new Map(state.pluginStates);
      const existing = pluginStates.get(pluginId);
      if (existing) {
        pluginStates.set(pluginId, {
          ...existing,
          options: { ...existing.options, [key]: value },
        });
      }
      return { pluginStates };
    });
  },

  getEnabledPlugins: () => {
    const { plugins, pluginStates } = get();
    const enabled: ExportPlugin[] = [];

    for (const [id, plugin] of plugins) {
      const state = pluginStates.get(id);
      if (state?.enabled) {
        enabled.push(plugin);
      }
    }

    return enabled;
  },

  getPlugin: (pluginId) => {
    return get().plugins.get(pluginId);
  },

  isPluginEnabled: (pluginId) => {
    const state = get().pluginStates.get(pluginId);
    return state?.enabled ?? false;
  },

  executeExport: async (pluginId, context) => {
    const { plugins, pluginStates } = get();
    const plugin = plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`Export plugin not found: ${pluginId}`);
    }

    const state = pluginStates.get(pluginId);
    if (!state?.enabled) {
      throw new Error(`Export plugin is disabled: ${pluginId}`);
    }

    if (plugin.validate) {
      const error = plugin.validate(context);
      if (error) {
        throw new Error(`Export validation failed: ${error}`);
      }
    }

    return plugin.execute(context, state.options);
  },
}));
