import { useEffect, useRef } from "react";
import {
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "./store";
import type { ArtboardScene, SceneNode } from "@/package/types";

type Props = {
  scene: ArtboardScene;
  onUpdateNode: (artboardId: string, nodeId: string, patch: Partial<SceneNode>) => void;
  onDeleteNode: (artboardId: string, nodeId: string) => void;
  onDuplicateNode: (artboardId: string, nodeId: string) => void;
  onReorderNode: (artboardId: string, nodeId: string, direction: "up" | "down" | "top" | "bottom") => void;
  onOpenProperties: () => void;
};

export function ContextMenu({
  scene,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onReorderNode,
  onOpenProperties,
}: Props) {
  const { contextMenuPosition, contextMenuNodeId, closeContextMenu } =
    useEditorStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenuPosition) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    }
    window.addEventListener("pointerdown", handleClick);
    return () => window.removeEventListener("pointerdown", handleClick);
  }, [contextMenuPosition, closeContextMenu]);

  useEffect(() => {
    if (!contextMenuPosition) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeContextMenu();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [contextMenuPosition, closeContextMenu]);

  if (!contextMenuPosition || !contextMenuNodeId) return null;

  const node = scene.children.find((n) => n.id === contextMenuNodeId);
  if (!node) return null;

  const nodeIndex = scene.children.indexOf(node);
  const isTop = nodeIndex === scene.children.length - 1;
  const isBottom = nodeIndex === 0;

  const items: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
    separator?: boolean;
  }[] = [
    {
      label: "Properties…",
      icon: <Settings2 className="h-3.5 w-3.5" />,
      onClick: () => {
        onOpenProperties();
        closeContextMenu();
      },
    },
    { label: "", icon: null, onClick: () => {}, separator: true },
    {
      label: "Bring to Front",
      icon: <ArrowUpToLine className="h-3.5 w-3.5" />,
      onClick: () => {
        onReorderNode(scene.id, contextMenuNodeId, "top");
        closeContextMenu();
      },
      disabled: isTop,
    },
    {
      label: "Bring Forward",
      icon: <ArrowUp className="h-3.5 w-3.5" />,
      onClick: () => {
        onReorderNode(scene.id, contextMenuNodeId, "up");
        closeContextMenu();
      },
      disabled: isTop,
    },
    {
      label: "Send Backward",
      icon: <ArrowDown className="h-3.5 w-3.5" />,
      onClick: () => {
        onReorderNode(scene.id, contextMenuNodeId, "down");
        closeContextMenu();
      },
      disabled: isBottom,
    },
    {
      label: "Send to Back",
      icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
      onClick: () => {
        onReorderNode(scene.id, contextMenuNodeId, "bottom");
        closeContextMenu();
      },
      disabled: isBottom,
    },
    { label: "", icon: null, onClick: () => {}, separator: true },
    {
      label: node.visible === false ? "Show" : "Hide",
      icon: node.visible === false
        ? <Eye className="h-3.5 w-3.5" />
        : <EyeOff className="h-3.5 w-3.5" />,
      onClick: () => {
        onUpdateNode(scene.id, contextMenuNodeId, {
          visible: node.visible === false ? true : false,
        } as Partial<SceneNode>);
        closeContextMenu();
      },
    },
    {
      label: node.locked ? "Unlock" : "Lock",
      icon: node.locked
        ? <Unlock className="h-3.5 w-3.5" />
        : <Lock className="h-3.5 w-3.5" />,
      onClick: () => {
        onUpdateNode(scene.id, contextMenuNodeId, {
          locked: !node.locked,
        } as Partial<SceneNode>);
        closeContextMenu();
      },
    },
    { label: "", icon: null, onClick: () => {}, separator: true },
    {
      label: "Duplicate",
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: () => {
        onDuplicateNode(scene.id, contextMenuNodeId);
        closeContextMenu();
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: () => {
        onDeleteNode(scene.id, contextMenuNodeId);
        closeContextMenu();
      },
      destructive: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] rounded-xl border border-border bg-popover/95 backdrop-blur-xl p-1 shadow-2xl animate-in fade-in-0 zoom-in-95"
      style={{
        left: contextMenuPosition.x,
        top: contextMenuPosition.y,
      }}
    >
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={`sep-${i}`} className="my-1 h-px bg-border" />;
        }
        return (
          <button
            key={item.label}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-colors text-left",
              item.disabled
                ? "text-muted-foreground/40 cursor-not-allowed"
                : item.destructive
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-foreground hover:bg-accent",
            )}
          >
            <span className="text-muted-foreground">{item.icon}</span>
            {item.label}
          </button>
        );
      })}

      {/* Node info footer */}
      <div className="mt-1 pt-1 border-t border-border px-3 py-1.5">
        <div className="text-[10px] text-muted-foreground truncate">
          {node.name || node.id} · {node.type} · {node.width}×{node.height}
        </div>
      </div>
    </div>
  );
}
