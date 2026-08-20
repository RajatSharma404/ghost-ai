# Feature 41: Multi-Format Diagram Exporter (PNG / SVG / Mermaid.js / PlantUML)

Provide a 1-click export dialog enabling engineers to export high-resolution vector and raster images (PNG, SVG) as well as generated Mermaid.js and PlantUML markdown for embedding in GitHub READMEs, Notion, and technical specifications.

### Implementation

1. **Diagram Exporter Utility**
   - Create `lib/diagram-export.ts`:
     - `generateMermaid(nodes, edges, options)`: Converts canvas nodes, boundaries, shapes, and connections into clean Mermaid flowchart syntax (`graph LR` / `graph TD`).
     - `generatePlantUML(nodes, edges, options)`: Converts canvas topology into structured PlantUML syntax (`@startuml` ... `@enduml`).
     - `exportSvgAndPng(reactFlowBounds)`: Serializes canvas elements into downloadable `.svg` or `.png` images.

2. **Diagram Export Dialog**
   - Create `components/editor/canvas/diagram-export-dialog.tsx`:
     - Tabbed modal dialog:
       - **🖼️ Image Export**: PNG & SVG download buttons, resolution multiplier (1x, 2x, 3x), background toggle.
       - **🧜 Mermaid.js**: Direction selector (LR / TD), live code block preview, Copy to Clipboard, and Download `.mmd` / `.md`.
       - **📐 PlantUML**: Live code block preview, Copy to Clipboard, and Download `.puml`.

3. **Navbar Integration**
   - In `components/editor/editor-navbar.tsx`:
     - Add "Export" button in top toolbar with `Download` icon.

### Scope Limits

- Handles special characters, spaces, and shapes safely in Mermaid and PlantUML.
- Instant client-side generation without server roundtrips.

### Check When Done

- Export dialog opens from the navbar.
- Mermaid and PlantUML outputs are syntactically valid and match canvas connections.
- PNG and SVG downloads produce high-res images of the architecture diagram.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
