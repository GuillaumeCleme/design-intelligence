import {
  ToolId,
  ToolCategory,
  ActionId,
  type ToolDefinition,
  type ActionDefinition,
  type SlashCommand,
} from "./types";

export const TOOLS: ToolDefinition[] = [
  {
    id: ToolId.Select,
    name: "Select",
    description: "Select and manipulate objects",
    category: ToolCategory.Selection,
    icon: "MousePointer2",
    shortcut: "V",
  },
  {
    id: ToolId.Move,
    name: "Move",
    description: "Move objects on the canvas",
    category: ToolCategory.Selection,
    icon: "Move",
    shortcut: "M",
  },
  {
    id: ToolId.Pen,
    name: "Pen",
    description: "Draw vector paths with anchor points",
    category: ToolCategory.Drawing,
    icon: "PenTool",
    shortcut: "P",
  },
  {
    id: ToolId.Brush,
    name: "Brush",
    description: "Freehand brush drawing",
    category: ToolCategory.Drawing,
    icon: "Paintbrush",
    shortcut: "B",
  },
  {
    id: ToolId.Eraser,
    name: "Eraser",
    description: "Erase parts of objects",
    category: ToolCategory.Drawing,
    icon: "Eraser",
    shortcut: "E",
  },
  {
    id: ToolId.Rectangle,
    name: "Rectangle",
    description: "Draw rectangles and squares",
    category: ToolCategory.Shape,
    icon: "Square",
    shortcut: "R",
  },
  {
    id: ToolId.Ellipse,
    name: "Ellipse",
    description: "Draw ellipses and circles",
    category: ToolCategory.Shape,
    icon: "Circle",
    shortcut: "O",
  },
  {
    id: ToolId.Line,
    name: "Line",
    description: "Draw straight lines",
    category: ToolCategory.Shape,
    icon: "Minus",
    shortcut: "L",
  },
  {
    id: ToolId.Text,
    name: "Text",
    description: "Add and edit text",
    category: ToolCategory.Text,
    icon: "Type",
    shortcut: "T",
  },
  {
    id: ToolId.Image,
    name: "Image",
    description: "Place images on the canvas",
    category: ToolCategory.Image,
    icon: "Image",
    shortcut: "I",
  },
  {
    id: ToolId.Gradient,
    name: "Gradient",
    description: "Apply gradient fills",
    category: ToolCategory.Drawing,
    icon: "Blend",
    shortcut: "G",
  },
  {
    id: ToolId.Eyedropper,
    name: "Eyedropper",
    description: "Sample colors from the canvas",
    category: ToolCategory.Drawing,
    icon: "Pipette",
    shortcut: "Alt+I",
  },
  {
    id: ToolId.Hand,
    name: "Hand",
    description: "Pan the canvas viewport",
    category: ToolCategory.View,
    icon: "Hand",
    shortcut: "H",
  },
  {
    id: ToolId.ZoomIn,
    name: "Zoom In",
    description: "Zoom in on the canvas",
    category: ToolCategory.View,
    icon: "ZoomIn",
    shortcut: "Ctrl++",
  },
  {
    id: ToolId.ZoomOut,
    name: "Zoom Out",
    description: "Zoom out of the canvas",
    category: ToolCategory.View,
    icon: "ZoomOut",
    shortcut: "Ctrl+-",
  },
  {
    id: ToolId.Crop,
    name: "Crop",
    description: "Crop selected elements",
    category: ToolCategory.Transform,
    icon: "Crop",
    shortcut: "C",
  },
];

