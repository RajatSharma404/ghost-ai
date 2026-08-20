# Feature 36: Official Cloud & Tech Icon Library

Empower the architecture canvas with official SVG cloud & tech brand icons (AWS, GCP, Azure, Kubernetes, Docker, Kafka, Redis, PostgreSQL, Next.js, Cloudflare, etc.) to transform diagrams into presentation-ready, enterprise architecture maps.

### Implementation

1. **Canvas Type Definitions**
   - In `types/canvas.ts`:
     - Add `icon?: string` to `CanvasNodeData`.

2. **Tech Icons Registry**
   - In `components/editor/canvas/tech-icons.tsx`:
     - Define clean SVG paths with official color branding for 30+ major cloud and developer technologies across 6 categories:
       - **Cloud Providers**: AWS, GCP, Azure, Cloudflare.
       - **Compute & Serverless**: AWS Lambda, EC2, ECS, Cloud Run, Azure Functions, Docker, Kubernetes, Next.js, Node.js, Python, Go.
       - **Databases & Cache**: PostgreSQL, Redis, MongoDB, MySQL, DynamoDB, Elasticsearch, Supabase.
       - **Messaging & Streaming**: Apache Kafka, RabbitMQ, AWS SQS, AWS SNS, Google Pub/Sub, EventBridge.
       - **Storage & Ingress**: AWS S3, CloudFront, API Gateway, NGINX, GraphQL.
       - **Security & Observability**: AWS IAM, Auth0, Prometheus, Datadog.
     - Export `TechIcon` component and `TECH_ICON_CATALOG` metadata with search keywords.

3. **Icon Picker Dialog**
   - In `components/editor/canvas/icon-picker-dialog.tsx`:
     - Search input with real-time keyword matching.
     - Category filter pills (*All*, *Compute*, *Database*, *Messaging*, *Storage*, *Cloud*).
     - Grid of selectable tech icons with hover effects and labels.
     - "Remove Icon" action.

4. **Node Component Integration**
   - In `components/editor/canvas/canvas-node.tsx`:
     - Render `TechIcon` inside the node body alongside the editable label.
     - Add an **Icon Picker** button in `NodeToolbar`.
     - Implement `updateNodeIcon` mutation syncing changes to Liveblocks collaborative storage.

### Scope Limits

- Backward-compatible with nodes that do not have an icon.
- Maintain dark-theme contrast and responsive node sizing.

### Check When Done

- Nodes can have icons assigned via the Icon Picker dialog.
- Search and category filters work smoothly.
- Icons render sharply inside nodes and scale with node dimensions.
- Collaborative mutations sync in real time across users.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
