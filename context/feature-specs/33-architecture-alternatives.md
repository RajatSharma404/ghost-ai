# Feature 33: Interactive Architecture "Diff" & Alternative Architectures

Generate 3 distinct architectural paradigms (e.g., Serverless Event-Driven, Microservices with Kafka, Modular Monolith on Containers) with side-by-side tradeoff analysis and 1-click live collaborative canvas reconfiguration using Google Gemini and Trigger.dev background workflows.

### Implementation

1. **Alternatives Trigger Route**
   - Create `POST /api/ai/alternatives`.
   - Accepts `roomId`, `nodes`, `edges`, `chatHistory`.
   - Authenticates the current user via Clerk.
   - Resolves project access from `roomId` via `getAccessibleProject`.
   - Triggers the `suggest-alternatives` task.
   - Saves a `TaskRun` record for ownership/access control.
   - Returns the Trigger.dev `runId`.

2. **Alternatives Token Route**
   - Create `POST /api/ai/alternatives/token`.
   - Accepts `runId`.
   - Authenticates the user and verifies `TaskRun` ownership.
   - Issues a Trigger.dev public access token scoped to that run with 1-hour expiry.
   - Returns `{ token }`.

3. **Alternatives Suggestion Task**
   - Create `trigger/suggest-alternatives.ts`.
   - Define a `suggestAlternatives` schemaTask that:
     - Accepts `projectId`, `roomId`, `nodes`, `edges`, and `chatHistory`.
     - Uses Gemini through `@ai-sdk/google` with structured JSON output.
     - Proposes 3 distinct architectural paradigms with titles, descriptions, tradeoff ratings (Cost, Complexity, Latency, Scalability), pros, cons, and structured canvas mutations (`nodes` and `edges` list).
     - Returns `{ alternatives, summary }`.

4. **UI Integration in AI Sidebar**
   - In `components/editor/ai-sidebar.tsx`:
     - Add **Alternatives** tab in the workspace navigation.
     - Render comparison cards for the 3 architectures with tradeoff badges.
     - Include a **1-click "Apply to Canvas"** button that updates the Liveblocks collaborative canvas in real time.

### Scope Limits

- Do not alter existing canvas data models or Liveblocks storage schemas.
- Project access must always be verified on the server side via authenticated Clerk identity.

### Check When Done

- `POST /api/ai/alternatives` and `POST /api/ai/alternatives/token` work with authentication and access control.
- `suggest-alternatives` task executes and returns 3 structured alternatives with tradeoffs and canvas actions.
- AI sidebar renders Alternatives tab with 1-click canvas application.
- `npm run lint` and `npx tsc --noEmit` pass with zero errors.
