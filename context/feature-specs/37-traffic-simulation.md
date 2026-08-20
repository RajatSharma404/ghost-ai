# Feature 37: Animated Data Traffic Simulation (Simulate Flow)

Bring static architecture diagrams to life by introducing an interactive **"Simulate Flow"** engine that renders animated neon packet pulses and flowing current along directed connections to visualize real-time request lifecycles, streaming queues, and data pipelines.

### Implementation

1. **Canvas Type Definitions**
   - In `types/canvas.ts`:
     - Expand `CanvasEdgeData` with `isSimulating?: boolean`, `trafficType?: "http" | "grpc" | "kafka" | "db" | "default"`, and `speed?: number`.

2. **CSS Keyframes**
   - In `app/globals.css`:
     - Add `@keyframes flow-dash` and `@keyframes flow-glow` for GPU-accelerated SVG dashoffset and particle glow animations.

3. **Animated Edge Component**
   - In `components/editor/canvas/canvas-edge.tsx`:
     - Render SVG `<animateMotion>` traveling packet circles along the calculated `edgePath`.
     - Render glowing electric dashed line overlay with protocol-specific color tints (HTTP cyan, Kafka purple, Database green, High-load amber).
     - Display subtle request rate hints (e.g. `120 req/s`) during active simulation.

4. **Canvas Controls & Workspace Integration**
   - In `components/editor/canvas/canvas-controls.tsx`:
     - Add **"Simulate Flow"** toggle with glowing activity badge and speed cycle button (0.5x, 1x, 2x).
   - In `components/editor/canvas/canvas-editor.tsx`:
     - Pass simulation state to edge components.

### Scope Limits

- Non-blocking: Simulation does not degrade canvas FPS or prevent collaborative editing.
- Easily toggleable on/off at any time.

### Check When Done

- "Simulate Flow" toggle starts and stops particle pulse animations along all edges.
- Speed modes (0.5x, 1x, 2x) adjust particle travel speed.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
