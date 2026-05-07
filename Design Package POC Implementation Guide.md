# Design Package POC Implementation Guide

## 1. Goal

Build a quick proof of concept for a **portable, agent-authorable design package** that can render two banner artboards:

1. `1080 × 1080`
2. `1920 × 1080`

Each artboard should include:

- A shared background image
- A dark right-to-left gradient overlay
- A left-side dark rectangle/panel
- An imported logo above the primary headline
- A primary tagline on the left
- A secondary tagline on the right
- Shared color and font tokens
- A serializable package structure with manifest, tokens, scenes, previews, and assets

The POC should prove this loop:

```text
design package
→ validate scene graph
→ load assets
→ render artboards
→ hydrate only selected/visible artboards
→ export previews/raster outputs


---

2. Recommended POC Stack

Use the following stack for the first implementation:

Layer	Library	Purpose

App shell	Vite + React + TypeScript	Fast local POC app
Schema validation	Zod	Validate scene graph and package files
Renderer	PixiJS v8	High-performance 2D rendering
Package format	JSZip	Read/write .designpkg zip files
State	Zustand or simple React state	Track loaded package, selected artboard, hydration
Export	Pixi renderer canvas extraction	Export PNG/WebP previews


PixiJS is a good renderer for this POC because it supports high-performance WebGL rendering, asset loading, text rendering, masks, filters, graphics, and SVG/image textures. Pixi’s docs recommend WebGL as the stable production renderer while WebGPU is still maturing. 

For the future editor shell, tldraw is worth evaluating because its shape system is already built around JSON records, custom shape utilities, geometry, selection behavior, and a reactive editor store. That maps well to a portable design scene graph, but for this specific POC Pixi is enough. 

Zod should be used because it provides TypeScript-first schema validation with static type inference, which is critical for validating agent-created or imported scene documents before rendering. 

JSZip should be used for the .designpkg container because it supports async zip loading and generation in browser-friendly workflows. 


---

3. POC Non-Goals

Do not attempt these in the first POC:

Full Photoshop export

Full InDesign/IDML export

Figma import/export

Collaborative editing

Complex text shaping

Advanced layout engine

Responsive constraints

Arbitrary HTML/CSS/JS inside artboards

Full DOM/canvas hybrid editing


The first POC should focus on:

package loading
scene validation
asset references
token resolution
Pixi rendering
artboard previews
basic export


---

4. Project Setup

Create the app:

npm create vite@latest design-package-poc -- --template react-ts
cd design-package-poc
npm install
npm install pixi.js zod jszip zustand
npm run dev

Suggested folder structure:

src/
├── app/
│   ├── App.tsx
│   └── DesignCanvas.tsx
│
├── schema/
│   ├── designPackage.schema.ts
│   ├── nodes.schema.ts
│   └── tokens.schema.ts
│
├── package/
│   ├── loadDesignPackage.ts
│   ├── saveDesignPackage.ts
│   └── types.ts
│
├── renderer/
│   ├── renderArtboard.ts
│   ├── renderNode.ts
│   ├── renderImageNode.ts
│   ├── renderRectNode.ts
│   ├── renderTextNode.ts
│   ├── gradients.ts
│   └── tokenResolver.ts
│
├── state/
│   └── useDesignStore.ts
│
├── sample/
│   ├── manifest.json
│   ├── document.json
│   ├── tokens.json
│   └── artboards/
│       ├── square-1080.scene.json
│       └── wide-1920.scene.json
│
└── main.tsx


---

5. Design Package Structure

The target .designpkg is a zip-like package:

campaign-banners.designpkg/
├── manifest.json
├── document.json
├── tokens.json
├── assets/
│   ├── images/
│   │   └── mountain-background.jpg
│   ├── logos/
│   │   └── brand-logo.svg
│   └── fonts/
│       └── Inter-Bold.woff2
├── artboards/
│   ├── square-1080/
│   │   ├── scene.json
│   │   └── preview.webp
│   └── wide-1920/
│       ├── scene.json
│       └── preview.webp
└── exports/
    ├── square-1080.png
    └── wide-1920.png

For the POC, assets can live in /public/sample-assets/ and the package files can be plain JSON imports. Add real zip support after the renderer works.


---

6. Manifest Format

Create src/sample/manifest.json:

{
  "id": "campaign-banners-001",
  "name": "Campaign Banner Set",
  "format": "designpkg",
  "version": "0.1.0",
  "createdBy": "Design Runtime POC",
  "document": "document.json",
  "tokens": "tokens.json",
  "artboards": [
    {
      "id": "artboard.square.1080",
      "name": "Square Social Banner",
      "path": "artboards/square-1080/scene.json",
      "preview": "artboards/square-1080/preview.webp",
      "width": 1080,
      "height": 1080,
      "x": 0,
      "y": 0
    },
    {
      "id": "artboard.wide.1920",
      "name": "Wide Display Banner",
      "path": "artboards/wide-1920/scene.json",
      "preview": "artboards/wide-1920/preview.webp",
      "width": 1920,
      "height": 1080,
      "x": 1220,
      "y": 0
    }
  ],
  "assets": {
    "background.hero": {
      "type": "image",
      "mimeType": "image/jpeg",
      "path": "/sample-assets/mountain-background.jpg"
    },
    "logo.primary": {
      "type": "vector",
      "mimeType": "image/svg+xml",
      "path": "/sample-assets/brand-logo.svg"
    },
    "font.inter.bold": {
      "type": "font",
      "mimeType": "font/woff2",
      "path": "/sample-assets/Inter-Bold.woff2",
      "fontFamily": "Inter",
      "fontWeight": 700
    }
  }
}


---

7. Token Format

Create src/sample/tokens.json:

{
  "colors": {
    "white": "#FFFFFF",
    "yellow": "#FFD21F",
    "darkGrey": "#1E1E1E",
    "overlayBlack": "#000000"
  },
  "fonts": {
    "headline": {
      "fontFamily": "Inter",
      "fontWeight": 700,
      "assetId": "font.inter.bold"
    },
    "secondary": {
      "fontFamily": "Inter",
      "fontWeight": 700,
      "assetId": "font.inter.bold"
    }
  },
  "effects": {
    "rightToLeftShadowOverlay": {
      "type": "linear-gradient",
      "angle": 270,
      "stops": [
        {
          "offset": 0,
          "color": "#000000",
          "opacity": 0.78
        },
        {
          "offset": 0.42,
          "color": "#000000",
          "opacity": 0.42
        },
        {
          "offset": 1,
          "color": "#000000",
          "opacity": 0.08
        }
      ]
    }
  }
}


---

8. Document Format

Create src/sample/document.json:

{
  "id": "document.campaign-banners",
  "version": "0.1.0",
  "unit": "px",
  "colorSpace": "srgb",
  "rootId": "root",
  "artboards": [
    "artboard.square.1080",
    "artboard.wide.1920"
  ],
  "assets": [
    "background.hero",
    "logo.primary",
    "font.inter.bold"
  ],
  "dependencies": {
    "artboard.square.1080": [
      "background.hero",
      "logo.primary",
      "font.inter.bold"
    ],
    "artboard.wide.1920": [
      "background.hero",
      "logo.primary",
      "font.inter.bold"
    ]
  }
}


---

9. Square Artboard Scene

Create src/sample/artboards/square-1080.scene.json:

{
  "id": "artboard.square.1080",
  "type": "artboard",
  "name": "Square Social Banner",
  "width": 1080,
  "height": 1080,
  "unit": "px",
  "background": {
    "type": "solid",
    "color": "{colors.darkGrey}"
  },
  "children": [
    {
      "id": "square.background",
      "type": "image",
      "name": "Background Image",
      "assetId": "background.hero",
      "x": 0,
      "y": 0,
      "width": 1080,
      "height": 1080,
      "fit": "cover",
      "opacity": 1
    },
    {
      "id": "square.gradient.overlay",
      "type": "rect",
      "name": "Right-to-left dark gradient overlay",
      "x": 0,
      "y": 0,
      "width": 1080,
      "height": 1080,
      "style": {
        "fill": "{effects.rightToLeftShadowOverlay}"
      },
      "opacity": 1
    },
    {
      "id": "square.left.panel",
      "type": "rect",
      "name": "Primary headline panel",
      "x": 72,
      "y": 520,
      "width": 430,
      "height": 310,
      "style": {
        "fill": {
          "type": "solid",
          "color": "{colors.darkGrey}",
          "opacity": 0.88
        },
        "radius": 28
      }
    },
    {
      "id": "square.logo",
      "type": "image",
      "name": "Imported Logo",
      "assetId": "logo.primary",
      "x": 112,
      "y": 560,
      "width": 180,
      "height": 72,
      "fit": "contain",
      "opacity": 1
    },
    {
      "id": "square.primary.headline",
      "type": "text",
      "name": "Primary Tagline",
      "x": 112,
      "y": 660,
      "width": 350,
      "height": 150,
      "text": "CREATE\nWITHOUT\nLIMITS",
      "style": {
        "fontFamily": "{fonts.headline.fontFamily}",
        "fontWeight": 700,
        "fontSize": 52,
        "lineHeight": 58,
        "letterSpacing": -1.2,
        "color": "{colors.yellow}",
        "textTransform": "uppercase"
      }
    },
    {
      "id": "square.secondary.headline",
      "type": "text",
      "name": "Secondary Tagline",
      "x": 620,
      "y": 420,
      "width": 360,
      "height": 180,
      "text": "Design systems that scale across every format.",
      "style": {
        "fontFamily": "{fonts.secondary.fontFamily}",
        "fontWeight": 700,
        "fontSize": 44,
        "lineHeight": 52,
        "letterSpacing": -0.8,
        "color": "{colors.white}",
        "align": "right"
      }
    }
  ],
  "export": {
    "formats": ["png", "webp", "html", "pdf", "psd"],
    "defaultFormat": "png",
    "scale": 1
  }
}


---

10. Wide Artboard Scene

Create src/sample/artboards/wide-1920.scene.json:

{
  "id": "artboard.wide.1920",
  "type": "artboard",
  "name": "Wide Display Banner",
  "width": 1920,
  "height": 1080,
  "unit": "px",
  "background": {
    "type": "solid",
    "color": "{colors.darkGrey}"
  },
  "children": [
    {
      "id": "wide.background",
      "type": "image",
      "name": "Background Image",
      "assetId": "background.hero",
      "x": 0,
      "y": 0,
      "width": 1920,
      "height": 1080,
      "fit": "cover",
      "opacity": 1
    },
    {
      "id": "wide.gradient.overlay",
      "type": "rect",
      "name": "Right-to-left dark gradient overlay",
      "x": 0,
      "y": 0,
      "width": 1920,
      "height": 1080,
      "style": {
        "fill": {
          "type": "linear-gradient",
          "angle": 270,
          "stops": [
            {
              "offset": 0,
              "color": "{colors.overlayBlack}",
              "opacity": 0.84
            },
            {
              "offset": 0.48,
              "color": "{colors.overlayBlack}",
              "opacity": 0.38
            },
            {
              "offset": 1,
              "color": "{colors.overlayBlack}",
              "opacity": 0.04
            }
          ]
        }
      }
    },
    {
      "id": "wide.left.panel",
      "type": "rect",
      "name": "Primary headline panel",
      "x": 120,
      "y": 540,
      "width": 560,
      "height": 320,
      "style": {
        "fill": {
          "type": "solid",
          "color": "{colors.darkGrey}",
          "opacity": 0.9
        },
        "radius": 32
      }
    },
    {
      "id": "wide.logo",
      "type": "image",
      "name": "Imported Logo",
      "assetId": "logo.primary",
      "x": 168,
      "y": 590,
      "width": 220,
      "height": 84,
      "fit": "contain"
    },
    {
      "id": "wide.primary.headline",
      "type": "text",
      "name": "Primary Tagline",
      "x": 168,
      "y": 710,
      "width": 460,
      "height": 140,
      "text": "CREATE\nWITHOUT LIMITS",
      "style": {
        "fontFamily": "{fonts.headline.fontFamily}",
        "fontWeight": 700,
        "fontSize": 64,
        "lineHeight": 70,
        "letterSpacing": -1.4,
        "color": "{colors.yellow}",
        "textTransform": "uppercase"
      }
    },
    {
      "id": "wide.secondary.headline",
      "type": "text",
      "name": "Secondary Tagline",
      "x": 1160,
      "y": 384,
      "width": 560,
      "height": 180,
      "text": "Design systems that scale across every format.",
      "style": {
        "fontFamily": "{fonts.secondary.fontFamily}",
        "fontWeight": 700,
        "fontSize": 58,
        "lineHeight": 66,
        "letterSpacing": -1,
        "color": "{colors.white}",
        "align": "right"
      }
    }
  ],
  "export": {
    "formats": ["png", "webp", "html", "pdf", "psd"],
    "defaultFormat": "png",
    "scale": 1
  }
}


---

11. TypeScript Types

Create src/package/types.ts:

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


---

12. Zod Schemas

Create src/schema/nodes.schema.ts:

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

Create src/schema/designPackage.schema.ts:

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


---

13. Token Resolver

Create src/renderer/tokenResolver.ts:

import type { Paint, Tokens } from "../package/types";

export function resolveTokenPath(value: string, tokens: Tokens): unknown {
  if (!value.startsWith("{") || !value.endsWith("}")) {
    return value;
  }

  const path = value.slice(1, -1).split(".");

  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }

    throw new Error(`Unable to resolve token: ${value}`);
  }, tokens);
}

export function resolveColor(value: string, tokens: Tokens): string {
  if (value.startsWith("{")) {
    return resolveTokenPath(value, tokens) as string;
  }

  return value;
}

export function resolvePaint(
  paint: Paint | string | undefined,
  tokens: Tokens
): Paint | undefined {
  if (!paint) return undefined;

  if (typeof paint === "string") {
    return resolveTokenPath(paint, tokens) as Paint;
  }

  if (paint.type === "solid") {
    return {
      ...paint,
      color: resolveColor(paint.color, tokens),
    };
  }

  if (paint.type === "linear-gradient") {
    return {
      ...paint,
      stops: paint.stops.map((stop) => ({
        ...stop,
        color: resolveColor(stop.color, tokens),
      })),
    };
  }

  return paint;
}

export function resolveTextStyle<T extends { fontFamily: string; color: string }>(
  style: T,
  tokens: Tokens
): T {
  return {
    ...style,
    fontFamily: resolveTokenPath(style.fontFamily, tokens) as string,
    color: resolveColor(style.color, tokens),
  };
}


---

14. Gradient Texture Helper

Create src/renderer/gradients.ts:

import { Texture } from "pixi.js";

export function createGradientTexture(params: {
  width: number;
  height: number;
  angle: number;
  stops: Array<{
    offset: number;
    color: string;
    opacity: number;
  }>;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(params.width));
  canvas.height = Math.max(1, Math.round(params.height));

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create gradient canvas context");
  }

  const gradient = createCanvasGradient(ctx, params);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, params.width, params.height);

  return Texture.from(canvas);
}

function createCanvasGradient(
  ctx: CanvasRenderingContext2D,
  params: {
    width: number;
    height: number;
    angle: number;
    stops: Array<{
      offset: number;
      color: string;
      opacity: number;
    }>;
  }
) {
  const normalizedAngle = ((params.angle % 360) + 360) % 360;

  let x0 = 0;
  let y0 = 0;
  let x1 = params.width;
  let y1 = 0;

  if (normalizedAngle === 270) {
    x0 = params.width;
    y0 = 0;
    x1 = 0;
    y1 = 0;
  } else if (normalizedAngle === 90) {
    x0 = 0;
    y0 = 0;
    x1 = params.width;
    y1 = 0;
  } else if (normalizedAngle === 180) {
    x0 = 0;
    y0 = params.height;
    x1 = 0;
    y1 = 0;
  } else if (normalizedAngle === 0) {
    x0 = 0;
    y0 = 0;
    x1 = 0;
    y1 = params.height;
  }

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

  for (const stop of params.stops) {
    gradient.addColorStop(stop.offset, hexToRgba(stop.color, stop.opacity));
  }

  return gradient;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


---

15. Pixi Renderer

Create src/renderer/renderArtboard.ts:

import { Application, Container } from "pixi.js";
import type {
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "../package/types";
import { renderNode } from "./renderNode";

export async function renderArtboardToPixiApp(params: {
  app: Application;
  scene: ArtboardScene;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
}) {
  const { app, scene, assets, tokens } = params;

  app.stage.removeChildren();

  const artboard = new Container();
  artboard.label = scene.name;
  artboard.x = 0;
  artboard.y = 0;

  app.stage.addChild(artboard);

  for (const node of scene.children) {
    if (node.visible === false) continue;

    const displayObject = await renderNode({
      node,
      assets,
      tokens,
    });

    if (displayObject) {
      displayObject.alpha = node.opacity ?? 1;
      artboard.addChild(displayObject);
    }
  }

  return artboard;
}

Create src/renderer/renderNode.ts:

import type {
  AssetManifestEntry,
  SceneNode,
  Tokens,
} from "../package/types";
import { renderImageNode } from "./renderImageNode";
import { renderRectNode } from "./renderRectNode";
import { renderTextNode } from "./renderTextNode";

export async function renderNode(params: {
  node: SceneNode;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
}) {
  const { node, assets, tokens } = params;

  switch (node.type) {
    case "image":
      return renderImageNode({
        node,
        assets,
      });

    case "rect":
      return renderRectNode({
        node,
        tokens,
      });

    case "text":
      return renderTextNode({
        node,
        tokens,
      });

    default:
      return null;
  }
}


---

16. Image Renderer

Create src/renderer/renderImageNode.ts:

import { Assets, Container, Graphics, Sprite } from "pixi.js";
import type { AssetManifestEntry, ImageNode } from "../package/types";

export async function renderImageNode(params: {
  node: ImageNode;
  assets: Record<string, AssetManifestEntry>;
}) {
  const { node, assets } = params;

  const asset = assets[node.assetId];

  if (!asset) {
    throw new Error(`Missing asset: ${node.assetId}`);
  }

  const texture = await Assets.load(asset.path);
  const sprite = new Sprite(texture);

  sprite.x = node.x;
  sprite.y = node.y;

  const imageRatio = texture.width / texture.height;
  const boxRatio = node.width / node.height;

  if (node.fit === "cover") {
    if (imageRatio > boxRatio) {
      sprite.height = node.height;
      sprite.width = node.height * imageRatio;
      sprite.x = node.x - (sprite.width - node.width) / 2;
    } else {
      sprite.width = node.width;
      sprite.height = node.width / imageRatio;
      sprite.y = node.y - (sprite.height - node.height) / 2;
    }

    const mask = new Graphics()
      .rect(node.x, node.y, node.width, node.height)
      .fill(0xffffff);

    sprite.mask = mask;

    const group = new Container();
    group.addChild(sprite);
    group.addChild(mask);

    return group;
  }

  if (node.fit === "contain") {
    if (imageRatio > boxRatio) {
      sprite.width = node.width;
      sprite.height = node.width / imageRatio;
    } else {
      sprite.height = node.height;
      sprite.width = node.height * imageRatio;
    }

    sprite.x = node.x + (node.width - sprite.width) / 2;
    sprite.y = node.y + (node.height - sprite.height) / 2;

    return sprite;
  }

  sprite.x = node.x;
  sprite.y = node.y;
  sprite.width = node.width;
  sprite.height = node.height;

  return sprite;
}


---

17. Rectangle Renderer

Create src/renderer/renderRectNode.ts:

import { Graphics, Sprite } from "pixi.js";
import type { RectNode, Tokens } from "../package/types";
import { createGradientTexture } from "./gradients";
import { resolvePaint } from "./tokenResolver";

export function renderRectNode(params: {
  node: RectNode;
  tokens: Tokens;
}) {
  const { node, tokens } = params;

  const fill = resolvePaint(node.style.fill, tokens);

  if (!fill) {
    return null;
  }

  if (fill.type === "solid") {
    const graphics = new Graphics();

    graphics
      .roundRect(
        node.x,
        node.y,
        node.width,
        node.height,
        node.style.radius ?? 0
      )
      .fill({
        color: fill.color,
        alpha: fill.opacity ?? 1,
      });

    return graphics;
  }

  if (fill.type === "linear-gradient") {
    const gradientTexture = createGradientTexture({
      width: node.width,
      height: node.height,
      angle: fill.angle,
      stops: fill.stops,
    });

    const sprite = new Sprite(gradientTexture);

    sprite.x = node.x;
    sprite.y = node.y;
    sprite.width = node.width;
    sprite.height = node.height;

    return sprite;
  }

  return null;
}


---

18. Text Renderer

Create src/renderer/renderTextNode.ts:

import { Text, TextStyle } from "pixi.js";
import type { TextNode, Tokens } from "../package/types";
import { resolveTextStyle } from "./tokenResolver";

export function renderTextNode(params: {
  node: TextNode;
  tokens: Tokens;
}) {
  const { node, tokens } = params;

  const style = resolveTextStyle(node.style, tokens);

  const displayText =
    style.textTransform === "uppercase"
      ? node.text.toUpperCase()
      : node.text;

  const text = new Text({
    text: displayText,
    style: new TextStyle({
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: String(style.fontWeight ?? 400),
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      fill: style.color,
      align: style.align ?? "left",
      wordWrap: true,
      wordWrapWidth: node.width,
      whiteSpace: "pre-line",
    }),
  });

  text.x = node.x;
  text.y = node.y;

  if (style.align === "right") {
    text.anchor.set(1, 0);
    text.x = node.x + node.width;
  }

  return text;
}


---

19. React Artboard Preview Component

Create src/app/ArtboardPreview.tsx:

import { Application } from "pixi.js";
import { useEffect, useRef } from "react";
import type {
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "../package/types";
import { renderArtboardToPixiApp } from "../renderer/renderArtboard";

type Props = {
  scene: ArtboardScene;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
  scale?: number;
};

export function ArtboardPreview({
  scene,
  assets,
  tokens,
  scale = 1,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application();

    let destroyed = false;

    async function init() {
      await app.init({
        width: scene.width,
        height: scene.height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: "webgl",
      });

      if (destroyed || !containerRef.current) return;

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(app.canvas);

      app.canvas.style.width = `${scene.width * scale}px`;
      app.canvas.style.height = `${scene.height * scale}px`;

      await renderArtboardToPixiApp({
        app,
        scene,
        assets,
        tokens,
      });
    }

    init();

    return () => {
      destroyed = true;
      app.destroy(true);
    };
  }, [scene, assets, tokens, scale]);

  return (
    <div
      ref={containerRef}
      style={{
        width: scene.width * scale,
        height: scene.height * scale,
        overflow: "hidden",
        background: "#ffffff",
      }}
    />
  );
}


---

20. Infinite Canvas Shell

For the POC, this can be a simple scrollable/zoomable DOM canvas. Do not build full pan/zoom editor behavior yet.

Create src/app/DesignCanvas.tsx:

import type {
  ArtboardManifestEntry,
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "../package/types";
import { ArtboardPreview } from "./ArtboardPreview";

type Props = {
  manifestArtboards: ArtboardManifestEntry[];
  scenes: Record<string, ArtboardScene>;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
  selectedArtboardId?: string;
  zoom: number;
  onSelectArtboard: (id: string) => void;
};

export function DesignCanvas({
  manifestArtboards,
  scenes,
  assets,
  tokens,
  selectedArtboardId,
  zoom,
  onSelectArtboard,
}: Props) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "auto",
        background: "#2b2b2b",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 3400 * zoom,
          height: 1400 * zoom,
          transformOrigin: "top left",
        }}
      >
        {manifestArtboards.map((artboard) => {
          const isSelected = selectedArtboardId === artboard.id;
          const shouldHydrate = isSelected || zoom > 0.3;
          const scene = scenes[artboard.id];

          return (
            <button
              key={artboard.id}
              onClick={() => onSelectArtboard(artboard.id)}
              style={{
                position: "absolute",
                left: (artboard.x ?? 0) * zoom,
                top: (artboard.y ?? 0) * zoom,
                width: artboard.width * zoom,
                height: artboard.height * zoom,
                border: isSelected ? "4px solid #3b82f6" : "1px solid #555",
                padding: 0,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {shouldHydrate && scene ? (
                <ArtboardPreview
                  scene={scene}
                  assets={assets}
                  tokens={tokens}
                  scale={zoom}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#111",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "system-ui",
                  }}
                >
                  {artboard.name}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


---

21. App Wiring

Create src/app/App.tsx:

import { useState } from "react";

import manifestJson from "../sample/manifest.json";
import tokensJson from "../sample/tokens.json";
import squareSceneJson from "../sample/artboards/square-1080.scene.json";
import wideSceneJson from "../sample/artboards/wide-1920.scene.json";

import { DesignPackageManifestSchema } from "../schema/designPackage.schema";
import { ArtboardSceneSchema } from "../schema/nodes.schema";
import type {
  ArtboardScene,
  DesignPackageManifest,
  Tokens,
} from "../package/types";
import { DesignCanvas } from "./DesignCanvas";

export default function App() {
  const manifest = DesignPackageManifestSchema.parse(
    manifestJson
  ) as DesignPackageManifest;

  const tokens = tokensJson as Tokens;

  const squareScene = ArtboardSceneSchema.parse(
    squareSceneJson
  ) as ArtboardScene;

  const wideScene = ArtboardSceneSchema.parse(
    wideSceneJson
  ) as ArtboardScene;

  const scenes: Record<string, ArtboardScene> = {
    [squareScene.id]: squareScene,
    [wideScene.id]: wideScene,
  };

  const [selectedArtboardId, setSelectedArtboardId] = useState<string>(
    manifest.artboards[0].id
  );

  const [zoom, setZoom] = useState(0.25);

  return (
    <div>
      <div
        style={{
          position: "fixed",
          zIndex: 10,
          left: 16,
          top: 16,
          background: "white",
          borderRadius: 8,
          padding: 12,
          fontFamily: "system-ui",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <strong>Design Package POC</strong>

        <div style={{ marginTop: 8 }}>
          <label>
            Zoom:{" "}
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            {zoom.toFixed(2)}
          </label>
        </div>
      </div>

      <DesignCanvas
        manifestArtboards={manifest.artboards}
        scenes={scenes}
        assets={manifest.assets}
        tokens={tokens}
        selectedArtboardId={selectedArtboardId}
        zoom={zoom}
        onSelectArtboard={setSelectedArtboardId}
      />
    </div>
  );
}

Update src/main.tsx:

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


---

22. Add Font Loading

For the POC, load the custom font using CSS.

Create src/index.css:

@font-face {
  font-family: "Inter";
  src: url("/sample-assets/Inter-Bold.woff2") format("woff2");
  font-weight: 700;
}

html,
body,
#root {
  margin: 0;
  width: 100%;
  height: 100%;
}

Import it in src/main.tsx:

import "./index.css";


---

23. Export Selected Artboard to PNG

Create src/renderer/exportArtboard.ts:

import { Application } from "pixi.js";
import type {
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "../package/types";
import { renderArtboardToPixiApp } from "./renderArtboard";

export async function exportArtboardToPng(params: {
  scene: ArtboardScene;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
}) {
  const { scene, assets, tokens } = params;

  const app = new Application();

  await app.init({
    width: scene.width,
    height: scene.height,
    backgroundAlpha: 0,
    antialias: true,
    resolution: 1,
    autoDensity: true,
    preference: "webgl",
  });

  await renderArtboardToPixiApp({
    app,
    scene,
    assets,
    tokens,
  });

  const canvas = app.canvas;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Failed to create PNG blob"));
        return;
      }

      resolve(result);
    }, "image/png");
  });

  app.destroy(true);

  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

Add an export button in App.tsx:

import { exportArtboardToPng, downloadBlob } from "../renderer/exportArtboard";

Inside the control panel:

<button
  onClick={async () => {
    const scene = scenes[selectedArtboardId];
    const blob = await exportArtboardToPng({
      scene,
      assets: manifest.assets,
      tokens,
    });

    downloadBlob(blob, `${scene.id}.png`);
  }}
>
  Export selected PNG
</button>


---

24. Basic Package Save with JSZip

Create src/package/saveDesignPackage.ts:

import JSZip from "jszip";
import type {
  ArtboardScene,
  DesignPackageManifest,
  Tokens,
} from "./types";

export async function saveDesignPackage(params: {
  manifest: DesignPackageManifest;
  tokens: Tokens;
  scenes: Record<string, ArtboardScene>;
}) {
  const { manifest, tokens, scenes } = params;

  const zip = new JSZip();

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("tokens.json", JSON.stringify(tokens, null, 2));

  for (const artboard of manifest.artboards) {
    const scene = scenes[artboard.id];

    if (!scene) {
      throw new Error(`Missing scene for artboard: ${artboard.id}`);
    }

    zip.file(artboard.path, JSON.stringify(scene, null, 2));
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
  });
}

Usage:

const blob = await saveDesignPackage({
  manifest,
  tokens,
  scenes,
});

downloadBlob(blob, "campaign-banners.designpkg");


---

25. Basic Package Load with JSZip

Create src/package/loadDesignPackage.ts:

import JSZip from "jszip";
import { DesignPackageManifestSchema } from "../schema/designPackage.schema";
import { ArtboardSceneSchema } from "../schema/nodes.schema";
import type {
  ArtboardScene,
  DesignPackageManifest,
  Tokens,
} from "./types";

export async function loadDesignPackage(file: File) {
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file("manifest.json");

  if (!manifestFile) {
    throw new Error("Package missing manifest.json");
  }

  const manifestJson = await manifestFile.async("string");
  const manifest = DesignPackageManifestSchema.parse(
    JSON.parse(manifestJson)
  ) as DesignPackageManifest;

  const tokensFile = zip.file(manifest.tokens);

  if (!tokensFile) {
    throw new Error(`Package missing tokens file: ${manifest.tokens}`);
  }

  const tokensJson = await tokensFile.async("string");
  const tokens = JSON.parse(tokensJson) as Tokens;

  const scenes: Record<string, ArtboardScene> = {};

  for (const artboard of manifest.artboards) {
    const sceneFile = zip.file(artboard.path);

    if (!sceneFile) {
      throw new Error(`Package missing artboard scene: ${artboard.path}`);
    }

    const sceneJson = await sceneFile.async("string");

    scenes[artboard.id] = ArtboardSceneSchema.parse(
      JSON.parse(sceneJson)
    ) as ArtboardScene;
  }

  return {
    manifest,
    tokens,
    scenes,
  };
}


---

26. Hydration Rules

For the POC, hydration can be simple:

export function shouldHydrateArtboard(params: {
  isSelected: boolean;
  zoom: number;
}) {
  if (params.isSelected) return true;
  if (params.zoom > 0.3) return true;
  return false;
}

Future version:

export function shouldHydrateArtboard(params: {
  isSelected: boolean;
  isVisible: boolean;
  zoom: number;
  memoryBudgetAvailable: boolean;
  isPreviewDirty: boolean;
}) {
  if (params.isSelected) return true;

  if (
    params.isVisible &&
    params.zoom > 0.35 &&
    params.memoryBudgetAvailable
  ) {
    return true;
  }

  if (params.isPreviewDirty && params.isVisible) {
    return true;
  }

  return false;
}


---

27. Agent Patch Model

Agents should modify the scene graph through validated patches. They should not emit Pixi code.

Create src/package/patches.ts:

import { z } from "zod";
import { SceneNodeSchema } from "../schema/nodes.schema";
import type { ArtboardScene, SceneNode } from "./types";

export const AddNodePatchSchema = z.object({
  op: z.literal("addNode"),
  artboardId: z.string(),
  node: SceneNodeSchema,
  index: z.number().optional(),
});

export const UpdateNodePatchSchema = z.object({
  op: z.literal("updateNode"),
  artboardId: z.string(),
  nodeId: z.string(),
  patch: z.record(z.string(), z.unknown()),
});

export const DeleteNodePatchSchema = z.object({
  op: z.literal("deleteNode"),
  artboardId: z.string(),
  nodeId: z.string(),
});

export const DesignPatchSchema = z.discriminatedUnion("op", [
  AddNodePatchSchema,
  UpdateNodePatchSchema,
  DeleteNodePatchSchema,
]);

export type DesignPatch = z.infer<typeof DesignPatchSchema>;

export function applyPatch(scene: ArtboardScene, patch: DesignPatch) {
  if (patch.artboardId !== scene.id) {
    throw new Error(
      `Patch targets ${patch.artboardId}, but scene is ${scene.id}`
    );
  }

  if (patch.op === "addNode") {
    const nextChildren = [...scene.children];
    const index = patch.index ?? nextChildren.length;

    nextChildren.splice(index, 0, patch.node as SceneNode);

    return {
      ...scene,
      children: nextChildren,
    };
  }

  if (patch.op === "updateNode") {
    return {
      ...scene,
      children: scene.children.map((node) =>
        node.id === patch.nodeId
          ? ({
              ...node,
              ...patch.patch,
            } as SceneNode)
          : node
      ),
    };
  }

  if (patch.op === "deleteNode") {
    return {
      ...scene,
      children: scene.children.filter((node) => node.id !== patch.nodeId),
    };
  }

  return scene;
}

Example patch:

{
  "op": "updateNode",
  "artboardId": "artboard.square.1080",
  "nodeId": "square.primary.headline",
  "patch": {
    "text": "MOVE\nFASTER"
  }
}


---

28. Validation Rules for POC

Add deterministic checks after loading or patching.

Minimum validation rules:

Rule	Description

Asset existence	Every assetId must exist in manifest.assets
Token resolution	Every {token.path} must resolve
Artboard bounds	Nodes should be allowed to overflow for now, but warn
Text required fields	Text must include text, font family, font size, color
Export size	Artboard width/height must be positive
Duplicate node IDs	Scene children must have unique IDs


Create src/package/validateScene.ts:

import type {
  ArtboardScene,
  AssetManifestEntry,
  Tokens,
} from "./types";
import { resolveTokenPath } from "../renderer/tokenResolver";

export function validateSceneReferences(params: {
  scene: ArtboardScene;
  assets: Record<string, AssetManifestEntry>;
  tokens: Tokens;
}) {
  const { scene, assets, tokens } = params;

  const errors: string[] = [];
  const nodeIds = new Set<string>();

  for (const node of scene.children) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }

    nodeIds.add(node.id);

    if (node.type === "image" && !assets[node.assetId]) {
      errors.push(`Missing image asset ${node.assetId} in node ${node.id}`);
    }

    checkObjectForTokens(node, tokens, errors, node.id);
  }

  return errors;
}

function checkObjectForTokens(
  value: unknown,
  tokens: Tokens,
  errors: string[],
  context: string
) {
  if (typeof value === "string" && value.startsWith("{")) {
    try {
      resolveTokenPath(value, tokens);
    } catch (error) {
      errors.push(`${context}: ${(error as Error).message}`);
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      checkObjectForTokens(item, tokens, errors, context);
    }
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      checkObjectForTokens(child, tokens, errors, context);
    }
  }
}


---

29. POC Milestones

Milestone 1: Static render

Goal:

Load two hardcoded JSON scenes and render both with Pixi.

Acceptance criteria:

Both artboards render.

Background image appears.

Logo appears.

Gradient overlay appears.

Text appears with expected colors.

Artboards are displayed side by side.



---

Milestone 2: Token resolution

Goal:

Replace hardcoded colors/fonts with token references.

Acceptance criteria:

{colors.yellow} resolves.

{colors.white} resolves.

{fonts.headline.fontFamily} resolves.

Invalid token paths fail validation.



---

Milestone 3: Package save/load

Goal:

Export and re-import a .designpkg file.

Acceptance criteria:

Package writes manifest.json, tokens.json, and scenes.

Package re-loads with JSZip.

Loaded package renders identically.



---

Milestone 4: Basic hydration

Goal:

Render raster/placeholder preview until artboard is selected or zoomed in.

Acceptance criteria:

Unselected artboards show placeholder or preview.

Selected artboard hydrates to Pixi canvas.

Changing zoom affects hydration.



---

Milestone 5: Export selected artboard

Goal:

Export selected artboard to PNG.

Acceptance criteria:

PNG downloads.

Export size matches artboard size.

Export includes background, overlay, panel, logo, and text.



---

Milestone 6: Agent patching

Goal:

Apply JSON patch to modify text or colors.

Acceptance criteria:

Patch validates through Zod.

Patch updates scene.

Renderer updates.

Invalid patch is rejected.



---

30. Key Architecture Rules

Rule 1: Scene graph owns the design

Do not make Pixi objects the source of truth.

Correct:

scene.json → Pixi render tree

Incorrect:

Pixi render tree → design document


---

Rule 2: Agents modify JSON, not renderer code

Correct:

{
  "op": "updateNode",
  "nodeId": "square.primary.headline",
  "patch": {
    "text": "MOVE\nFASTER"
  }
}

Incorrect:

pixiText.text = "MOVE\nFASTER";


---

Rule 3: Keep artboards as hydration boundaries

Each artboard should be independently loadable, renderable, and exportable.


---

Rule 4: Keep assets externally referenced

Scene nodes should reference assetId, not raw file paths.

Correct:

{
  "type": "image",
  "assetId": "background.hero"
}

Incorrect:

{
  "type": "image",
  "src": "/some/path/background.jpg"
}


---

Rule 5: Tokenize brand decisions

Use tokens for colors, fonts, and reusable effects.

Correct:

{
  "color": "{colors.yellow}"
}


---

31. Known Limitations of This POC

Limitation	Why acceptable for POC

Gradient is rendered as generated texture	Good enough for visual rendering
Text layout may not match HTML/PDF/PSD exactly	POC validates model, not full typography parity
Pixi scene is not editable yet	First goal is render/export
No true thumbnails yet	Placeholder can be replaced by generated preview
No PSD export	Scene model is structured to allow future mapping
No DOM overlay text editing	Add after scene graph and renderer stabilize
No advanced layout	Fixed-position banners are enough for first proof



---

32. Future Extensions

After the POC works, add:

1. DOM text editing overlay


2. Real generated thumbnails per artboard


3. Spatial index for viewport visibility


4. Dependency graph


5. Asset garbage collection


6. HTML/CSS export


7. SVG export


8. PDF export


9. PSD export adapter


10. Figma import/export adapter


11. IDML export adapter


12. VLM visual evaluation


13. Deterministic brand validation


14. Agent-generated design variants


15. Package migrations




---

33. Success Criteria

The POC is successful when a developer can:

Open the app

See both artboards

Select one artboard

Hydrate the selected artboard into a Pixi canvas

Export the selected artboard to PNG

Save the design package as .designpkg

Re-load the package

Apply a JSON patch to change text

Re-render the updated design


The result should prove that the design system can be:

serializable
agent-modifiable
renderer-independent
asset-aware
token-aware
exportable


---

34. Recommended First Implementation Order

Build in this order:

1. TypeScript types


2. Zod schemas


3. Sample manifest/tokens/scenes


4. Token resolver


5. Pixi renderer


6. React artboard preview


7. Simple infinite canvas shell


8. PNG export


9. JSZip save/load


10. Agent patching



Do not start with package loading or editor interactions. First prove that the canonical scene graph can render both artboards correctly.