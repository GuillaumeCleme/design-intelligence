# Pixi.js Design Editor Implementation Guide

## Purpose

This document defines the implementation plan for a Pixi.js-based design editor that supports layered artboard authoring, structured scene graph editing, package-based assets, PSD export, and agent-driven scene modification.

The guide separates:

1. **Core deterministic editor features**  
   Features that should be implemented directly in the editor using Pixi.js, DOM overlays, the scene graph, and standard browser APIs.

2. **Generative or AI-assisted features**  
   Features that may later require LLMs, VLMs, image generation models, segmentation models, background removal, image enhancement, or other generative capabilities.

The core principle is:

> The scene graph owns the document. Pixi.js renders the document. Agents and UI tools modify the scene graph through validated operations.

---

# 1. Architecture Overview

## 1.1 Core Runtime Layers

```text
Design Package
  ├── manifest.json
  ├── document.json
  ├── tokens.json
  ├── artboards/
  ├── assets/
  └── previews/

Scene Graph
  ├── Artboards
  ├── Layers
  ├── Groups
  ├── Shapes
  ├── Text
  ├── Images
  ├── Effects
  └── Exports

Editor Application
  ├── Pixi.js rendering surface
  ├── DOM interaction overlays
  ├── Layers panel
  ├── Properties panel
  ├── Asset browser
  ├── Agent command prompt
  └── Export panel

Agent Runtime
  ├── Query tools
  ├── Patch tools
  ├── Validation tools
  ├── Preview tools
  └── Optional generative tools
```

## 1.2 Source of Truth

The source of truth is always the serialized scene graph.

Pixi.js display objects are projections of that graph.

```text
scene graph → Pixi render tree
scene graph → PSD export
scene graph → PNG/WebP export
scene graph → HTML/SVG/PDF export, later
scene graph → agent-readable document context
```

Do not allow Pixi.js objects to become the canonical document model.

---

# 2. Core Data Model

## 2.1 Document Model

```ts
export type SceneDocument = {
  id: string;
  version: string;
  unit: "px";
  colorSpace: "srgb" | "display-p3" | "cmyk-preview";
  artboards: string[];
  nodes: Record<string, SceneNode>;
  tokens: TokenSet;
  assets: Record<string, AssetManifestEntry>;
  dependencies: DependencyGraph;
};
```

## 2.2 Artboard Node

```ts
export type ArtboardNode = {
  id: string;
  type: "artboard";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background?: Paint;
  children: string[];
  exportSettings?: ExportSettings;
  preview?: {
    thumbnailAssetId?: string;
    dirty: boolean;
    lastRenderedAt?: string;
  };
};
```

## 2.3 Base Layer Node

```ts
export type BaseNode = {
  id: string;
  type: string;
  name: string;
  parentId: string;

  x: number;
  y: number;
  width: number;
  height: number;

  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;

  visible: boolean;
  locked: boolean;

  blendMode?: BlendMode;
  fills?: Paint[];
  strokes?: Stroke[];
  effects?: Effect[];

  role?: SemanticRole;
  metadata?: Record<string, unknown>;
};
```

## 2.4 Supported Node Types

```ts
export type SceneNode =
  | ArtboardNode
  | GroupNode
  | RectNode
  | EllipseNode
  | LineNode
  | TextNode
  | ImageNode
  | VectorNode;
```

## 2.5 Semantic Roles

Semantic roles help agents understand intent without relying only on layer names.

```ts
export type SemanticRole =
  | "background"
  | "logo"
  | "primary-headline"
  | "secondary-headline"
  | "body-copy"
  | "cta"
  | "panel"
  | "decorative-shape"
  | "image"
  | "legal-copy";
```

Use semantic roles for agent queries like:

- “Make the headline bigger.”
- “Replace the logo.”
- “Move the CTA below the subheadline.”
- “Create a wide version of this banner.”

---

# 3. Core Deterministic Features

These features should be implemented without requiring generative models.

---

## 3.1 Layers Panel

### Purpose

The layers panel gives users visibility and control over the artboard hierarchy and z-order. Displayed on the left hand side of the canvas, hovering over the canvas like other controls.

Every visual object must appear as a layer.

### Required Features

| Feature | Description |
|---|---|
| Layer list | Display artboard children in stack order |
| Nested hierarchy | Support groups and nested layers |
| Rename layer | Edit layer names |
| Select layer | Clicking a layer selects it on canvas |
| Reorder layer | Drag layer up/down |
| Hide/show | Toggle visibility |
| Lock/unlock | Prevent editing |
| Group/ungroup | Combine selected nodes into a group |
| Search/filter | Find layers by name, type, or role |
| Type icon | Show text/image/shape/group/artboard icons |

### Scene Graph Requirements

Children are ordered bottom-to-top.

```ts
type ParentNode = {
  children: string[];
};
```

The topmost visual layer is the last child in the array.

```ts
function bringToFront(parent: ParentNode, nodeId: string) {
  parent.children = parent.children.filter((id) => id !== nodeId);
  parent.children.push(nodeId);
}
```

### Patch Operations

```ts
type LayerPatch =
  | { op: "renameLayer"; nodeId: string; name: string }
  | { op: "setLayerVisibility"; nodeId: string; visible: boolean }
  | { op: "setLayerLocked"; nodeId: string; locked: boolean }
  | { op: "reorderLayer"; parentId: string; nodeId: string; index: number }
  | { op: "bringForward"; nodeId: string }
  | { op: "sendBackward"; nodeId: string }
  | { op: "bringToFront"; nodeId: string }
  | { op: "sendToBack"; nodeId: string }
  | { op: "groupNodes"; parentId: string; nodeIds: string[]; groupName: string }
  | { op: "ungroupNode"; nodeId: string };
```

