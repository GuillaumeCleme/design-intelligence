import { useCallback, useRef } from "react";
import { useEditorStore } from "./store";
import { TransformHandles } from "./TransformHandles";
import type { ArtboardScene, SceneNode } from "@/package/types";

type Props = {
  scene: ArtboardScene;
  scale: number;
  onUpdateNode: (artboardId: string, nodeId: string, patch: Partial<SceneNode>) => void;
};

function hitTest(
  scene: ArtboardScene,
  canvasX: number,
  canvasY: number,
  scale: number,
): SceneNode | null {
  const sceneX = canvasX / scale;
  const sceneY = canvasY / scale;

  for (let i = scene.children.length - 1; i >= 0; i--) {
    const node = scene.children[i];
    if (node.visible === false) continue;
    if (
      sceneX >= node.x &&
      sceneX <= node.x + node.width &&
      sceneY >= node.y &&
      sceneY <= node.y + node.height
    ) {
      return node;
    }
  }
  return null;
}

export function SelectionOverlay({ scene, scale, onUpdateNode }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const {
    selectedNodeIds,
    hoveredNodeId,
    selectNode,
    deselectAll,
    setHoveredNode,
    openContextMenu,
  } = useEditorStore();

  const getLocalCoords = useCallback(
    (e: React.MouseEvent) => {
      if (!overlayRef.current) return { x: 0, y: 0 };
      const rect = overlayRef.current.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const coords = getLocalCoords(e);
      const hit = hitTest(scene, coords.x, coords.y, scale);
      if (hit) {
        selectNode(hit.id, e.shiftKey);
      } else {
        deselectAll();
      }
    },
    [scene, scale, selectNode, deselectAll, getLocalCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const coords = getLocalCoords(e);
      const hit = hitTest(scene, coords.x, coords.y, scale);
      setHoveredNode(hit?.id ?? null);
    },
    [scene, scale, setHoveredNode, getLocalCoords],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const coords = getLocalCoords(e);
      const hit = hitTest(scene, coords.x, coords.y, scale);
      if (hit) {
        openContextMenu(hit.id, e.clientX, e.clientY);
      }
    },
    [scene, scale, openContextMenu, getLocalCoords],
  );

  const handleNodeUpdate = useCallback(
    (nodeId: string, patch: Partial<SceneNode>) => {
      onUpdateNode(scene.id, nodeId, patch);
    },
    [scene.id, onUpdateNode],
  );

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 overflow-visible"
      style={{ cursor: "default" }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredNode(null)}
      onContextMenu={handleContextMenu}
    >
      {/* Hover outline */}
      {hoveredNodeId && !selectedNodeIds.includes(hoveredNodeId) && (() => {
        const node = scene.children.find((n) => n.id === hoveredNodeId);
        if (!node) return null;
        return (
          <div
            className="absolute border-2 border-brand/60 pointer-events-none"
            style={{
              left: node.x * scale,
              top: node.y * scale,
              width: node.width * scale,
              height: node.height * scale,
            }}
          />
        );
      })()}

      {/* Transform handles for selected nodes */}
      {selectedNodeIds.map((nodeId) => {
        const node = scene.children.find((n) => n.id === nodeId);
        if (!node) return null;

        return (
          <TransformHandles
            key={`handles-${nodeId}`}
            node={node}
            scale={scale}
            onUpdate={(patch) => handleNodeUpdate(nodeId, patch)}
          />
        );
      })}
    </div>
  );
}
