import {
  ZoomIn,
  ZoomOut,
  Maximize2,
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
  Crop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolStore } from "@/tools/store";
import { ToolId } from "@/tools/types";
import { findToolById } from "@/tools/registry";

const TOOL_ICONS: Record<ToolId, LucideIcon> = {
  [ToolId.Select]: MousePointer2,
  [ToolId.Move]: Move,
  [ToolId.Pen]: PenTool,
  [ToolId.Brush]: Paintbrush,
  [ToolId.Eraser]: Eraser,
  [ToolId.Rectangle]: Square,
  [ToolId.Ellipse]: Circle,
  [ToolId.Line]: Minus,
  [ToolId.Text]: Type,
  [ToolId.Image]: Image,
  [ToolId.Gradient]: Blend,
  [ToolId.Eyedropper]: Pipette,
  [ToolId.Hand]: Hand,
  [ToolId.ZoomIn]: ZoomIn,
  [ToolId.ZoomOut]: ZoomOut,
  [ToolId.Crop]: Crop,
};

export function ToolIndicator() {
  const { activeTool, zoom, zoomIn, zoomOut, zoomToFit } = useToolStore();

  const tool = findToolById(activeTool);
  const Icon = TOOL_ICONS[activeTool] || MousePointer2;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Zoom controls */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-xl border border-border",
          "bg-card/90 backdrop-blur-xl shadow-lg px-2 py-1.5"
        )}
      >
        <button
          onClick={zoomOut}
          className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={zoomToFit}
          className="px-2 py-0.5 rounded-md hover:bg-accent transition-colors text-xs font-mono text-muted-foreground hover:text-foreground min-w-[3.5rem] text-center"
          title="Zoom to fit"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={zoomIn}
          className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        <button
          onClick={zoomToFit}
          className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Fit to view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Active tool indicator */}
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-border",
          "bg-card/90 backdrop-blur-xl shadow-lg px-3 py-2"
        )}
      >
        <div className="flex items-center justify-center h-6 w-6 rounded-md bg-brand/15">
          <Icon className="h-3.5 w-3.5 text-brand" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {tool?.name || "Select"}
          </span>
          {tool?.shortcut && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {tool.shortcut}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