### Pixi.js Implementation

- Each artboard maps to a Pixi `Container`.
- Each group maps to a Pixi `Container`.
- Each visual layer maps to a Pixi display object.
- Reordering updates the scene graph first, then re-renders the parent container.
- Do not reorder Pixi children directly without writing back to the scene graph.

### Acceptance Criteria

- User can reorder layers and visually see stacking changes.
- User can hide and lock layers.
- User can select layers that are visually obscured.
- Agent can query and modify layer order through patch operations.
- PSD export respects layer order.

---

## 3.2 Selection Tool

### Purpose

The selection tool allows users to select, inspect, move, transform, and edit objects.

### Required Features

| Feature | Description |
|---|---|
| Single select | Click object |
| Multi-select | Shift-click objects |
| Marquee select | Drag selection box |
| Select through layers | Optional modifier to select obscured object |
| Select from layers panel | Required |
| Hover outline | Show object under pointer |
| Selection bounds | Show selected object bounds |
| Multi-selection bounds | Show combined bounds |

### Scene Graph Requirements

Selection should be editor state, not part of the document.

```ts
type EditorState = {
  selectedNodeIds: string[];
  hoveredNodeId?: string;
  activeArtboardId?: string;
};
```

### Pixi.js Implementation

- Use Pixi pointer events for hit testing.
- Use a separate `selectionLayer` for outlines and handles.
- Selection overlays should never export.
- For complex scenes, maintain a reverse lookup from Pixi display object to scene node ID.

```ts
const displayObjectToNodeId = new WeakMap<DisplayObject, string>();
```

### Acceptance Criteria

- Users can select visible layers on canvas.
- Selection state syncs with the layers panel.
- Selection handles appear above the artboard.
- Export does not include selection UI.

---

## 3.3 Transform Tools

### Purpose

Transform tools allow users to move, resize, rotate, and scale selected layers.

### Required Features

| Feature | Description |
|---|---|
| Move | Drag selected nodes |
| Resize | Drag edge/corner handles |
| Rotate | Rotation handle |
| Scale | Uniform and non-uniform scaling |
| Numeric transform | Edit x, y, width, height, rotation |
| Constrain proportions | Shift-resize |
| Duplicate while dragging | Alt/Option-drag |
| Snap to guides | Basic snapping |

### Patch Operations

```ts
type TransformPatch =
  | {
      op: "updateTransform";
      nodeId: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      rotation?: number;
      scaleX?: number;
      scaleY?: number;
    }
  | {
      op: "moveNodes";
      nodeIds: string[];
      deltaX: number;
      deltaY: number;
    };
```

### Implementation Notes

- During drag, update a temporary preview state.
- On drag end, commit a patch to the scene graph.
- Add undo checkpoint at the end of the transform gesture, not on every pointer move.
- Use transformed bounds for rotated objects.
- Store transforms in the scene graph, not in Pixi-only state.

### Acceptance Criteria

- Transform changes persist in the scene graph.
- Undo/redo restores prior transform state.
- Export reflects transformed positions.
- Agent can update transforms through patches.

---

## 3.4 Shape Tools

### Purpose

Users need to create basic design elements such as panels, frames, overlays, dividers, and decorative shapes.

### Required Shape Types

| Shape | Priority |
|---|---|
| Rectangle | Must-have |
| Rounded rectangle | Must-have |
| Ellipse/circle | Must-have |
| Line | Must-have |
| Polygon | Should-have |
| Star | Later |
| Freeform vector path | Later |

### Shape Node

```ts
export type RectNode = BaseNode & {
  type: "rect";
  cornerRadius?: number | {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  };
};

export type EllipseNode = BaseNode & {
  type: "ellipse";
};

export type LineNode = BaseNode & {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
```

### Pixi.js Implementation

- Use `Graphics` for rectangles, ellipses, and lines.
- Cache complex graphics where possible.
- Re-render shape graphics when fills, strokes, or dimensions change.

### Patch Operations

```ts
type ShapePatch =
  | { op: "addRect"; parentId: string; node: RectNode }
  | { op: "addEllipse"; parentId: string; node: EllipseNode }
  | { op: "addLine"; parentId: string; node: LineNode };
```

### Acceptance Criteria

- User can add basic shapes to an artboard.
- Shapes appear in the layers panel.
- Shapes support fills, strokes, opacity, and effects.
- PSD export maps shape layers where possible.

---

## 3.5 Text Tool

### Purpose

Text is a core design object and must support high-quality editing, rendering, and export.

### Required Features

| Feature | Description |
|---|---|
| Add text box | Click or drag to create text |
| Inline edit | DOM overlay for active editing |
| Font family | Choose font |
| Font weight | Choose weight |
| Font size | Numeric input |
| Line height | Numeric input |
| Letter spacing | Numeric input |
| Alignment | Left, center, right |
| Color | Solid color or token |
| Text bounds | Width and height |
| Overflow detection | Warn if text exceeds box |
| Uppercase transform | Style-level transform |

### Text Node

