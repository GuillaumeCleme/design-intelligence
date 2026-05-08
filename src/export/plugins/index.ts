import type { ExportPlugin } from "../types";
import { psdExportPlugin } from "./psd";

/**
 * All builtin export plugins.
 * New plugins should be added to this array.
 */
export const BUILTIN_EXPORT_PLUGINS: ExportPlugin[] = [
  psdExportPlugin,
];
