import { writePsd } from "ag-psd";
import type { Psd, Layer } from "ag-psd";
import type {
  ExportPlugin,
  ExportContext,
  ExportResult,
} from "../types";
import { ExportScope } from "../types";
import type {
  ArtboardScene,
  SceneNode,
  ImageNode,
  RectNode,
  TextNode,
  AssetManifestEntry,
  Tokens,
  Paint,
} from "@/package/types";
import { resolveColor, resolvePaint, resolveTextStyle } from "@/renderer/tokenResolver";

type PsdExportOptions = {
  includeAllArtboards: boolean;
  flattenImages: boolean;
  preserveLayerNames: boolean;
  resolution: number;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function createSolidColorCanvas(
  width: number,
  height: number,
  color: string,
  opacity: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const { r, g, b } = hexToRgb(color);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

function createGradientCanvas(
  width: number,
  height: number,
  paint: Extract<Paint, { type: "linear-gradient" }>
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const normalizedAngle = ((paint.angle % 360) + 360) % 360;
  let x0 = 0, y0 = 0, x1 = width, y1 = 0;

  if (normalizedAngle === 270) {
    x0 = width; y0 = 0; x1 = 0; y1 = 0;
  } else if (normalizedAngle === 90) {
    x0 = 0; y0 = 0; x1 = width; y1 = 0;
  } else if (normalizedAngle === 180) {
    x0 = 0; y0 = height; x1 = 0; y1 = 0;
  } else if (normalizedAngle === 0) {
    x0 = 0; y0 = 0; x1 = 0; y1 = height;
  }

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const stop of paint.stops) {
    const { r, g, b } = hexToRgb(stop.color);
    gradient.addColorStop(stop.offset, `rgba(${r}, ${g}, ${b}, ${stop.opacity})`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

async function loadImageToCanvas(
  src: string,
  width: number,
  height: number,
  fit: "cover" | "contain" | "fill" | undefined
): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const imageRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = width / height;

  if (fit === "cover") {
    let sw: number, sh: number, sx: number, sy: number;
    if (imageRatio > boxRatio) {
      sh = img.naturalHeight;
      sw = sh * boxRatio;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / boxRatio;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  } else if (fit === "contain") {
    let dw: number, dh: number;
    if (imageRatio > boxRatio) {
      dw = width;
      dh = width / imageRatio;
    } else {
      dh = height;
      dw = height * imageRatio;
    }
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }

  return canvas;
}

function createTextCanvas(
  node: TextNode,
  tokens: Tokens
): HTMLCanvasElement {
  const style = resolveTextStyle(node.style, tokens);

  const canvas = document.createElement("canvas");
  canvas.width = node.width;
  canvas.height = node.height;
  const ctx = canvas.getContext("2d")!;

  const displayText =
    style.textTransform === "uppercase" ? node.text.toUpperCase() : node.text;

  ctx.font = `${style.fontWeight ?? 400} ${style.fontSize}px ${style.fontFamily}`;
  ctx.fillStyle = resolveColor(style.color, tokens);
  ctx.textBaseline = "top";

  if (style.align === "right") {
    ctx.textAlign = "right";
  } else if (style.align === "center") {
    ctx.textAlign = "center";
  } else {
    ctx.textAlign = "left";
  }

  const lines = displayText.split("\n");
  const lineHeight = style.lineHeight ?? style.fontSize * 1.2;

  for (let i = 0; i < lines.length; i++) {
    let x = 0;
    if (style.align === "right") x = node.width;
    else if (style.align === "center") x = node.width / 2;

    ctx.fillText(lines[i], x, i * lineHeight);
  }

  return canvas;
}

async function sceneNodeToLayer(
  node: SceneNode,
  assets: Record<string, AssetManifestEntry>,
  tokens: Tokens,
  preserveNames: boolean
): Promise<Layer> {
  const layer: Layer = {
    name: preserveNames ? (node.name ?? node.id) : node.id,
    left: node.x,
    top: node.y,
    right: node.x + node.width,
    bottom: node.y + node.height,
    opacity: node.opacity ?? 1,
    hidden: node.visible === false,
  };

  switch (node.type) {
    case "image": {
      const imageNode = node as ImageNode;
      const asset = assets[imageNode.assetId];
      if (asset) {
        layer.canvas = await loadImageToCanvas(
          asset.path,
          imageNode.width,
          imageNode.height,
          imageNode.fit
        );
      }
      break;
    }

    case "rect": {
      const rectNode = node as RectNode;
      const resolvedPaint = resolvePaint(rectNode.style.fill, tokens);

      if (resolvedPaint?.type === "solid") {
        layer.canvas = createSolidColorCanvas(
          rectNode.width,
          rectNode.height,
          resolvedPaint.color,
          resolvedPaint.opacity ?? 1
        );
      } else if (resolvedPaint?.type === "linear-gradient") {
        layer.canvas = createGradientCanvas(
          rectNode.width,
          rectNode.height,
          resolvedPaint
        );
      }
      break;
    }

    case "text": {
      const textNode = node as TextNode;
      layer.canvas = createTextCanvas(textNode, tokens);
      break;
    }
  }

  return layer;
}

async function artboardToGroup(
  scene: ArtboardScene,
  assets: Record<string, AssetManifestEntry>,
  tokens: Tokens,
  options: PsdExportOptions
): Promise<Layer> {
  const children: Layer[] = [];

  for (const node of scene.children) {
    if (node.visible === false) continue;

    const layer = await sceneNodeToLayer(
      node,
      assets,
      tokens,
      options.preserveLayerNames
    );
    children.push(layer);
  }

  return {
    name: scene.name,
    children,
    opened: true,
  };
}

async function executeExport(
  context: ExportContext,
  options: Record<string, unknown>
): Promise<ExportResult> {
  const opts = options as unknown as PsdExportOptions;

  const artboardIds = opts.includeAllArtboards
    ? Object.keys(context.scenes)
    : context.selectedArtboardId
      ? [context.selectedArtboardId]
      : Object.keys(context.scenes);

  const scenes = artboardIds
    .map((id) => context.scenes[id])
    .filter(Boolean);

  if (scenes.length === 0) {
    throw new Error("No artboards to export");
  }

  const docWidth = Math.max(...scenes.map((s) => s.width));
  const docHeight = Math.max(...scenes.map((s) => s.height));

  const artboardGroups: Layer[] = [];

  for (const scene of scenes) {
    const group = await artboardToGroup(
      scene,
      context.assets,
      context.tokens,
      opts
    );
    artboardGroups.push(group);
  }

  const psd: Psd = {
    width: docWidth,
    height: docHeight,
    children: artboardGroups,
    imageResources: {
      resolutionInfo: {
        horizontalResolution: opts.resolution,
        horizontalResolutionUnit: "PPI",
        widthUnit: "Inches",
        verticalResolution: opts.resolution,
        verticalResolutionUnit: "PPI",
        heightUnit: "Inches",
      },
    },
  };

  const buffer = writePsd(psd);
  const blob = new Blob([buffer], { type: "image/vnd.adobe.photoshop" });

  const filename = context.manifest.name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  return {
    blob,
    filename: `${filename}.psd`,
    mimeType: "image/vnd.adobe.photoshop",
  };
}

export const psdExportPlugin: ExportPlugin = {
  id: "builtin:psd",
  name: "Photoshop (PSD)",
  description:
    "Export as a fully layered Photoshop document with multiple artboards",
  fileExtension: "psd",
  mimeType: "image/vnd.adobe.photoshop",
  icon: "FileImage",
  version: "1.0.0",

  capabilities: {
    scopes: [
      ExportScope.SingleArtboard,
      ExportScope.AllArtboards,
      ExportScope.FullDocument,
    ],
    supportsLayers: true,
    supportsTransparency: true,
  },

  optionFields: [
    {
      key: "includeAllArtboards",
      label: "Include all artboards",
      type: "boolean",
      defaultValue: true,
      description: "Export all artboards as layer groups in a single PSD",
    },
    {
      key: "flattenImages",
      label: "Flatten images",
      type: "boolean",
      defaultValue: false,
      description: "Merge image layers into a single rasterized layer",
    },
    {
      key: "preserveLayerNames",
      label: "Preserve layer names",
      type: "boolean",
      defaultValue: true,
      description: "Use scene node names as PSD layer names",
    },
    {
      key: "resolution",
      label: "Resolution (PPI)",
      type: "select",
      defaultValue: 72,
      options: [
        { label: "72 PPI (Screen)", value: 72 },
        { label: "150 PPI (Medium)", value: 150 },
        { label: "300 PPI (Print)", value: 300 },
      ],
      description: "Output resolution in pixels per inch",
    },
  ],

  execute: executeExport,

  validate: (context) => {
    if (Object.keys(context.scenes).length === 0) {
      return "No artboards available to export";
    }
    return null;
  },
};
