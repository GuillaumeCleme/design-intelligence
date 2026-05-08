import type {
  ArtboardScene,
  AssetManifestEntry,
  DesignPackageManifest,
  Tokens,
} from "@/package/types";

/**
 * Context passed to every export plugin at execution time.
 * Contains everything needed to produce an export.
 */
export type ExportContext = {
  manifest: DesignPackageManifest;
  tokens: Tokens;
  scenes: Record<string, ArtboardScene>;
  assets: Record<string, AssetManifestEntry>;
  selectedArtboardId?: string;
};

/**
 * Options that a user can configure per-plugin.
 * Each plugin declares its own options schema.
 */
export type ExportOptionField = {
  key: string;
  label: string;
  type: "boolean" | "number" | "string" | "select";
  defaultValue: unknown;
  options?: Array<{ label: string; value: string | number }>;
  description?: string;
};

/**
 * The result of an export operation.
 */
export type ExportResult = {
  blob: Blob;
  filename: string;
  mimeType: string;
};

/**
 * Describes what scope an export plugin supports.
 */
export const ExportScope = {
  SingleArtboard: "single-artboard",
  AllArtboards: "all-artboards",
  FullDocument: "full-document",
} as const;

export type ExportScope = (typeof ExportScope)[keyof typeof ExportScope];

/**
 * Metadata about what capabilities this plugin provides.
 * Used by the UI to determine which commands/menu items to show.
 */
export type ExportPluginCapabilities = {
  scopes: ExportScope[];
  supportsLayers: boolean;
  supportsTransparency: boolean;
  maxArtboards?: number;
};

/**
 * The core interface every export plugin must implement.
 */
export type ExportPlugin = {
  /** Unique plugin identifier */
  id: string;

  /** Human-readable plugin name */
  name: string;

  /** Short description shown in UI */
  description: string;

  /** File extension (without dot) */
  fileExtension: string;

  /** MIME type of the exported file */
  mimeType: string;

  /** Icon name from lucide-react */
  icon: string;

  /** Plugin version */
  version: string;

  /** What this plugin can do */
  capabilities: ExportPluginCapabilities;

  /** Configurable options exposed to the user */
  optionFields: ExportOptionField[];

  /**
   * Execute the export with the given context and options.
   * Returns a blob ready for download.
   */
  execute: (
    context: ExportContext,
    options: Record<string, unknown>
  ) => Promise<ExportResult>;

  /**
   * Validate whether this plugin can export given the current context.
   * Returns null if valid, or an error message string.
   */
  validate?: (context: ExportContext) => string | null;
};

/**
 * Runtime state of a registered plugin (enabled/disabled, user options).
 */
export type ExportPluginState = {
  pluginId: string;
  enabled: boolean;
  options: Record<string, unknown>;
};
