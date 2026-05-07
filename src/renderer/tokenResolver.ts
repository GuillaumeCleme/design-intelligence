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

export function resolveTextStyle<
  T extends { fontFamily: string; color: string },
>(style: T, tokens: Tokens): T {
  return {
    ...style,
    fontFamily: resolveTokenPath(style.fontFamily, tokens) as string,
    color: resolveColor(style.color, tokens),
  };
}
