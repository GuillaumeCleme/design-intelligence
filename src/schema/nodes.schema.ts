import { z } from "zod";

export const SolidPaintSchema = z.object({
  type: z.literal("solid"),
  color: z.string(),
  opacity: z.number().min(0).max(1).optional(),
});

export const LinearGradientPaintSchema = z.object({
  type: z.literal("linear-gradient"),
  angle: z.number(),
  stops: z.array(
    z.object({
      offset: z.number().min(0).max(1),
      color: z.string(),
      opacity: z.number().min(0).max(1),
    })
  ),
});

export const PaintSchema = z.discriminatedUnion("type", [
  SolidPaintSchema,
  LinearGradientPaintSchema,
]);

export const TokenRefSchema = z.string().regex(/^\{.+\}$/);

export const PaintOrTokenSchema = z.union([PaintSchema, TokenRefSchema]);

export const BaseNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  opacity: z.number().min(0).max(1).optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
});

export const ImageNodeSchema = BaseNodeSchema.extend({
  type: z.literal("image"),
  assetId: z.string(),
  fit: z.enum(["cover", "contain", "fill"]).optional(),
});

export const RectNodeSchema = BaseNodeSchema.extend({
  type: z.literal("rect"),
  style: z.object({
    fill: PaintOrTokenSchema.optional(),
    radius: z.number().nonnegative().optional(),
  }),
});

export const TextNodeSchema = BaseNodeSchema.extend({
  type: z.literal("text"),
  text: z.string(),
  style: z.object({
    fontFamily: z.string(),
    fontWeight: z.number().optional(),
    fontSize: z.number().positive(),
    lineHeight: z.number().positive().optional(),
    letterSpacing: z.number().optional(),
    color: z.string(),
    align: z.enum(["left", "center", "right"]).optional(),
    textTransform: z.literal("uppercase").optional(),
  }),
});

export const SceneNodeSchema = z.discriminatedUnion("type", [
  ImageNodeSchema,
  RectNodeSchema,
  TextNodeSchema,
]);

export const ArtboardSceneSchema = z.object({
  id: z.string(),
  type: z.literal("artboard"),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.literal("px"),
  background: PaintOrTokenSchema.optional(),
  children: z.array(SceneNodeSchema),
  export: z
    .object({
      formats: z.array(z.string()),
      defaultFormat: z.string(),
      scale: z.number().positive(),
    })
    .optional(),
});

export type ArtboardSceneInput = z.infer<typeof ArtboardSceneSchema>;
