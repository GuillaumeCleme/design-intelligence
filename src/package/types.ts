export type DesignPackageManifest = {
  id: string;
  name: string;
  format: "designpkg";
  version: string;
  createdBy?: string;
  document: string;
  tokens: string;
  artboards: ArtboardManifestEntry[];
  assets: Record<string, AssetManifestEntry>;
};

export type ArtboardManifestEntry = {
  id: string;
  name: string;
  path: string;
  preview?: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
};

export type AssetManifestEntry = {
  type: "image" | "vector" | "font";
  mimeType: string;
  path: string;
  fontFamily?: string;
  fontWeight?: number;
};

export type Tokens = {
  colors: Record<string, string>;
  fonts: Record<
    string,
    {
      fontFamily: string;
      fontWeight?: number;
      assetId?: string;
    }
  >;
  effects: Record<string, Paint>;
};

export type ArtboardScene = {
  id: string;
  type: "artboard";
  name: string;
  width: number;
  height: number;
  unit: "px";
  background?: Paint;
  children: SceneNode[];
  export?: {
    formats: string[];
    defaultFormat: string;
    scale: number;
  };
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
    radius?: number;
  };
};

export type TextNode = BaseNode & {
  type: "text";
  text: string;
  style: {
    fontFamily: string;
    fontWeight?: number;
    fontSize: number;
    lineHeight?: number;
    letterSpacing?: number;
    color: string;
    align?: "left" | "center" | "right";
    textTransform?: "uppercase";
  };
};

export type Paint =
  | {
      type: "solid";
      color: string;
      opacity?: number;
    }
  | {
      type: "linear-gradient";
      angle: number;
      stops: Array<{
        offset: number;
        color: string;
        opacity: number;
      }>;
    };
