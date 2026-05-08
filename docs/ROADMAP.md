# Design Package POC — Product Roadmap

## Vision

Transform the Design Package POC from a static scene renderer into an intelligent, agent-driven design system that can automatically adapt layouts across formats, accept dynamic content, and produce production-ready outputs headlessly.

---

## Pillar 1: Intelligent Reflow

Automatically reposition and resize elements when adapting artboards to different aspect ratios and channel requirements.

### Phase 1 — Deterministic Reflow Engine *(current)*

- **Element classification**: Categorize scene nodes as full-bleed (backgrounds, overlays) vs. anchored content (text, logos, panels) based on their geometry relative to the artboard.
- **Anchor-aware repositioning**: Maintain each element's relationship to its nearest edges/region when reflowing to a new aspect ratio. A logo anchored bottom-left stays bottom-left; right-aligned text stays right-anchored.
- **Proportional scaling**: Scale element dimensions, font sizes, line heights, border radii, and spacing proportionally to the target artboard size.
- **Aspect ratio presets**: Built-in presets for common formats — 1:1 (Square Social), 16:9 (Wide Display), 4:5 (Portrait Social), 9:16 (Story/Vertical).
- **Reflow tool in UI**: Accessible via command bar (`/reflow`) and File menu, with a dialog to pick source artboard, target size, and preview result.

### Phase 2 — VLM-Assisted Reflow

- **Raster snapshot pipeline**: Export artboards as PNG/WebP snapshots alongside their scene JSON, producing a paired payload (visual + structural) that a VLM can inspect.
- **Area-of-interest detection**: Use VLM bounding-box reasoning to identify focal subjects in background images, then bias element placement to avoid occluding key areas.
- **Layout critique loop**: VLM reviews the reflowed artboard render, suggests adjustments (e.g., "headline overlaps the subject's face — shift panel 40px right"), and the system applies those as scene patches.

### Phase 3 — Constraint-Based Layout

- **Layout constraints on nodes**: Optional anchor/margin/flex constraints (`anchorTop`, `anchorRight`, `marginLeft`, `stretchHorizontal`) stored in the scene graph.
- **Constraint solver**: A deterministic solver that resolves layout constraints before rendering, replacing or augmenting the proportional reflow.
- **Responsive breakpoints**: Define per-artboard breakpoints so a single scene definition can express layout intent across multiple sizes.

---

## Pillar 2: Data-Driven Templates & Variables

Enable the same design templates to render with different content payloads — different copy, images, logos, and brand tokens.

### Phase 1 — Variable Binding

- **Variable syntax**: Extend token references to support a `{{variables.headline}}` syntax for content slots, distinct from design tokens (`{colors.yellow}`).
- **Variable manifest**: A `variables.json` file in the package that declares variable names, types (text, image, color), defaults, and validation rules.
- **Runtime resolution**: The renderer resolves variables from a provided data payload before rendering, falling back to defaults when values are missing.

### Phase 2 — Data File Integration

- **CSV/JSON data sources**: Load a data file where each row produces a unique render (e.g., 100 rows → 100 personalized banners).
- **Batch rendering**: Iterate over data rows, bind variables, render, and export — supporting both raster (PNG/WebP) and structured output (.designpkg per variant).
- **Data preview**: In the UI, a data table panel lets users preview which row is currently driving the artboard content.

### Phase 3 — Dynamic Asset Swapping

- **Image variables**: `{{variables.heroImage}}` resolves to an asset ID or URL, enabling different hero images per data row.
- **Logo variables**: `{{variables.logo}}` swaps the logo asset, supporting multi-brand or co-branded templates.
- **Font/token overrides**: Data rows can override specific design tokens (e.g., brand color) per variant.

---

## Pillar 3: Headless Rendering & Multi-Format Output

Render artboards programmatically without a browser UI, producing production-ready outputs for different channels.

### Phase 1 — Headless Raster Export

- **Node.js rendering pipeline**: Use PixiJS with a headless WebGL context (e.g., `@pixi/node` or `headless-gl`) to render artboards server-side.
- **CLI interface**: `npx designpkg render --input package.designpkg --output ./exports/ --format png --artboard all`
- **Resolution/scale control**: Support `@1x`, `@2x`, `@3x` and custom DPI for different channel requirements.

### Phase 2 — Layered Output Formats

- **PSD export** *(partially implemented)*: Produce layered Photoshop files where each scene node maps to a PSD layer, preserving editability.
- **PDF export**: Map the scene graph to PDF drawing primitives for print-ready output.
- **SVG export**: Convert the scene graph to SVG for web and vector workflows.
- **IDML export**: Map the scene graph to InDesign Markup Language for print production workflows.

### Phase 3 — Channel-Aware Rendering

- **Channel profiles**: Define output profiles (e.g., "Instagram Story", "Google Display Ad", "Email Header") that bundle size, format, color space, and file-size constraints.
- **Automatic format selection**: Given a channel profile, the system picks the right artboard size (via reflow), export format, and optimization settings.
- **Asset optimization**: Automatically compress, resize, and convert assets to meet channel constraints (e.g., max file size for ad networks).

---

## Implementation Priority

| Priority | Feature | Pillar | Status |
|----------|---------|--------|--------|
| **P0** | Deterministic reflow engine | Reflow | **In progress** |
| **P0** | Reflow tool UI (command bar + dialog) | Reflow | **In progress** |
| P1 | Raster snapshot pipeline for VLM | Reflow | Planned |
| P1 | Variable binding syntax + resolution | Templates | Planned |
| P1 | Headless raster export (CLI) | Headless | Planned |
| P2 | VLM area-of-interest detection | Reflow | Planned |
| P2 | CSV/JSON data source integration | Templates | Planned |
| P2 | PSD layered export (complete) | Headless | Partially done |
| P3 | Constraint-based layout solver | Reflow | Planned |
| P3 | Dynamic asset/logo swapping | Templates | Planned |
| P3 | Channel-aware rendering profiles | Headless | Planned |
