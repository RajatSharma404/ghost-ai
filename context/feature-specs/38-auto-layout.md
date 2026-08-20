# Feature 38: Auto-Layout / Tidy Canvas Engine (Hierarchical DAG)

Automatically arrange complex or AI-generated node graphs into clean, structured hierarchical layouts (Left-to-Right or Top-to-Bottom) with topological dependency ordering and collision-free layer distribution.

### Implementation

1. **Layout Engine Utility**
   - Create `lib/auto-layout.ts`.
   - Implements layered DAG layout algorithm:
     - Computes in-degrees and out-degrees from directed connections (`edges`).
     - Assigns nodes to hierarchical ranks/layers using topological sort.
     - Calculates optimal spacing (horizontal gap: ~220px, vertical gap: ~100px) based on node dimensions.
     - Supports **Left-to-Right (LR)** and **Top-to-Bottom (TB)** directions.
     - Automatically accounts for container/group boundaries.
     - Returns repositioned node array.

2. **Canvas Controls Integration**
   - In `components/editor/canvas/canvas-controls.tsx`:
     - Add a "Tidy Canvas" button (`Workflow` / `LayoutGrid` icon) with a dropdown/selector for **Left-to-Right (LR)** and **Top-to-Bottom (TB)**.

3. **Collaborative Liveblocks Storage Mutation**
   - In `components/editor/canvas/canvas-editor.tsx`:
     - Implement `applyAutoLayout` mutation updating node `position` objects in Liveblocks storage.
     - Trigger smooth camera zoom/fit with `fitView({ duration: 400 })`.

### Scope Limits

- Preserves all node IDs, connections, labels, colors, icons, and metadata.
- Boundary container nodes are repositioned gracefully without breaking child references.

### Check When Done

- "Tidy Canvas" arranges messy nodes into clean ranks.
- Both LR and TB modes work correctly.
- Layout changes sync immediately to all connected collaborators.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
