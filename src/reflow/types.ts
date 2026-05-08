import type { ArtboardScene, SceneNode } from "@/package/types";

export const AnchorRegion = {
  TopLeft: "top-left",
  TopCenter: "top-center",
  TopRight: "top-right",
  CenterLeft: "center-left",
  Center: "center",
  CenterRight: "center-right",
  BottomLeft: "bottom-left",
  BottomCenter: "bottom-center",
  BottomRight: "bottom-right",
} as const;

export type AnchorRegion = (typeof AnchorRegion)[keyof typeof AnchorRegion];

export const NodeRole = {
  FullBleed: "full-bleed",
  Content: "content",
} as const;

export type NodeRole = (typeof NodeRole)[keyof typeof NodeRole];

export type ClassifiedNode = {
  node: SceneNode;
  role: NodeRole;
  anchor: AnchorRegion;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type ReflowPreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
};

export type ReflowOptions = {
  sourceScene: ArtboardScene;
  targetWidth: number;
  targetHeight: number;
  newArtboardId?: string;
  newArtboardName?: string;
};

export type ReflowResult = {
  scene: ArtboardScene;
  classifications: ClassifiedNode[];
};