```ts
export type TextNode = BaseNode & {
  type: "text";
  text: string;
  textBox: {
    autoResize: "none" | "width" | "height" | "both";
    overflow: "visible" | "clip" | "shrink-to-fit";
  };
  style: {
    fontFamily: string;
    fontWeight?: number;
    fontSize: number;
    lineHeight?: number;
    letterSpacing?: number;
    color: string;
    align?: "left" | "center" | "right";
    textTransform?: "uppercase";
  };
};
```

### Pixi.js Implementation

- Render committed text using Pixi `Text`.
- Use DOM overlay only while editing.
- On edit start:
  - Hide or dim Pixi text.
  - Position DOM text editor exactly over the text layer.
  - Copy font, size, line height, alignment, and color styles.
- On edit commit:
  - Update `node.text`.
  - Remove DOM overlay.
  - Re-render Pixi text.

### Acceptance Criteria

- Text can be edited inline.
- Text style changes render immediately.
- Text appears in exports.
- Text changes are undoable.
- Agent can query and modify text layers by role/name.

---

## 3.6 Image Tool

### Purpose

Images are essential for banners, backgrounds, logos, product shots, and texture layers.

### Required Features

| Feature | Description |
|---|---|
| Import image | Add file to asset library |
| Add image to artboard | Create image layer |
| Replace image | Swap asset reference |
| Set as background | Place behind all other nodes |
| Fit modes | Cover, contain, fill, none |
| Crop/reposition | Move image within frame |
| Opacity | Per-layer opacity |
| Mask to frame | Clip image inside bounds |
| Asset usage | Show where asset is used |

### Image Node

```ts
export type ImageNode = BaseNode & {
  type: "image";
  assetId: string;
  fit: "cover" | "contain" | "fill" | "none";
  crop?: {
    x: number;
    y: number;
    scale: number;
  };
};
```

### Patch Operations

```ts
type ImagePatch =
  | { op: "importAsset"; asset: AssetManifestEntry }
  | { op: "addImageNode"; parentId: string; node: ImageNode }
  | { op: "replaceImageAsset"; nodeId: string; assetId: string }
  | { op: "setImageFit"; nodeId: string; fit: ImageNode["fit"] }
  | { op: "setImageCrop"; nodeId: string; crop: ImageNode["crop"] };
```

### Pixi.js Implementation

- Use Pixi `Sprite`.
- Use masks for cover/contain clipping.
- For SVG logos, either:
  - Load as texture if supported, or
  - Convert to raster texture at render time.
- Preserve original asset for package/export even if rendered as texture.

### Acceptance Criteria

- Images can be imported and placed.
- Image replacement updates all relevant previews.
- Background images can be added to all artboards.
- Cropping and fit mode are reflected in export.
- Missing assets produce validation errors.

---

## 3.7 Fill, Stroke, Gradient, and Opacity Controls

### Purpose

These controls define the visual styling of shapes, text, and other layers.

### Required Features

| Feature | Description |
|---|---|
| Solid fill | Color and opacity |
| Linear gradient | Angle and stops |
| Radial gradient | Center and radius |
| Stroke | Color, width, opacity |
| Layer opacity | Per layer |
| Multiple fills | Should-have |
| Tokenized colors | Must-have |
| Global token replacement | Must-have |

### Paint Model

```ts
export type Paint =
  | {
      type: "solid";
      color: string;
      opacity: number;
    }
  | {
      type: "linear-gradient";
      angle: number;
      stops: GradientStop[];
      opacity: number;
    }
  | {
      type: "radial-gradient";
      centerX: number;
      centerY: number;
      radius: number;
      stops: GradientStop[];
      opacity: number;
    }
  | {
      type: "image";
      assetId: string;
      fit: "cover" | "contain" | "fill";
      opacity: number;
    };

export type GradientStop = {
  offset: number;
  color: string;
  opacity: number;
};
```

### Pixi.js Implementation

- Solid fills use Pixi `Graphics`.
- Gradients should be generated as textures for MVP.
- Later, gradients can move to shaders for performance and fidelity.
- Layer opacity maps to Pixi `alpha`.

### Patch Operations

```ts
type StylePatch =
  | { op: "setFills"; nodeId: string; fills: Paint[] }
  | { op: "setStroke"; nodeId: string; stroke: Stroke }
  | { op: "setOpacity"; nodeId: string; opacity: number }
  | { op: "updateGradientStop"; nodeId: string; fillIndex: number; stopIndex: number; stop: GradientStop };
```

### Acceptance Criteria

- Users can change fill, stroke, gradient, and opacity from the inspector.
- Token references resolve correctly.
- Export visually matches the canvas preview.
- Agent can update color and gradient properties safely.

---

## 3.8 Effects

### Purpose

Effects provide visual depth and polish.

### Deterministic MVP Effects

| Effect | Priority |
|---|---|
| Drop shadow | Must-have |
| Blur | Must-have |
| Inner shadow | Should-have |
| Noise overlay | Should-have |
| Blend mode | Must-have |
| Background blur | Later |
| Glass effect | Later |

### Effect Model

```ts
export type Effect =
  | {
      type: "drop-shadow";
      x: number;
      y: number;
      blur: number;
      spread?: number;
      color: string;
      opacity: number;
      visible: boolean;
    }
  | {
      type: "blur";
      radius: number;
      visible: boolean;
    }
  | {
      type: "noise";
      amount: number;
      opacity: number;
      visible: boolean;
    };
```

### Pixi.js Implementation

