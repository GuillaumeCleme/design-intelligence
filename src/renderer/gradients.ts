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
