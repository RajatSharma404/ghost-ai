# Feature 39: Node Metadata & Configuration Drawer

Provide an enterprise-grade configuration drawer allowing engineers to document networking ports, tech stacks, environment variables, latency SLAs, and ownership details on any architecture node.

### Implementation

1. **Canvas Type Definitions**
   - In `types/canvas.ts`:
     - Define `NodeMetadata` interface with fields: `description`, `role`, `techStack`, `language`, `port`, `protocol`, `healthCheckPath`, `envVars`, `slaLatency`, `maxThroughput`, `replicas`, `ownerTeam`, `maintainer`, `repoUrl`.
     - Add `metadata?: NodeMetadata` to `CanvasNodeData`.

2. **Node Metadata Drawer Component**
   - Create `components/editor/canvas/node-metadata-drawer.tsx`:
     - Slide-over panel opening on the right side of the canvas.
     - Organized into 5 tabbed/collapsible sections:
       1. **Overview & Role**: Component role (API Gateway, Microservice, Database, Queue, Cache), description.
       2. **Networking & Ports**: Port (e.g. `:8080`, `:5432`), protocol (HTTP, gRPC, TCP, WS), health check path.
       3. **Tech Stack & Runtimes**: Primary language (Node.js, Python, Go), framework (Next.js, FastAPI), runtime version.
       4. **Environment Variables**: Dynamic key-value table with add/remove rows.
       5. **SLA & Team Ownership**: P99 target latency, max throughput, replica count, team name, maintainer, GitHub repo link.
     - Live synchronization to Liveblocks storage.

3. **Node Component Integration**
   - In `components/editor/canvas/canvas-node.tsx`:
     - Add "Config / Settings" button in `NodeToolbar`.
     - Display a mini port badge (e.g. `:8080`) on the node when a port is configured.

### Scope Limits

- Non-blocking: Drawer can be opened/closed without interrupting canvas editing or AI flows.
- Real-time collaborative synchronization via Liveblocks mutations.

### Check When Done

- Selecting a node and clicking "Config" opens the Metadata Drawer.
- Changes to ports, tech stack, env vars, and team ownership persist to Liveblocks.
- Port badges appear on configured nodes.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
