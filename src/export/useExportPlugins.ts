import { useEffect } from "react";
import { useExportRegistry } from "./registry";
import { BUILTIN_EXPORT_PLUGINS } from "./plugins";
import { downloadExportResult } from "./download";
import type { ExportContext } from "./types";
import type { SlashCommand } from "@/tools/types";

/**
 * Registers all builtin export plugins on mount.
 * Call once at app root.
 */
export function useInitExportPlugins() {
  const { registerPlugin, plugins } = useExportRegistry();

  useEffect(() => {
    for (const plugin of BUILTIN_EXPORT_PLUGINS) {
      if (!plugins.has(plugin.id)) {
        registerPlugin(plugin);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Returns dynamic slash commands generated from enabled export plugins.
 */
export function useExportSlashCommands(): SlashCommand[] {
  const { getEnabledPlugins } = useExportRegistry();
  const enabledPlugins = getEnabledPlugins();

  return enabledPlugins.map((plugin) => ({
    type: "export" as const,
    command: `/export ${plugin.fileExtension}`,
    label: `Export as ${plugin.name}`,
    description: plugin.description,
    icon: plugin.icon,
    id: `plugin:${plugin.id}`,
  }));
}

/**
 * Returns a function to execute an export plugin by ID.
 */
export function useExecuteExport() {
  const { executeExport } = useExportRegistry();

  return async (pluginId: string, context: ExportContext) => {
    const result = await executeExport(pluginId, context);
    downloadExportResult(result);
    return result;
  };
}
