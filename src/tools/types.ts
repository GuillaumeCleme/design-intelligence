export const ToolCategory = {
  Selection: "selection",
  Drawing: "drawing",
  Shape: "shape",
  Text: "text",
  Image: "image",
  Transform: "transform",
  View: "view",
} as const;

export type ToolCategory = (typeof ToolCategory)[keyof typeof ToolCategory];

export const ToolId = {
  Select: "select",
  Move: "move",
  Pen: "pen",
  Brush: "brush",
  Eraser: "eraser",
  Rectangle: "rectangle",
  Ellipse: "ellipse",
  Line: "line",
  Text: "text",
  Image: "image",
  Gradient: "gradient",
  Eyedropper: "eyedropper",
  Hand: "hand",
  ZoomIn: "zoom-in",
  ZoomOut: "zoom-out",
  Crop: "crop",
} as const;

export type ToolId = (typeof ToolId)[keyof typeof ToolId];

export const ActionId = {
  AddRectangle: "add-rectangle",
  AddEllipse: "add-ellipse",
  AddText: "add-text",
  AddImage: "add-image",
  AddLine: "add-line",
  AddGradient: "add-gradient",
  AddArtboard: "add-artboard",
  DeleteSelected: "delete-selected",
  DuplicateSelected: "duplicate-selected",
  GroupSelected: "group-selected",
  UngroupSelected: "ungroup-selected",
  BringToFront: "bring-to-front",
  SendToBack: "send-to-back",
  ExportPng: "export-png",
  ExportWebp: "export-webp",
  ExportSvg: "export-svg",
  ExportPdf: "export-pdf",
  ExportDesignpkg: "export-designpkg",
  ImportDesignpkg: "import-designpkg",
  Undo: "undo",
  Redo: "redo",
  ZoomIn: "zoom-in",
  ZoomOut: "zoom-out",
  ZoomToFit: "zoom-to-fit",
  ZoomTo100: "zoom-to-100",
  ToggleGrid: "toggle-grid",
  ToggleSnap: "toggle-snap",
  SaveFile: "save-file",
  OpenFile: "open-file",
  NewFile: "new-file",
  ReflowArtboard: "reflow-artboard",
} as const;

export type ActionId = (typeof ActionId)[keyof typeof ActionId];

export type ToolDefinition = {
  id: ToolId;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  shortcut?: string;
};

export type ActionDefinition = {
  id: ActionId;
  name: string;
  description: string;
  icon: string;
  shortcut?: string;
  category: "add" | "edit" | "export" | "view" | "file" | "transform";
};

export type SlashCommand = {
  type: "tool" | "action" | "export";
  command: string;
  label: string;
  description: string;
  icon: string;
  id: ToolId | ActionId | string;
};