- Use Pixi filters for blur and drop shadow where possible.
- Cache filtered objects when static.
- Effects should be stored in scene graph.
- Export pipeline must either:
  - Preserve effect where supported, or
  - Rasterize affected layer/subtree.

### Patch Operations

```ts
type EffectPatch =
  | { op: "addEffect"; nodeId: string; effect: Effect }
  | { op: "updateEffect"; nodeId: string; effectIndex: number; patch: Partial<Effect> }
  | { op: "removeEffect"; nodeId: string; effectIndex: number }
  | { op: "setEffectVisibility"; nodeId: string; effectIndex: number; visible: boolean };
```

### Acceptance Criteria

- Drop shadow and blur render on canvas.
- Effects are represented in the scene graph.
- Effects are included in exported raster output.
- PSD export preserves or rasterizes effects predictably.

---

## 3.9 Alignment and Distribution

### Purpose

Alignment and distribution are required for precise design work and reliable agent layout edits.

### Required Features

| Feature | Description |
|---|---|
| Align left | Align selected objects to left |
| Align right | Align selected objects to right |
| Align top | Align selected objects to top |
| Align bottom | Align selected objects to bottom |
| Center horizontally | Align to center X |
| Center vertically | Align to center Y |
| Distribute horizontally | Equal horizontal spacing |
| Distribute vertically | Equal vertical spacing |
| Align to artboard | Use artboard bounds |
| Align to selection | Use selection bounds |

### Patch Operations

```ts
type AlignPatch =
  | {
      op: "align";
      nodeIds: string[];
      target: "artboard" | "selection";
      align: "left" | "centerX" | "right" | "top" | "centerY" | "bottom";
    }
  | {
      op: "distribute";
      nodeIds: string[];
      axis: "x" | "y";
      spacing?: number;
    };
```

### Acceptance Criteria

- Manual alignment works.
- Agent can align layers using same patch operations.
- Alignment respects locked layers.
- Undo/redo works.

---

## 3.10 Artboard Tools

### Purpose

Artboards are core layout units for banners, social formats, display ads, print pieces, and future export targets.

### Required Features

| Feature | Description |
|---|---|
| Add artboard | Create new canvas area |
| Duplicate artboard | Clone existing design |
| Resize artboard | Change dimensions |
| Reflow artboard | Adapt layout to new size |
| Rename artboard | Edit name |
| Delete artboard | Remove artboard |
| Export selected artboard | Export one |
| Export all artboards | Batch export |
| Artboard presets | Common dimensions |

### Artboard Presets

```ts
const ARTBOARD_PRESETS = [
  { name: "Square Social", width: 1080, height: 1080 },
  { name: "Wide 16:9", width: 1920, height: 1080 },
  { name: "Story/Reel", width: 1080, height: 1920 },
  { name: "Display Ad Medium Rectangle", width: 300, height: 250 },
  { name: "Leaderboard", width: 728, height: 90 },
  { name: "Half Page", width: 300, height: 600 }
];
```

### Patch Operations

```ts
type ArtboardPatch =
  | { op: "addArtboard"; name: string; width: number; height: number; x?: number; y?: number }
  | { op: "duplicateArtboard"; sourceArtboardId: string; name: string }
  | { op: "resizeArtboard"; artboardId: string; width: number; height: number }
  | { op: "deleteArtboard"; artboardId: string }
  | { op: "renameArtboard"; artboardId: string; name: string }
  | { op: "reflowArtboard"; sourceArtboardId: string; targetWidth: number; targetHeight: number };
```

### Acceptance Criteria

- Users can create and duplicate artboards.
- Artboards appear in the layer hierarchy.
- Export works per artboard.
- Reflow can be implemented initially with deterministic heuristics, then improved with agents.

---

## 3.11 Masking and Clipping

### Purpose

Masking and clipping are needed for image crops, frames, panels, artboard clipping, and export compatibility.

### Required Features

| Feature | Description |
|---|---|
| Artboard clipping | Prevent content from rendering outside artboard |
| Group clipping | Clip child content to group/frame |
| Image crop mask | Crop image to node bounds |
| Shape mask | Should-have |
| Alpha mask | Later |

### Scene Model

```ts
export type GroupNode = BaseNode & {
  type: "group" | "frame";
  children: string[];
  clipContent: boolean;
  mask?: {
    type: "rect" | "ellipse" | "path";
    nodeId?: string;
  };
};
```

### Pixi.js Implementation

- Use Pixi `Container` for groups.
- Use `DisplayObject.mask` for clipping.
- Use generated masks for artboards and frames.
- Export must preserve or flatten masks depending on target support.

### Acceptance Criteria

- Images can be cropped within a frame.
- Artboard overflow is hidden.
- Masked content exports correctly.

---

## 3.12 Asset Browser

### Purpose

The asset browser manages imported images, logos, fonts, previews, and reusable design assets.

### Required Features

| Feature | Description |
|---|---|
| List assets | Show all package assets |
| Import asset | Add local file |
| Replace asset | Swap file while preserving references |
| Delete unused assets | Clean package |
| Show usage | Show where asset is used |
| Drag asset to canvas | Create image layer |
| Background assignment | Set asset as background |

### Asset Model

```ts
export type AssetManifestEntry = {
  id: string;
  type: "image" | "vector" | "font" | "preview";
  mimeType: string;
  path: string;
  width?: number;
  height?: number;
  hash?: string;
  fontFamily?: string;
  fontWeight?: number;
};
```

