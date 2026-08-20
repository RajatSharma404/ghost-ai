# Feature 31: AI Architecture Threat, Security & Reliability Audit

Provide automated, multi-dimensional AI architectural audits on the collaborative canvas to evaluate security vulnerabilities, single points of failure (SPoFs), scalability bottlenecks, and compliance best practices (STRIDE, OWASP Top 10, SOC2) using Google Gemini and Trigger.dev background workflows.

### Implementation

1. **Audit Trigger Route**
   - Create `POST /api/ai/audit`.
   - Accepts `roomId`, `nodes`, `edges`, `chatHistory`.
   - Authenticates the current user via Clerk.
   - Resolves project access from `roomId` via `getAccessibleProject`.
   - Triggers the `audit-architecture` task.
   - Saves a `TaskRun` record for ownership/access control.
   - Returns the Trigger.dev `runId`.

2. **Audit Token Route**
   - Create `POST /api/ai/audit/token`.
   - Accepts `runId`.
   - Authenticates the user and verifies `TaskRun` ownership.
   - Issues a Trigger.dev public access token scoped to that run with 1-hour expiry.
   - Returns `{ token }`.

3. **Audit Task**
   - Create `trigger/audit-architecture.ts`.
   - Define an `auditArchitecture` schemaTask that:
     - Accepts `projectId`, `roomId`, `nodes`, `edges`, and `chatHistory`.
     - Validates payload with Zod.
     - Uses Gemini through `@ai-sdk/google` with structured JSON output.
     - Evaluates 4 core dimensions: Security, Reliability, Scalability, and Compliance.
     - Computes a composite health score (0–100) and risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
     - Produces structured findings with category, severity, affected nodes, description, and remediation.
     - Updates Trigger.dev realtime metadata status.
     - Returns `{ healthScore, riskLevel, summary, findings, strengths }`.

4. **UI Integration in AI Sidebar**
   - In `components/editor/ai-sidebar.tsx`:
     - Add **Audit** tab in the sidebar navigation.
     - Provide **Run Architecture Audit** trigger button with live progress tracking.
     - Render health score badge, category filters (All, Security, Reliability, Scalability, Compliance), and interactive finding cards.
     - Provide a **Download Audit Report** action to save the complete assessment as a Markdown file.

### Scope Limits

- Do not alter existing canvas data models or Liveblocks storage schemas.
- Project access must always be verified on the server side via authenticated Clerk identity.

### Check When Done

- `POST /api/ai/audit` and `POST /api/ai/audit/token` work with authentication and access control.
- `audit-architecture` task executes and returns structured audit findings and health score.
- AI sidebar renders Audit tab with health gauge, filterable findings, and export report action.
- `npm run lint` and `npx tsc --noEmit` pass with zero errors.
