# Feature 30: AI Infrastructure as Code (IaC) Generation

Generate production-ready Infrastructure as Code (`docker-compose.yml`, Terraform `main.tf`, and Kubernetes manifests `k8s.yaml`) directly from the collaborative architecture canvas using Google Gemini and Trigger.dev background workflows.

### Implementation

1. **IaC Trigger Route**
   - Create `POST /api/ai/iac`.
   - Accepts `roomId`, `format` (`docker-compose` | `terraform` | `kubernetes`), `nodes`, `edges`, `chatHistory`.
   - Authenticates the current user via Clerk.
   - Resolves project access from `roomId` via `getAccessibleProject`.
   - Triggers the `generate-iac` task.
   - Saves a `TaskRun` record for ownership/access control.
   - Returns the Trigger.dev `runId`.

2. **IaC Token Route**
   - Create `POST /api/ai/iac/token`.
   - Accepts `runId`.
   - Authenticates the user and verifies `TaskRun` ownership.
   - Issues a Trigger.dev public access token scoped to that run with 1-hour expiry.
   - Returns `{ token }`.

3. **IaC Generation Task**
   - Create `trigger/generate-iac.ts`.
   - Define a `generateIaC` schemaTask that:
     - Accepts `projectId`, `roomId`, `format`, `nodes`, `edges`, and `chatHistory`.
     - Validates payload with Zod.
     - Uses Gemini through `@ai-sdk/google`.
     - Synthesizes canvas nodes, shapes, colors, and directed edges into valid, runnable IaC code.
     - Formats output for the chosen target (`docker-compose.yml`, `main.tf`, `k8s.yaml`).
     - Updates Trigger.dev realtime metadata status.
     - Returns `{ code, format, filename }`.

4. **UI Integration in AI Sidebar**
   - In `components/editor/ai-sidebar.tsx`:
     - Add **IaC** tab alongside AI Architect, Chat, and Specs.
     - Include format selector (Docker Compose, Terraform, Kubernetes).
     - Provide **Generate Code** button with live Trigger.dev run tracking.
     - Render generated code with syntax styling, copy-to-clipboard button, and direct file download.

### Scope Limits

- Do not alter existing canvas data models or Liveblocks storage schemas.
- Do not execute cloud deployments directly from the browser; produce clean, exportable IaC files.
- Project access must always be verified on the server side via authenticated Clerk identity.

### Check When Done

- `POST /api/ai/iac` and `POST /api/ai/iac/token` work with authentication and access control.
- `generate-iac` task executes and generates valid Docker Compose, Terraform, and Kubernetes code.
- AI sidebar renders IaC tab with format switcher, copy button, and download action.
- `npm run lint` and `npx tsc --noEmit` pass with zero errors.