### Acceptance Criteria

- User can import image and logo assets.
- Asset references are stable.
- Replacing an asset updates all usages.
- Missing assets produce validation errors.

---

## 3.13 Token System

### Purpose

Tokens allow global design changes and brand governance.

### Required Token Types

| Token | Description |
|---|---|
| Colors | Brand colors, neutrals, accents |
| Fonts | Font family and weights |
| Spacing | Layout scale |
| Radius | Corner radius values |
| Effects | Standard shadows, overlays |
| Themes | Optional named token sets |

### Token Model

```ts
export type TokenSet = {
  colors: Record<string, string>;
  fonts: Record<string, FontToken>;
  spacing?: Record<string, number>;
  radii?: Record<string, number>;
  effects?: Record<string, Effect | Paint>;
};

export type FontToken = {
  fontFamily: string;
  fontWeight?: number;
  assetId?: string;
};
```

### Patch Operations

```ts
type TokenPatch =
  | { op: "updateColorToken"; tokenPath: string; value: string }
  | { op: "updateFontToken"; tokenPath: string; value: FontToken }
  | { op: "replaceTokenUsage"; from: string; to: string }
  | { op: "addToken"; tokenPath: string; value: unknown }
  | { op: "deleteToken"; tokenPath: string };
```

### Acceptance Criteria

- Changing a token updates all dependent layers.
- Agent can query token usage.
- Invalid token references are caught.
- Export resolves token values correctly.

---

## 3.14 Export System

### Purpose

Export is a first-class workflow for this application.

### Required Export Formats

| Format | Priority |
|---|---|
| PNG | Must-have |
| WebP | Must-have |
| JPEG | Must-have |
| PSD | Already MVP / continue |
| Design package | Must-have |
| PDF | Should-have |
| SVG | Should-have |
| HTML/CSS | Later |

### Export Settings

```ts
export type ExportSettings = {
  formats: ExportFormat[];
  scale: number;
  includeBleed?: boolean;
  background?: "transparent" | "solid";
  quality?: number;
};

export type ExportFormat =
  | "png"
  | "webp"
  | "jpeg"
  | "psd"
  | "pdf"
  | "svg"
  | "html";
```

### Export Compatibility Strategy

Each export should generate a compatibility report.

```ts
export type ExportCompatibilityReport = {
  format: ExportFormat;
  supported: boolean;
  warnings: ExportWarning[];
  rasterizedNodes: string[];
};

export type ExportWarning = {
  nodeId?: string;
  severity: "info" | "warning" | "error";
  message: string;
};
```

### Acceptance Criteria

- Selected artboard can export.
- All artboards can export.
- Unsupported PSD features are flattened or warned.
- Export report is visible to user and agent-readable.

---

## 3.15 Undo and Redo

### Purpose

Undo/redo is essential for trust, especially when agents modify scenes.

### Required Features

| Feature | Description |
|---|---|
| Undo stack | Reverse last operation |
| Redo stack | Reapply undone operation |
| Grouped transactions | One drag = one undo step |
| Agent transaction | Agent patch group = one undo step |
| Named history entries | Useful in history panel |

### Transaction Model

```ts
export type SceneTransaction = {
  id: string;
  label: string;
  patches: DesignPatch[];
  inversePatches: DesignPatch[];
  createdAt: string;
  source: "user" | "agent" | "import" | "system";
};
```

### Acceptance Criteria

- All manual edits are undoable.
- Agent changes are undoable as a single operation.
- Failed patches do not affect document state.

---

## 3.16 Validation Panel

### Purpose

Validation catches design, export, and schema problems before they affect output.

### Required Checks

| Check | Description |
|---|---|
| Schema validity | Scene conforms to Zod schema |
| Missing assets | Asset references exist |
| Missing fonts | Font references exist |
| Invalid tokens | Token paths resolve |
| Text overflow | Text exceeds box |
| Layer bounds | Optional warning for off-artboard layers |
| Export support | Warn on unsupported effects |
| Duplicate IDs | No duplicate node IDs |
| Locked edit prevention | Locked layers cannot be modified |

### Validation Result

```ts
export type ValidationIssue = {
  id: string;
  severity: "info" | "warning" | "error";
  nodeId?: string;
  artboardId?: string;
  code: string;
  message: string;
  fixPatch?: DesignPatch;
};
```

### Acceptance Criteria

- Validation runs after load, patch, and before export.
- Errors block export where appropriate.
- Agent can request validation and apply suggested fixes.

---

# 4. Agent and Query Features

These features support the command prompt and agent-driven editing.

---

## 4.1 Agent Tool Contract

### Purpose

Agents need controlled access to query and modify the document.

Agents should not manipulate Pixi.js directly.

### Required Agent Tools

```ts
type AgentTool =
  | "getDocumentSummary"
  | "getArtboardScene"
  | "getSelectedNodes"
  | "getLayerTree"
  | "getTokenUsage"
  | "getAssetUsage"
  | "getFontsUsed"
  | "getColorsUsed"
  | "validateScene"
  | "renderPreview"
  | "applyPatch"
  | "undoLastPatch"
  | "exportArtboard";
```

### Required Agent Loop

```text
User prompt
→ classify intent
→ query document
→ produce patch plan
→ validate patch
→ apply patch to preview state
→ render preview
→ validate result
→ apply transaction
```

### Acceptance Criteria

