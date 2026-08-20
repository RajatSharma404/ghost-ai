# Feature 43: Canvas Version History & Named Snapshots

Allow engineers to create named milestone snapshots of their architecture diagrams (e.g. *"v1.0 MVP"*, *"v2.0 Event-Driven Migration"*) with timestamps, author metadata, node/edge counts, and 1-click rollback.

### Implementation

1. **Database Schema**
   - In `prisma/models/project.prisma`:
     - Create `model ProjectSnapshot`: `id`, `projectId`, `name`, `description`, `blobUrl`, `nodeCount`, `edgeCount`, `createdByName`, `createdAt`.
     - Add `snapshots ProjectSnapshot[]` relation on `Project`.

2. **API Routes**
   - `app/api/projects/[projectId]/snapshots/route.ts`:
     - `GET`: Lists all snapshots for the project ordered by `createdAt desc`.
     - `POST`: Creates a named milestone snapshot, persists canvas JSON to `@vercel/blob` (`snapshots/{projectId}/{timestamp}.json`), and creates `ProjectSnapshot` record.
   - `app/api/projects/[projectId]/snapshots/[snapshotId]/restore/route.ts`:
     - `POST`: Fetches snapshot canvas JSON from Vercel Blob and returns `{ canvas }`.

3. **UI Components & Workspace Integration**
   - Create `components/editor/canvas/version-history-dialog.tsx`:
     - Snapshot timeline with names, descriptions, author, timestamp, and node/edge metrics.
     - "Create Milestone" form with name and optional description.
     - "Restore Version" action which replaces live canvas nodes and edges.
   - In `components/editor/editor-navbar.tsx`:
     - Add "History" button with `History` icon.

### Scope Limits

- Restoring a snapshot updates Liveblocks collaborative storage in real time for all active users in the room.

### Check When Done

- Users can create named milestone snapshots.
- Snapshot list displays accurate timestamp and metadata.
- 1-click restore successfully rolls back canvas to the snapshot state.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
