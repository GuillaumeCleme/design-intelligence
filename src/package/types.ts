/**
 * ============================================================================
 * DESIGN PACKAGE TAXONOMY
 * ============================================================================
 *
 * A .designpkg is a structured container (directory or zip) with this layout:
 *
 *   <package-root>/
 *   ├── manifest.json          ← Package identity, version, entry points
 *   ├── document.json          ← Document-level metadata
 *   ├── tokens.json            ← Design tokens (colors, fonts, effects)
 *   ├── artboards/
 *   │   ├── <artboard-id>/
 *   │   │   ├── scene.json    ← Scene graph for this artboard
 *   │   │   └── preview.webp  ← Optional raster preview
 *   │   └── ...
 *   ├── assets/
 *   │   ├── images/           ← Raster images (jpg, png, webp)
 *   │   ├── vectors/          ← Vector graphics (svg)
 *   │   └── fonts/            ← Web fonts (woff2, otf)
 *   └── exports/              ← Generated outputs (png, psd, etc.)
 *
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// MANIFEST (package identity and entry points)
// ---------------------------------------------------------------------------

export type DesignPackageManifest = {
  /** Unique package identifier */
  id: string;
  /** Human-readable package name */
  name: string;
  /** Package format identifier */
  format: "designpkg";
  /** Semver package version */
  version: string;
  /** Author or tool that created this package */
  createdBy?: string;
  /** Timestamp of creation */
  createdAt?: string;
  /** Timestamp of last modification */
  modifiedAt?: string;

  /** Relative path to document.json within the package */
  document: string;
  /** Relative path to tokens.json within the package */
  tokens: string;

  /** Artboard manifest entries */
  artboards: ArtboardManifestEntry[];
  /** Asset registry keyed by asset ID */
  assets: Record<string, AssetManifestEntry>;
};

export type ArtboardManifestEntry = {
  /** Unique artboard identifier */
  id: string;
  /** Human-readable artboard name */
  name: string;
  /** Relative path to the scene.json within the package */
  path: string;
  /** Relative path to the optional preview image */
  preview?: string;
  /** Artboard pixel width */
  width: number;
  /** Artboard pixel height */
  height: number;
  /** X position on the infinite canvas */
  x?: number;
  /** Y position on the infinite canvas */
  y?: number;
};

export type AssetManifestEntry = {
  /** Asset type category */
  type: "image" | "vector" | "font";
  /** MIME type of the asset file */
  mimeType: string;
  /** Relative path to the asset file within the package */
  path: string;
  /** Font family name (font assets only) */
  fontFamily?: string;
  /** Font weight (font assets only) */
  fontWeight?: number;
};

// ---------------------------------------------------------------------------
// DOCUMENT (document-level metadata)
// ---------------------------------------------------------------------------

export type DesignDocument = {
  /** Document identifier */
  id: string;
  /** Document version */
  version: string;
  /** Base unit for all measurements */
  unit: "px" | "pt" | "mm";
  /** Color space */
  colorSpace: "srgb" | "display-p3";
  /** Root node identifier */
  rootId: string;
  /** Ordered list of artboard IDs */
  artboards: string[];
  /** Ordered list of asset IDs used */
  assets: string[];
  /** Dependency graph: artboardId → assetIds it requires */
  dependencies: Record<string, string[]>;
};

// ---------------------------------------------------------------------------
// TOKENS (design tokens)
// ---------------------------------------------------------------------------

export type Tokens = {
  /** Color palette: tokenName → hex value */
  colors: Record<string, string>;
  /** Font definitions: tokenName → font spec */
  fonts: Record<string, FontToken>;
  /** Reusable effects: tokenName → paint definition */
  effects: Record<string, Paint>;
};

export type FontToken = {
  fontFamily: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  assetId?: string;
};

// ---------------------------------------------------------------------------
// SCENE GRAPH (artboard content)
// ---------------------------------------------------------------------------