- Agent can answer Q&A prompts without modifying the scene.
- Agent can modify scenes only via validated patches.
- Agent changes are undoable.
- Agent output includes a summary of what changed.

---

## 4.2 Query Operations

### Purpose

Not every prompt should create a patch. Many prompts need document Q&A.

### Query Examples

- “What colors are used in this artboard?”
- “Which fonts are used in the headlines?”
- “Which assets are used across all artboards?”
- “Where is this logo used?”
- “Which layers are hidden?”
- “Which layers use the yellow token?”
- “Does this artboard have text overflow?”

### Query Functions

```ts
function getColorsUsed(document: SceneDocument, artboardId?: string): ColorUsage[];
function getFontsUsed(document: SceneDocument, artboardId?: string): FontUsage[];
function getAssetUsage(document: SceneDocument, assetId?: string): AssetUsage[];
function getTokenUsage(document: SceneDocument, tokenPath?: string): TokenUsage[];
function getLayerTree(document: SceneDocument, artboardId: string): LayerTreeNode;
```

### Acceptance Criteria

- Query tools return structured data.
- Query answers cite node names/IDs where relevant.
- Query tools do not mutate the document.

---

## 4.3 Patch Operations

### Purpose

Patch operations provide a safe mutation layer for manual UI and agents.

### Patch Types

```ts
export type DesignPatch =
  | LayerPatch
  | TransformPatch
  | ShapePatch
  | ImagePatch
  | StylePatch
  | EffectPatch
  | AlignPatch
  | ArtboardPatch
  | TokenPatch
  | ExportPatch;
```

### Patch Application Rules

1. Validate patch shape.
2. Validate permissions.
3. Validate target node exists.
4. Validate locked state.
5. Apply patch to cloned document state.
6. Run deterministic validation.
7. Commit transaction.
8. Re-render affected artboards.
9. Mark previews dirty.

### Acceptance Criteria

- Invalid patches are rejected.
- Patches are atomic.
- Batch patches can apply as one transaction.
- Every patch has an inverse patch for undo.

---

# 5. Generative and AI-Assisted Features

These features should be separated from the core deterministic editor. They may require model providers, local models, image APIs, VLMs, or agent workflows.

---

## 5.1 Agent Layout Reflow

### Description

Reflow transforms an existing artboard into a new size while preserving hierarchy, brand styling, and visual balance.

### Example Prompt

```text
Take the 1080 by 1080 banner and reflow it to 1920 by 1080.
```

### Deterministic Baseline

Implement first with rules:

- Scale background to cover.
- Preserve semantic roles.
- Place logo and primary headline together.
- Keep safe margins.
- Move secondary headline to available contrast region.
- Recalculate text box widths.
- Validate overflow.

### Generative Enhancement

Use an LLM/VLM to:

- Evaluate visual hierarchy.
- Suggest alternative placements.
- Decide whether layout feels balanced.
- Create multiple layout variants.

### Required Tools

```ts
getArtboardScene()
renderPreview()
applyPatch()
validateScene()
evaluateVisualHierarchy() // generative/VLM later
```

### Acceptance Criteria

- Deterministic reflow works for simple banner structures.
- Agent-enhanced reflow can propose alternatives.
- User can compare before/after.

---

## 5.2 Generative Image Replacement

### Description

Replace or create background/product imagery from a prompt.

### Example Prompt

```text
Replace the background with a premium mountain scene at sunset.
```

### Deterministic Baseline

- Import image from URL.
- Replace image asset.
- Update affected image node.
- Re-render.

### Generative Enhancement

- Generate a new image using a model.
- Upscale or crop to artboard dimensions.
- Preserve visual contrast.
- Add generated asset to package.

### Required Tools

```ts
importAsset()
replaceImageAsset()
renderPreview()
validateContrast()
generateImage() // generative
```

### Acceptance Criteria

- URL-based image replacement works without AI.
- Generated replacement adds a real asset to package.
- Original asset remains recoverable.

---

## 5.3 Background Removal

### Description

Remove the background from an imported image or logo.

### Example Prompt

```text
Remove the background from this product image.
```

### Deterministic Baseline

None, except manual masking/cropping.

### Generative/ML Requirement

Requires segmentation or background removal model.

### Output

- New transparent PNG/WebP asset.
- Updated image node references the new asset.
- Original image remains in asset library.

### Acceptance Criteria

- Operation creates a new derived asset.
- User can revert to original.
- Export includes transparent image correctly.

---

## 5.4 Generative Blur and Depth Effects

### Description

Enhanced blur/depth effects may require subject-aware or background-aware processing.

### Example Prompt

```text
Blur the background but keep the product sharp.
```

### Deterministic Baseline

- Apply normal blur filter to selected layer.
- Apply mask-based blur if mask exists.

### Generative Enhancement

Requires segmentation/depth estimation:

- Detect subject.
- Separate subject and background.
- Blur background only.
- Composite result.

### Required Tools

```ts
renderPreview()
segmentImage() // generative/ML
createDerivedAsset()
replaceImageAsset()
```

### Acceptance Criteria

- Basic blur works deterministically.
- Subject-aware blur is isolated as an optional generative tool.
- Derived assets are tracked.

---

## 5.5 Visual Design Review

### Description

Use VLMs to evaluate design quality.

### Example Prompt

```text
Review this banner for readability, contrast, and visual hierarchy.
```

### Deterministic Baseline