export const ACTIONS: ActionDefinition[] = [
  {
    id: ActionId.AddRectangle,
    name: "Add Rectangle",
    description: "Add a new rectangle to the canvas",
    icon: "Square",
    category: "add",
  },
  {
    id: ActionId.AddEllipse,
    name: "Add Ellipse",
    description: "Add a new ellipse to the canvas",
    icon: "Circle",
    category: "add",
  },
  {
    id: ActionId.AddText,
    name: "Add Text",
    description: "Add a new text element",
    icon: "Type",
    category: "add",
  },
  {
    id: ActionId.AddImage,
    name: "Add Image",
    description: "Add an image to the canvas",
    icon: "Image",
    category: "add",
  },
  {
    id: ActionId.AddLine,
    name: "Add Line",
    description: "Add a line to the canvas",
    icon: "Minus",
    category: "add",
  },
  {
    id: ActionId.AddGradient,
    name: "Add Gradient",
    description: "Add a gradient fill element",
    icon: "Blend",
    category: "add",
  },
  {
    id: ActionId.AddArtboard,
    name: "Add Artboard",
    description: "Create a new artboard",
    icon: "PlusSquare",
    category: "add",
  },
  {
    id: ActionId.DeleteSelected,
    name: "Delete Selected",
    description: "Remove selected elements",
    icon: "Trash2",
    shortcut: "Delete",
    category: "edit",
  },
  {
    id: ActionId.DuplicateSelected,
    name: "Duplicate Selected",
    description: "Duplicate the current selection",
    icon: "Copy",
    shortcut: "Ctrl+D",
    category: "edit",
  },
  {
    id: ActionId.GroupSelected,
    name: "Group Selected",
    description: "Group the selected elements",
    icon: "Group",
    shortcut: "Ctrl+G",
    category: "edit",
  },
  {
    id: ActionId.UngroupSelected,
    name: "Ungroup Selected",
    description: "Ungroup the selected elements",
    icon: "Ungroup",
    shortcut: "Ctrl+Shift+G",
    category: "edit",
  },
  {
    id: ActionId.BringToFront,
    name: "Bring to Front",
    description: "Bring selection to the front",
    icon: "ArrowUpToLine",
    shortcut: "Ctrl+Shift+]",
    category: "edit",
  },
  {
    id: ActionId.SendToBack,
    name: "Send to Back",
    description: "Send selection to the back",
    icon: "ArrowDownToLine",
    shortcut: "Ctrl+Shift+[",
    category: "edit",
  },
  {
    id: ActionId.ExportPng,
    name: "Export as PNG",
    description: "Export the selected artboard as PNG",
    icon: "FileImage",
    shortcut: "Ctrl+Shift+E",
    category: "export",
  },
  {
    id: ActionId.ExportWebp,
    name: "Export as WebP",
    description: "Export the selected artboard as WebP",
    icon: "FileImage",
    category: "export",
  },
  {
    id: ActionId.ExportSvg,
    name: "Export as SVG",
    description: "Export the selected artboard as SVG",
    icon: "FileCode",
    category: "export",
  },
  {
    id: ActionId.ExportPdf,
    name: "Export as PDF",
    description: "Export the selected artboard as PDF",
    icon: "FileText",
    category: "export",
  },
  {
    id: ActionId.ExportDesignpkg,
    name: "Export as .designpkg",
    description: "Save the full design package",
    icon: "Package",
    category: "export",
  },
  {
    id: ActionId.ImportDesignpkg,
    name: "Import .designpkg",
    description: "Open a design package file",
    icon: "PackageOpen",
    category: "file",
  },
  {
    id: ActionId.Undo,
    name: "Undo",
    description: "Undo the last action",
    icon: "Undo2",
    shortcut: "Ctrl+Z",
    category: "edit",
  },
  {
    id: ActionId.Redo,
    name: "Redo",
    description: "Redo the last undone action",
    icon: "Redo2",
    shortcut: "Ctrl+Shift+Z",
    category: "edit",
  },
  {
    id: ActionId.ZoomIn,
    name: "Zoom In",
    description: "Increase canvas zoom level",
    icon: "ZoomIn",
    shortcut: "Ctrl++",
    category: "view",
  },
  {
    id: ActionId.ZoomOut,
    name: "Zoom Out",
    description: "Decrease canvas zoom level",
    icon: "ZoomOut",
    shortcut: "Ctrl+-",
    category: "view",
  },
  {
    id: ActionId.ZoomToFit,
    name: "Zoom to Fit",
    description: "Fit all artboards in view",
    icon: "Maximize2",
    shortcut: "Ctrl+0",
    category: "view",
  },
  {
    id: ActionId.ZoomTo100,
    name: "Zoom to 100%",
    description: "Reset zoom to actual size",
    icon: "Scan",
    shortcut: "Ctrl+1",
    category: "view",
  },
  {
    id: ActionId.ToggleGrid,
    name: "Toggle Grid",
    description: "Show or hide the canvas grid",
    icon: "Grid3x3",
    shortcut: "Ctrl+'",
    category: "view",
  },
  {
    id: ActionId.ToggleSnap,
    name: "Toggle Snap",
    description: "Enable or disable snapping to grid",
    icon: "Magnet",
    category: "view",
  },
  {
    id: ActionId.SaveFile,
    name: "Save",
    description: "Save the current file",
    icon: "Save",
    shortcut: "Ctrl+S",
    category: "file",
  },
  {
    id: ActionId.OpenFile,
    name: "Open File",
    description: "Open a design file",
    icon: "FolderOpen",
    shortcut: "Ctrl+O",
    category: "file",
  },
  {
    id: ActionId.NewFile,
    name: "New File",
    description: "Create a new design file",
    icon: "FilePlus",
    shortcut: "Ctrl+N",
    category: "file",
  },
];

export function buildSlashCommands(): SlashCommand[] {
  const commands: SlashCommand[] = [];

  for (const tool of TOOLS) {
    commands.push({
      type: "tool",
      command: `/use ${tool.name.toLowerCase()}`,
      label: tool.name,
      description: tool.description,
      icon: tool.icon,
      id: tool.id,
    });
  }

  for (const action of ACTIONS) {
    const commandStr =
      action.category === "add"
        ? `/add ${action.name.replace("Add ", "").toLowerCase()}`
        : `/${action.id}`;

    commands.push({
      type: "action",
      command: commandStr,
      label: action.name,
      description: action.description,
      icon: action.icon,
      id: action.id,
    });
  }

  return commands;
}

export const SLASH_COMMANDS = buildSlashCommands();

export function findToolById(id: ToolId): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function findActionById(id: ActionId): ActionDefinition | undefined {
  return ACTIONS.find((a) => a.id === id);
}