export type ArtboardScene = {
  /** Artboard identifier (must match manifest entry) */
  id: string;
  /** Node type discriminator */
  type: "artboard";
  /** Human-readable artboard name */
  name: string;
  /** Pixel width */
  width: number;
  /** Pixel height */
  height: number;
  /** Measurement unit */
  unit: "px";
  /** Artboard background fill */
  background?: Paint | string;
  /** Ordered child nodes (back to front) */
  children: SceneNode[];
  /** Export configuration */
  export?: ExportConfig;
};

export type ExportConfig = {
  formats: string[];
  defaultFormat: string;
  scale: number;
};

export type SceneNode = ImageNode | RectNode | TextNode;

export type BaseNode = {
  id: string;
  type: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
};

export type ImageNode = BaseNode & {
  type: "image";
  assetId: string;
  fit?: "cover" | "contain" | "fill";
};

export type RectNode = BaseNode & {
  type: "rect";
  style: {
    fill?: Paint | string;
    stroke?: Paint | string;
    strokeWidth?: number;
    radius?: number;
  };
};

export type TextNode = BaseNode & {
  type: "text";
  text: string;
  style: TextStyle;
};

export type TextStyle = {
  fontFamily: string;
  fontWeight?: number;
  fontSize: number;
  lineHeight?: number;
  letterSpacing?: number;
  color: string;
  align?: "left" | "center" | "right";
  textTransform?: "uppercase" | "lowercase" | "capitalize";
};

// ---------------------------------------------------------------------------
// PAINT (fill/stroke definitions — can be token refs or literal values)
// ---------------------------------------------------------------------------

export type Paint =
  | SolidPaint
  | LinearGradientPaint;

export type SolidPaint = {
  type: "solid";
  color: string;
  opacity?: number;
};

export type LinearGradientPaint = {
  type: "linear-gradient";
  angle: number;
  stops: GradientStop[];
};

export type GradientStop = {
  offset: number;
  color: string;
  opacity: number;
};

// ---------------------------------------------------------------------------
// IN-MEMORY PACKAGE INSTANCE (hydrated, ready for rendering)
// ---------------------------------------------------------------------------

/**
 * Represents a fully loaded design package in memory.
 * All JSON files have been parsed and validated.
 * Asset URLs are resolved and ready for rendering.
 */
export type DesignPackageInstance = {
  /** The source manifest */
  manifest: DesignPackageManifest;
  /** The document metadata */
  document: DesignDocument;
  /** Resolved design tokens */
  tokens: Tokens;
  /** Parsed artboard scenes keyed by artboard ID */
  scenes: Record<string, ArtboardScene>;
  /** Resolved asset URLs keyed by asset ID (ready for browser loading) */
  resolvedAssets: Record<string, ResolvedAsset>;
  /** Package source information (how it was loaded) */
  source: PackageSource;
  /** Loading state */
  state: PackageState;
};

export type ResolvedAsset = {
  /** Original asset manifest entry */
  entry: AssetManifestEntry;
  /** Resolved URL that the browser can load (blob:, http:, or data:) */
  url: string;
  /** Whether the asset has been fully loaded into memory */
  loaded: boolean;
};

export type PackageSource =
  | { type: "directory"; basePath: string }
  | { type: "zip"; filename: string; data: ArrayBuffer }
  | { type: "memory"; id: string };

export const PackageState = {
  Idle: "idle",
  Loading: "loading",
  Validating: "validating",
  ResolvingAssets: "resolving-assets",
  Ready: "ready",
  Error: "error",
} as const;

export type PackageState = (typeof PackageState)[keyof typeof PackageState];

// ---------------------------------------------------------------------------
// PACKAGE REGISTRY (track which packages are available)
// ---------------------------------------------------------------------------

export type PackageRegistryEntry = {
  /** Package ID */
  id: string;
  /** Package name */
  name: string;
  /** How to load it */
  source: PackageSource;
  /** Whether it's currently loaded in memory */
  loaded: boolean;
};
