import { X, Type, Image, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "./store";
import type { ArtboardScene, SceneNode, TextNode, ImageNode, RectNode } from "@/package/types";

type Props = {
  scene: ArtboardScene;
  open: boolean;
  onClose: () => void;
  onUpdateNode: (artboardId: string, nodeId: string, patch: Partial<SceneNode>) => void;
};

const TYPE_ICONS = {
  text: Type,
  image: Image,
  rect: Square,
};

export function PropertiesPanel({ scene, open, onClose, onUpdateNode }: Props) {
  const { selectedNodeIds } = useEditorStore();

  if (!open || selectedNodeIds.length !== 1) return null;

  const node = scene.children.find((n) => n.id === selectedNodeIds[0]);
  if (!node) return null;

  const Icon = TYPE_ICONS[node.type as keyof typeof TYPE_ICONS] || Square;

  const handleUpdate = (patch: Partial<SceneNode>) => {
    onUpdateNode(scene.id, node.id, patch);
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-64 rounded-xl border border-border",
        "bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand" />
          <span className="text-sm font-medium text-heading truncate">
            {node.name || node.id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent text-text hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Transform section */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="text-[10px] font-medium text-subheading uppercase tracking-wider mb-2">
          Transform
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumericField
            label="X"
            value={node.x}
            onChange={(v) => handleUpdate({ x: v } as Partial<SceneNode>)}
          />
          <NumericField
            label="Y"
            value={node.y}
            onChange={(v) => handleUpdate({ y: v } as Partial<SceneNode>)}
          />
          <NumericField
            label="W"
            value={node.width}
            min={1}
            onChange={(v) => handleUpdate({ width: v } as Partial<SceneNode>)}
          />
          <NumericField
            label="H"
            value={node.height}
            min={1}
            onChange={(v) => handleUpdate({ height: v } as Partial<SceneNode>)}
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="text-[10px] font-medium text-subheading uppercase tracking-wider mb-2">
          Appearance
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumericField
            label="Opacity"
            value={Math.round((node.opacity ?? 1) * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) =>
              handleUpdate({ opacity: v / 100 } as Partial<SceneNode>)
            }
          />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-1.5 text-xs text-text">
            <input
              type="checkbox"
              checked={node.visible !== false}
              onChange={(e) =>
                handleUpdate({ visible: e.target.checked } as Partial<SceneNode>)
              }
              className="rounded border-border"
            />
            Visible
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text">
            <input
              type="checkbox"
              checked={node.locked ?? false}
              onChange={(e) =>
                handleUpdate({ locked: e.target.checked } as Partial<SceneNode>)
              }
              className="rounded border-border"
            />
            Locked
          </label>
        </div>
      </div>

      {/* Type-specific properties */}
      {node.type === "text" && <TextProperties node={node} onUpdate={handleUpdate} />}
      {node.type === "image" && <ImageProperties node={node} onUpdate={handleUpdate} />}
      {node.type === "rect" && <RectProperties node={node} onUpdate={handleUpdate} />}

      {/* Info footer */}
      <div className="px-4 py-2 bg-secondary/30">
        <div className="text-[10px] text-text font-mono truncate">
          {node.id}
        </div>
      </div>
    </div>
  );
}

function TextProperties({
  node,
  onUpdate,
}: {
  node: TextNode;
  onUpdate: (patch: Partial<SceneNode>) => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-border/50">
      <div className="text-[10px] font-medium text-subheading uppercase tracking-wider mb-2">
        Text
      </div>
      <textarea
        value={node.text}
        onChange={(e) => onUpdate({ text: e.target.value } as Partial<SceneNode>)}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-brand/50"
        rows={3}
      />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <NumericField
          label="Size"
          value={node.style.fontSize}
          min={1}
          onChange={(v) =>
            onUpdate({
              style: { ...node.style, fontSize: v },
            } as Partial<SceneNode>)
          }
        />
        <NumericField
          label="Weight"
          value={node.style.fontWeight ?? 400}
          min={100}
          max={900}
          step={100}
          onChange={(v) =>
            onUpdate({
              style: { ...node.style, fontWeight: v },
            } as Partial<SceneNode>)
          }
        />
      </div>
    </div>
  );
}

function ImageProperties({
  node,
  onUpdate,
}: {
  node: ImageNode;
  onUpdate: (patch: Partial<SceneNode>) => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-border/50">
      <div className="text-[10px] font-medium text-subheading uppercase tracking-wider mb-2">
        Image
      </div>
      <div className="text-xs text-text mb-2 truncate">
        Asset: {node.assetId}
      </div>
      <label className="block text-xs text-text mb-1">Fit Mode</label>
      <select
        value={node.fit ?? "fill"}
        onChange={(e) =>
          onUpdate({
            fit: e.target.value as ImageNode["fit"],
          } as Partial<SceneNode>)
        }
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand/50"
      >
        <option value="cover">Cover</option>
        <option value="contain">Contain</option>
        <option value="fill">Fill</option>
      </select>
    </div>
  );
}

function RectProperties({
  node,
  onUpdate,
}: {
  node: RectNode;
  onUpdate: (patch: Partial<SceneNode>) => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-border/50">
      <div className="text-[10px] font-medium text-subheading uppercase tracking-wider mb-2">
        Shape
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumericField
          label="Radius"
          value={node.style.radius ?? 0}
          min={0}
          onChange={(v) =>
            onUpdate({
              style: { ...node.style, radius: v },
            } as Partial<SceneNode>)
          }
        />
      </div>
    </div>
  );
}

function NumericField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-text w-3 shrink-0">{label}</span>
      <div className="relative flex-1">
        <input
          type="number"
          value={Math.round(value)}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="w-full rounded border border-border bg-background px-1.5 py-1 text-[11px] text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-brand/50"
        />
        {suffix && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-text pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
