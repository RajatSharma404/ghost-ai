# Feature 32: AI Cloud Cost & Capacity Estimator

Estimate real-world monthly cloud infrastructure costs ($/month) directly from the architecture canvas across AWS, GCP, and Azure with configurable traffic tiers and automated FinOps cost-optimization recommendations using Google Gemini and Trigger.dev background workflows.

### Implementation

1. **Cost Trigger Route**
   - Create `POST /api/ai/cost`.
   - Accepts `roomId`, `cloudProvider` (`aws` | `gcp` | `azure`), `trafficTier` (`starter` | `growth` | `scale` | `enterprise`), `nodes`, `edges`, `chatHistory`.
   - Authenticates the current user via Clerk.
   - Resolves project access from `roomId` via `getAccessibleProject`.
   - Triggers the `estimate-cost` task.
   - Saves a `TaskRun` record for ownership/access control.
   - Returns the Trigger.dev `runId`.

2. **Cost Token Route**
   - Create `POST /api/ai/cost/token`.
   - Accepts `runId`.
   - Authenticates the user and verifies `TaskRun` ownership.
   - Issues a Trigger.dev public access token scoped to that run with 1-hour expiry.
   - Returns `{ token }`.

3. **Cost Estimation Task**
   - Create `trigger/estimate-cost.ts`.
   - Define an `estimateCost` schemaTask that:
     - Accepts `projectId`, `roomId`, `cloudProvider`, `trafficTier`, `nodes`, `edges`, and `chatHistory`.
     - Validates payload with Zod.
     - Uses Gemini through `@ai-sdk/google` with structured JSON output.
     - Calculates per-service costs, category totals (compute, database, storage, network, AI), and total monthly estimate.
     - Generates actionable FinOps cost-saving recommendations (Spot/Reserved instances, S3 lifecycle tiers, caching).
     - Generates a full Markdown breakdown report.
     - Updates Trigger.dev realtime metadata status.
     - Returns `{ totalMonthlyEstimate, currency, categoryTotals, breakdown, costSavingTips, summary, markdownReport }`.

4. **UI Integration in AI Sidebar**
   - In `components/editor/ai-sidebar.tsx`:
     - Add **Cost** tab in the sidebar navigation.
     - Include provider selector (AWS, GCP, Azure) and traffic scale tier selector (Starter, Growth, Scale, Enterprise).
     - Provide **Calculate Cost** button with live progress tracking.
     - Render total monthly estimate banner, category subtotals, itemized service costs, and cost optimization tips.
     - Provide a **Download Cost Report** action to save the complete estimate as a Markdown file.

### Scope Limits

- Do not alter existing canvas data models or Liveblocks storage schemas.
- Project access must always be verified on the server side via authenticated Clerk identity.

### Check When Done

- `POST /api/ai/cost` and `POST /api/ai/cost/token` work with authentication and access control.
- `estimate-cost` task executes and returns structured cost breakdown and savings tips.
- AI sidebar renders Cost tab with provider/tier selector, itemized breakdown, and export report action.
- `npm run lint` and `npx tsc --noEmit` pass with zero errors.
