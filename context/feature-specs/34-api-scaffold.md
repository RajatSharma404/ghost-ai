# Feature 34: API Scaffold & OpenAPI 3.0 Generator

Generate complete, production-grade OpenAPI 3.0 / Swagger specifications and starter route handlers (Next.js App Router, FastAPI, Express) based on the API Gateways, microservices, and database endpoints on the canvas using Google Gemini and Trigger.dev background workflows.

### Implementation

1. **Scaffold Trigger Route**
   - Create `POST /api/ai/scaffold`.
   - Accepts `roomId`, `framework` (`nextjs` | `fastapi` | `express`), `nodes`, `edges`, `chatHistory`.
   - Authenticates the current user via Clerk.
   - Resolves project access from `roomId` via `getAccessibleProject`.
   - Triggers the `generate-api-scaffold` task.
   - Saves a `TaskRun` record for ownership/access control.
   - Returns the Trigger.dev `runId`.

2. **Scaffold Token Route**
   - Create `POST /api/ai/scaffold/token`.
   - Accepts `runId`.
   - Authenticates the user and verifies `TaskRun` ownership.
   - Issues a Trigger.dev public access token scoped to that run with 1-hour expiry.
   - Returns `{ token }`.

3. **Scaffold Generation Task**
   - Create `trigger/generate-api-scaffold.ts`.
   - Define a `generateApiScaffold` schemaTask that:
     - Accepts `projectId`, `roomId`, `framework`, `nodes`, `edges`, and `chatHistory`.
     - Uses Gemini through `@ai-sdk/google`.
     - Generates valid OpenAPI 3.0.3 YAML and production-ready starter route handlers in the requested framework.
     - Returns `{ openapiYaml, routesCode, filename, framework, summary }`.

4. **UI Integration in AI Sidebar**
   - In `components/editor/ai-sidebar.tsx`:
     - Add **API** tab in the sidebar navigation.
     - Include framework selector (Next.js App Router, FastAPI, Express).
     - Code preview modal with syntax styling, copy-to-clipboard, and direct file download.

### Scope Limits

- Do not alter existing canvas data models or Liveblocks storage schemas.
- Project access must always be verified on the server side via authenticated Clerk identity.

### Check When Done

- `POST /api/ai/scaffold` and `POST /api/ai/scaffold/token` work with authentication and access control.
- `generate-api-scaffold` task executes and returns valid OpenAPI YAML and route boilerplate.
- AI sidebar renders API tab with framework selector, preview modal, copy, and download actions.
- `npm run lint` and `npx tsc --noEmit` pass with zero errors.