- Contrast checks.
- Text overflow checks.
- Bounds checks.
- Missing asset checks.
- Token compliance checks.

### Generative Enhancement

VLM can evaluate:

- Visual hierarchy.
- Brand feel.
- Clutter.
- Readability in context.
- Emotional tone.
- Similarity to a reference.

### Required Tools

```ts
renderPreview()
validateScene()
evaluatePreviewWithVLM() // generative
```

### Acceptance Criteria

- Deterministic checks run first.
- VLM review is presented as advisory, not authoritative.
- VLM suggestions can be converted into patch proposals.

---

## 5.6 Copy Generation and Rewrite

### Description

Generate or rewrite headlines, CTAs, and body copy.

### Example Prompt

```text
Make the headline shorter and more premium.
```

### Deterministic Baseline

- Direct user-provided text replacement.

### Generative Enhancement

LLM generates copy variants.

### Required Tools

```ts
getSelectedTextLayers()
generateCopyVariants() // generative
applyPatch()
measureText()
validateTextOverflow()
```

### Acceptance Criteria

- User can choose from generated options.
- Selected copy is applied as a scene patch.
- Text overflow is checked after applying.

---

## 5.7 Brand Compliance Review

### Description

Check whether the design uses approved brand colors, fonts, logos, and layout rules.

### Deterministic Baseline

- Token usage validation.
- Asset usage validation.
- Font validation.
- Minimum logo size.
- Safe area checks.

### Generative Enhancement

VLM can check:

- Logo misuse.
- Off-brand appearance.
- Visual tone.
- Unapproved imagery themes.

### Acceptance Criteria

- Deterministic compliance produces hard pass/fail checks.
- VLM compliance produces advisory feedback.
- Compliance results are linked to nodes where possible.

---

## 5.8 Smart Object Detection and Layer Naming

### Description

Automatically identify what layers are and assign semantic roles.

### Example Prompt

```text
Name all the layers and identify the headline, logo, and background.
```

### Deterministic Baseline

- Use layer type, position, size, and existing names.
- Infer obvious backgrounds by size and z-order.
- Infer logos by asset metadata or dimensions.

### Generative Enhancement

VLM/LLM can identify semantic roles from visual context.

### Acceptance Criteria

- Roles are stored on nodes.
- User can override roles manually.
- Agents use roles for future operations.

---

## 5.9 Image Enhancement and Upscaling

### Description

Improve low-quality assets or upscale for export.

### Deterministic Baseline

- Warn about low resolution.
- Show effective DPI/scale warning.
- Basic browser/canvas scaling.

### Generative Enhancement

- Super-resolution model.
- Denoising.
- Sharpening.
- Artifact removal.

### Acceptance Criteria

- Enhanced output is a derived asset.
- Original asset is preserved.
- Export uses enhanced asset only when selected.

---

# 6. Core UI Panels

## 6.1 Left Panel

### Sections

1. Artboards
2. Layers
3. Assets
4. Components/Templates, later

### Required Behavior

- Artboards are listed first.
- Selecting an artboard updates the active artboard.
- Layers show nested hierarchy.
- Asset browser supports drag to canvas.

---

## 6.2 Right Inspector Panel

### Inspector Groups

| Group | Applies To |
|---|---|
| Transform | All layers |
| Layer | All layers |
| Fill | Shapes, text, frames |
| Stroke | Shapes |
| Text | Text |
| Image | Image |
| Effects | Most layers |
| Export | Artboards |
| Tokens | Tokenized properties |

### Required Behavior

- Inspector updates based on selection.
- Multi-select shows shared properties.
- Mixed values display as mixed state.
- Changes create patch operations.

---

## 6.3 Bottom Agent Command Prompt

### Required Behavior

- Accept natural language prompts.
- Show agent plan before major changes.
- Apply simple edits directly if low risk.
- Show before/after preview for higher-risk changes.
- Support undo after every agent action.

### Prompt Classes

| Class | Example |
|---|---|
| Query | “What colors are used?” |
| Edit | “Make the headline bigger.” |
| Generate | “Create three new variants.” |
| Review | “Check this for readability.” |
| Export | “Export all artboards as PNG and PSD.” |

---

# 7. Rendering Architecture

## 7.1 Pixi Display Tree

```text
Pixi Application
└── viewportContainer
    ├── artboardContainers
    │   ├── artboardBackground
    │   ├── clippedContentContainer
    │   │   └── rendered scene nodes
    │   └── artboardOverlay
    ├── selectionLayer
    ├── guidesLayer
    └── interactionLayer
```

## 7.2 Render Rules

1. Render only visible artboards where possible.
2. Use thumbnails for inactive artboards.
3. Hydrate selected or zoomed-in artboards.
4. Keep editor UI in separate non-export layers.
5. Mark artboard previews dirty when dependent scene nodes/assets/tokens change.

---

# 8. Performance Requirements

## 8.1 Hydration States

```ts
type ArtboardHydrationState =
  | "unloaded"
  | "metadata"
  | "thumbnail"
  | "interactive-preview"
  | "fully-editable";
```

## 8.2 Hydration Rules

```ts
function shouldHydrateArtboard(params: {
  isVisible: boolean;
  isSelected: boolean;
  zoom: number;
  memoryBudgetAvailable: boolean;
  previewDirty: boolean;
}) {
  if (params.isSelected) return true;
  if (params.isVisible && params.zoom > 0.35 && params.memoryBudgetAvailable) return true;
  if (params.previewDirty && params.isVisible) return true;
  return false;
}
```

