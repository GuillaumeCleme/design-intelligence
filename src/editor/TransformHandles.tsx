import { useCallback, useRef, useState } from "react";
import type { SceneNode } from "@/package/types";
import { useEditorStore } from "./store";

type Props = {
  node: SceneNode;
  scale: number;
  onUpdate: (patch: Partial<SceneNode>) => void;
};

type HandlePosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "right"
  | "bottom"
  | "left";

const HANDLE_SIZE = 12;
const MIN_SIZE = 10;

export function TransformHandles({ node, scale, onUpdate }: Props) {
  const [dragging, setDragging] = useState<{
    type: "move" | "resize";
    handle?: HandlePosition;
    startX: number;
    startY: number;
    startNodeX: number;
    startNodeY: number;
    startNodeW: number;
    startNodeH: number;
  } | null>(null);

  const previewRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [preview, setPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const handleMoveStart = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setDragging({
        type: "move",
        startX: e.clientX,
        startY: e.clientY,
        startNodeX: node.x,
        startNodeY: node.y,
        startNodeW: node.width,
        startNodeH: node.height,
      });
    },
    [node.x, node.y, node.width, node.height],
  );

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, handle: HandlePosition) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setDragging({
        type: "resize",
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startNodeX: node.x,
        startNodeY: node.y,
        startNodeW: node.width,
        startNodeH: node.height,
      });
    },
    [node.x, node.y, node.width, node.height],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      e.stopPropagation();

      const dx = (e.clientX - dragging.startX) / scale;
      const dy = (e.clientY - dragging.startY) / scale;

      if (dragging.type === "move") {
        const p = {
          x: Math.round(dragging.startNodeX + dx),
          y: Math.round(dragging.startNodeY + dy),
          width: dragging.startNodeW,
          height: dragging.startNodeH,
        };
        previewRef.current = p;
        setPreview(p);
        return;
      }

      const h = dragging.handle!;
      let newX = dragging.startNodeX;
      let newY = dragging.startNodeY;
      let newW = dragging.startNodeW;
      let newH = dragging.startNodeH;

      if (h.includes("left")) {
        newW = Math.max(MIN_SIZE, dragging.startNodeW - dx);
        newX = dragging.startNodeX + dragging.startNodeW - newW;
      }
      if (h.includes("right")) {
        newW = Math.max(MIN_SIZE, dragging.startNodeW + dx);
      }
      if (h.includes("top")) {
        newH = Math.max(MIN_SIZE, dragging.startNodeH - dy);
        newY = dragging.startNodeY + dragging.startNodeH - newH;
      }
      if (h.includes("bottom")) {
        newH = Math.max(MIN_SIZE, dragging.startNodeH + dy);
      }

      if (e.shiftKey) {
        const aspect = dragging.startNodeW / dragging.startNodeH;
        if (h === "left" || h === "right") {
          newH = Math.round(newW / aspect);
        } else if (h === "top" || h === "bottom") {
          newW = Math.round(newH * aspect);
        } else {
          const avgScale = (newW / dragging.startNodeW + newH / dragging.startNodeH) / 2;
          newW = Math.round(dragging.startNodeW * avgScale);
          newH = Math.round(dragging.startNodeH * avgScale);
        }
      }

      const p = {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      };
      previewRef.current = p;
      setPreview(p);
    },
    [dragging, scale],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      e.stopPropagation();

      const p = previewRef.current;
      if (p) {
        onUpdate({
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
        } as Partial<SceneNode>);
      }

      setDragging(null);
      setPreview(null);
      previewRef.current = null;
    },
    [dragging, onUpdate],
  );

  const displayX = preview ? preview.x : node.x;
  const displayY = preview ? preview.y : node.y;
  const displayW = preview ? preview.width : node.width;
  const displayH = preview ? preview.height : node.height;

  const handles: { pos: HandlePosition; cursor: string; x: number; y: number }[] = [
    { pos: "top-left", cursor: "nwse-resize", x: 0, y: 0 },
    { pos: "top-right", cursor: "nesw-resize", x: 1, y: 0 },
    { pos: "bottom-left", cursor: "nesw-resize", x: 0, y: 1 },
    { pos: "bottom-right", cursor: "nwse-resize", x: 1, y: 1 },
    { pos: "top", cursor: "ns-resize", x: 0.5, y: 0 },
    { pos: "right", cursor: "ew-resize", x: 1, y: 0.5 },
    { pos: "bottom", cursor: "ns-resize", x: 0.5, y: 1 },
    { pos: "left", cursor: "ew-resize", x: 0, y: 0.5 },
  ];

  return (
    <div
      className="absolute overflow-visible"
      style={{
        left: displayX * scale,
        top: displayY * scale,
        width: displayW * scale,
        height: displayH * scale,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Selection outline + move area combined */}
      <div
        className="absolute inset-0 border-2 border-ring cursor-move"
        style={{ pointerEvents: "auto" }}
        onPointerDown={handleMoveStart}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          useEditorStore.getState().openContextMenu(node.id, e.clientX, e.clientY);
        }}
      />

      {/* Preview outline during drag */}
      {preview && (
        <div className="absolute inset-0 border-2 border-brand border-dashed pointer-events-none" />
      )}

      {/* Size label */}
      {preview && (
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-brand text-brand-foreground text-[10px] font-mono whitespace-nowrap pointer-events-none"
        >
          {preview.width} × {preview.height}
        </div>
      )}

      {/* Resize handles */}
      {handles.map(({ pos, cursor, x, y }) => (
        <div
          key={pos}
          className="absolute bg-white border-2 border-ring rounded-[2px] shadow-sm"
          style={{
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            left: x * displayW * scale - HANDLE_SIZE / 2,
            top: y * displayH * scale - HANDLE_SIZE / 2,
            cursor,
            pointerEvents: "auto",
            zIndex: 30,
          }}
          onPointerDown={(e) => handleResizeStart(e, pos)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={(e) => e.stopPropagation()}
        />
      ))}
    </div>
  );
}
