import { Text, TextStyle } from "pixi.js";
import type { TextStyleFontWeight } from "pixi.js";
import type { TextNode, Tokens } from "../package/types";
import { resolveTextStyle } from "./tokenResolver";

export function renderTextNode(params: { node: TextNode; tokens: Tokens }) {
  const { node, tokens } = params;

  const style = resolveTextStyle(node.style, tokens);

  const displayText =
    style.textTransform === "uppercase" ? node.text.toUpperCase() : node.text;

  const text = new Text({
    text: displayText,
    style: new TextStyle({
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: String(style.fontWeight ?? 400) as TextStyleFontWeight,
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
