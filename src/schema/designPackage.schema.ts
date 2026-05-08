import { z } from "zod";

export const AssetManifestEntrySchema = z.object({
  type: z.enum(["image", "vector", "font"]),
  mimeType: z.string(),
  path: z.string(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
});

export const ArtboardManifestEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  preview: z.string().optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export const DesignPackageManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: z.literal("designpkg"),
  version: z.string(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  document: z.string(),
  tokens: z.string(),
  artboards: z.array(ArtboardManifestEntrySchema),
  assets: z.record(z.string(), AssetManifestEntrySchema),
});

export const DesignDocumentSchema = z.object({
  id: z.string(),
  version: z.string(),
  unit: z.enum(["px", "pt", "mm"]),
  colorSpace: z.enum(["srgb", "display-p3"]),
  rootId: z.string(),
  artboards: z.array(z.string()),
  assets: z.array(z.string()),
  dependencies: z.record(z.string(), z.array(z.string())),
});

export const FontTokenSchema = z.object({
  fontFamily: z.string(),
  fontWeight: z.number().optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  assetId: z.string().optional(),
});

export const GradientStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: z.string(),
  opacity: z.number().min(0).max(1),
});

export const SolidPaintSchema = z.object({
  type: z.literal("solid"),
  color: z.string(),
  opacity: z.number().min(0).max(1).optional(),
});

export const LinearGradientPaintSchema = z.object({
  type: z.literal("linear-gradient"),
  angle: z.number(),
  stops: z.array(GradientStopSchema),
});

export const PaintSchema = z.discriminatedUnion("type", [
  SolidPaintSchema,
  LinearGradientPaintSchema,
]);

export const TokensSchema = z.object({
  colors: z.record(z.string(), z.string()),
  fonts: z.record(z.string(), FontTokenSchema),
  effects: z.record(z.string(), PaintSchema),
});
