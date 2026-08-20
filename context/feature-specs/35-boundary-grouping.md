# Feature 35: VPC, Subnet & Boundary Grouping (Container Nodes)

Implement interactive container & boundary grouping nodes on the canvas, allowing visual clustering of microservices, databases, and gateways into **VPCs**, **Public/Private Subnets**, **Kubernetes Clusters/Namespaces**, and **Security/DMZ Zones**.

### Implementation

1. **Canvas Type Definitions**
   - In `types/canvas.ts`:
     - Define `GroupBoundaryType` (`"vpc" | "subnet-public" | "subnet-private" | "k8s-cluster" | "security-zone" | "custom"`).
     - Define `BOUNDARY_PRESETS` with default labels, subtitles/CIDR blocks, stroke styles, and color themes.
     - Add `GroupNodeData` and union `CanvasNode = Node<CanvasNodeData, "canvasNode"> | Node<GroupNodeData, "groupNode">`.

2. **Group Node Component**
   - In `components/editor/canvas/group-node.tsx`:
     - Custom XYFlow node component `GroupNodeComponent`.
     - Resizable via `NodeResizer` with minimum dimensions (minWidth: 200, minHeight: 140).
     - Top-left header pill displaying boundary type icon, editable title, and editable subtitle.
     - NodeToolbar with preset selection buttons, solid/dashed stroke toggle, and color themes.
     - Liveblocks `useMutation` syncing all modifications to collaborative storage.

3. **Shape Panel Toolbar**
   - In `components/editor/canvas/shape-panel.tsx`:
     - Add a dedicated Container Group button (`BoxSelect` / `Container` icon) with drag-and-drop support.

4. **Canvas Editor Integration**
   - In `components/editor/canvas/canvas-editor.tsx`:
     - Register `groupNode: GroupNodeComponent` in `nodeTypes`.
     - Handle drop event for `"group"` shape with default dimensions (width: 360, height: 240) and initial `zIndex: -1`.

### Scope Limits

- Maintain compatibility with existing canvas data and Liveblocks collaborative storage.
- Regular service nodes placed within container boundaries remain fully draggable, selectable, and connectable.

### Check When Done

- Container group nodes can be dragged from the toolbar and dropped onto the canvas.
- Container nodes can be resized, renamed, and customized with presets.
- Real-time collaborative synchronization functions smoothly via Liveblocks.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
