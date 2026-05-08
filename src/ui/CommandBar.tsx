import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Command,
  Slash,
  Send,
  type LucideIcon,
  MousePointer2,
  Move,
  PenTool,
  Paintbrush,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Image,
  Blend,
  Pipette,
  Hand,
  ZoomIn,
  ZoomOut,
  Crop,
  Trash2,
  Copy,
  Group,
  Ungroup,
  ArrowUpToLine,
  ArrowDownToLine,
  FileImage,
  FileCode,
  FileText,
  Package,
  PackageOpen,
  Undo2,
  Redo2,
  Maximize2,
  Scan,
  Grid3x3,
  Magnet,
  Save,
  FolderOpen,
  FilePlus,
  SquarePlus,
  Scaling,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SLASH_COMMANDS } from "@/tools/registry";
import { useToolStore } from "@/tools/store";
import { ToolId, ActionId } from "@/tools/types";
import type { SlashCommand } from "@/tools/types";
import { useExportSlashCommands, useExecuteExport } from "@/export/useExportPlugins";
import { useExportContext } from "@/export/ExportContextProvider";

const ICON_MAP: Record<string, LucideIcon> = {
  MousePointer2,
  Move,
  PenTool,
  Paintbrush,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Image,
  Blend,
  Pipette,
  Hand,
  ZoomIn,
  ZoomOut,
  Crop,
  Trash2,
  Copy,
  Group,
  Ungroup,
  ArrowUpToLine,
  ArrowDownToLine,
  FileImage,
  FileCode,
  FileText,
  Package,
  PackageOpen,
  Undo2,
  Redo2,
  Maximize2,
  Scan,
  Grid3x3,
  Magnet,
  Save,
  FolderOpen,
  FilePlus,
  PlusSquare: SquarePlus,
  Scaling,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Command;
}

type CommandBarProps = {
  onReflowRequest?: () => void;
};

export function CommandBar({ onReflowRequest }: CommandBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { commandBarOpen, openCommandBar, closeCommandBar, setActiveTool, executeAction } =
    useToolStore();

  const exportCommands = useExportSlashCommands();
  const executeExport = useExecuteExport();
  const exportContext = useExportContext();

  const allCommands = useMemo(
    () => [...SLASH_COMMANDS, ...exportCommands],
    [exportCommands]
  );

  const isSlashMode = value.startsWith("/");

  const filteredCommands = useMemo(() => {
    if (!isSlashMode) return [];

    const search = value.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.command.toLowerCase().includes(search) ||
        cmd.label.toLowerCase().includes(search.replace("/", "")) ||
        cmd.description.toLowerCase().includes(search.replace("/", ""))
    ).slice(0, 8);
  }, [value, isSlashMode, allCommands]);

  const executeCommand = useCallback(
    (cmd: SlashCommand) => {
      if (cmd.type === "export") {
        const pluginId = cmd.id.replace("plugin:", "");
        executeExport(pluginId, exportContext).catch((err) =>
          console.error(`[Export] Failed:`, err)
        );
      } else if (cmd.type === "tool") {
        setActiveTool(cmd.id as ToolId);
      } else if (cmd.id === ActionId.ReflowArtboard && onReflowRequest) {
        onReflowRequest();
      } else {
        executeAction(cmd.id as ActionId);
      }
      setValue("");
      closeCommandBar();
    },
    [setActiveTool, executeAction, closeCommandBar, executeExport, exportContext, onReflowRequest]
  );

  const handleSubmit = useCallback(() => {
    if (isSlashMode && filteredCommands.length > 0) {
      executeCommand(filteredCommands[selectedIndex]);
    } else if (value.trim()) {
      console.log(`[Prompt] ${value}`);
      setValue("");
    }
  }, [isSlashMode, filteredCommands, selectedIndex, executeCommand, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (isSlashMode) {
          setValue("");
        } else {
          closeCommandBar();
        }
      }
    },
    [filteredCommands.length, handleSubmit, isSlashMode, closeCommandBar]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (commandBarOpen) {
          closeCommandBar();
        } else {
          openCommandBar();
        }
      }
      if (e.key === "/" && !commandBarOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        openCommandBar();
        setTimeout(() => setValue("/"), 0);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandBarOpen, openCommandBar, closeCommandBar]);

  useEffect(() => {
    if (commandBarOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandBarOpen]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
      {isSlashMode && filteredCommands.length > 0 && commandBarOpen && (
        <div className="mb-2 rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="p-1">
            {filteredCommands.map((cmd, index) => {
              const Icon = getIcon(cmd.icon);
              return (
                <button
                  key={cmd.command}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => executeCommand(cmd)}
                >
                  <Icon className="h-4 w-4 shrink-0 text-brand" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">
                      {cmd.label}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {cmd.description}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {cmd.command}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl px-4 py-2.5 transition-all",
          commandBarOpen && "ring-2 ring-ring/50"
        )}
      >
        <button
          onClick={() => {
            openCommandBar();
            setValue("/");
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="shrink-0 p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Slash commands"
        >
          <Slash className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => openCommandBar()}
          placeholder="Type a message or / for commands..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className={cn(
            "shrink-0 p-1.5 rounded-md transition-colors",
            value.trim()
              ? "text-brand hover:bg-accent"
              : "text-muted-foreground/50"
          )}
          title="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {!commandBarOpen && (
        <div className="mt-1.5 text-center">
          <span className="text-[10px] text-muted-foreground/60">
            Press{" "}
            <kbd className="px-1 py-0.5 rounded bg-muted/50 text-muted-foreground text-[10px] font-mono">
              /
            </kbd>{" "}
            for commands or{" "}
            <kbd className="px-1 py-0.5 rounded bg-muted/50 text-muted-foreground text-[10px] font-mono">
              ⌘K
            </kbd>{" "}
            to focus
          </span>
        </div>
      )}
    </div>
  );
}
