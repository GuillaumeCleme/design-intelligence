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
  document: z.string(),
  tokens: z.string(),
  artboards: z.array(ArtboardManifestEntrySchema),
  assets: z.record(z.string(), AssetManifestEntrySchema),
});