## 8.3 Performance Guidelines

- Use raster thumbnails for distant artboards.
- Use Pixi containers for groups.
- Cache static complex groups.
- Avoid applying expensive filters to many nodes.
- Defer VLM/generative checks until user asks.
- Run export and preview generation off the main interaction path where possible.

---

# 9. Implementation Roadmap

## Phase 1: Core Editor Foundation

1. Scene graph schemas
2. Pixi renderer
3. Artboards
4. Layers panel
5. Selection tool
6. Transform handles
7. Shape tools
8. Text tool
9. Image import
10. Fill/stroke/gradient inspector

## Phase 2: Production Editing

1. Effects panel
2. Masking/clipping
3. Group/ungroup
4. Alignment/distribution
5. Asset browser
6. Token system
7. Validation panel
8. Undo/redo
9. Export all artboards
10. PSD compatibility reporting

## Phase 3: Agent Readiness

1. Query tools
2. Patch tools
3. Agent transaction model
4. Prompt classification
5. Scene validation loop
6. Preview-before-apply
7. Evaluation test set
8. Agent action audit log

## Phase 4: Generative Capabilities

1. Copy generation
2. Visual review with VLM
3. Agent layout reflow
4. Background removal
5. Generative image replacement
6. Subject-aware blur
7. Image enhancement/upscaling
8. Brand compliance review

---

# 10. POC Acceptance Criteria

The implementation is successful when the application can:

- Create multiple artboards.
- Add, select, move, resize, rotate, and delete layers.
- Show all layers in a reorderable hierarchy.
- Add shapes, text, and images.
- Edit text with a DOM overlay.
- Apply fills, gradients, strokes, opacity, and effects.
- Import and replace assets.
- Use tokenized colors and fonts.
- Export PNG/WebP/JPEG and PSD.
- Save/load the design package.
- Run validation checks.
- Accept an agent prompt.
- Query the document.
- Apply a validated scene patch.
- Undo an agent-generated change.

---

# 11. Key Engineering Rules

## Rule 1: Scene graph first

All manual and agent edits must update the scene graph.

## Rule 2: Pixi is only a renderer

Never make Pixi display objects the canonical state.

## Rule 3: Every edit is a patch

Manual UI and agent actions should use the same patch system.

## Rule 4: Every patch is validated

No patch should apply without schema validation and basic semantic validation.

## Rule 5: Every agent action is undoable

Agent edits should be grouped into named transactions.

## Rule 6: Generative features are optional tools

Do not mix generative logic into core rendering/editing code.

## Rule 7: Preserve original assets

Generated or transformed assets should create derived assets, not overwrite originals.

## Rule 8: Export should report lossiness

Any flattened, rasterized, unsupported, or approximated feature should appear in an export report.

---

# 12. Suggested Package Boundaries

```text
packages/
├── schema/
│   ├── nodes.ts
│   ├── tokens.ts
│   ├── patches.ts
│   └── validation.ts
│
├── store/
│   ├── documentStore.ts
│   ├── transactions.ts
│   ├── undoRedo.ts
│   └── selectors.ts
│
├── renderer-pixi/
│   ├── renderArtboard.ts
│   ├── renderNode.ts
│   ├── renderText.ts
│   ├── renderImage.ts
│   ├── renderShape.ts
│   ├── renderEffects.ts
│   └── gradients.ts
│
├── editor-ui/
│   ├── CanvasViewport.tsx
│   ├── LayersPanel.tsx
│   ├── InspectorPanel.tsx
│   ├── AssetPanel.tsx
│   ├── SelectionOverlay.tsx
│   └── CommandPrompt.tsx
│
├── package/
│   ├── loadPackage.ts
│   ├── savePackage.ts
│   ├── assetManager.ts
│   └── previewManager.ts
│
├── export/
│   ├── exportPng.ts
│   ├── exportWebp.ts
│   ├── exportJpeg.ts
│   ├── exportPsd.ts
│   └── compatibilityReport.ts
│
└── agent/
    ├── tools.ts
    ├── queryTools.ts
    ├── patchTools.ts
    ├── promptClassifier.ts
    ├── validationLoop.ts
    └── evals.ts
```

---

# 13. Immediate Next Steps

1. Implement the layers panel.
2. Add proper node hierarchy and z-order patching.
3. Add selection and transform overlays.
4. Add text DOM overlay editing.
5. Implement image import and replacement.
6. Add token usage lookup.
7. Add validation result panel.
8. Build the agent query and patch tool contract.
9. Expand the eval CSV to map prompts to expected patch/query operations.
10. Keep generative features behind separate optional tools.

---

# 14. Final Recommendation

The application should become a deterministic design editor first, with agents operating through the same structured query and patch layer as the manual UI.

The must-have deterministic features are:

```text
layers
selection
transforms
shapes
text
images
fills
gradients
effects
artboards
assets
tokens
validation
export
undo/redo
```

The generative features should be layered on top:

```text
layout reflow
visual design review
copy generation
background removal
image replacement
image enhancement
subject-aware effects
brand compliance review
```

This keeps the platform stable, testable, and exportable while still enabling advanced AI workflows later.

## User Accessible Shortcuts
Every action described in this guide should come with keyboard-accessible shortcuts that are mapped to the most popular platforms like Figma, Photoshop, or Canva so that the user can still leverage the exact same shortcuts when making these operations manually. 
