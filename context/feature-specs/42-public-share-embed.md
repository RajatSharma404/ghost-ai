# Feature 42: Public View-Only Share Link & Embed Mode

Allow project owners to generate secure, read-only public share links and responsive `<iframe>` embed codes for Notion, Confluence, and engineering docs without requiring viewer authentication.

### Implementation

1. **Database Schema**
   - In `prisma/models/project.prisma`:
     - Add `isPublic Boolean @default(false)` to `Project`.

2. **API Routes**
   - `app/api/projects/[projectId]/public-share/route.ts`:
     - `GET`: Returns public share status (`isPublic`).
     - `PATCH`: Toggles `isPublic` status (restricted to project owner).
   - `app/api/projects/[projectId]/public-canvas/route.ts`:
     - `GET`: Public endpoint returning `{ name, description, canvas }` from Vercel Blob if `isPublic === true`.

3. **Public Viewer Pages**
   - `app/share/[projectId]/page.tsx`:
     - Full-page read-only architecture viewer with top bar, project title, and interactive pan/zoom.
   - `app/embed/[projectId]/page.tsx`:
     - Clean, frameless `<iframe>` embed page with floating zoom controls.

4. **Share Dialog Integration**
   - In `components/editor/project-share-dialog.tsx`:
     - Add "Public Link & Embed" section with public toggle switch, copy share URL, and copy `<iframe>` snippet button.

### Scope Limits

- Read-only: Viewers cannot mutate canvas nodes, edges, or project settings.
- If `isPublic` is disabled, public routes return `404 / 403`.

### Check When Done

- Owner can toggle public access on and off in the share dialog.
- Public link `/share/[projectId]` and embed `/embed/[projectId]` render the diagram.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
