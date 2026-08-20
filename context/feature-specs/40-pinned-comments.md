# Feature 40: Live Pinned Comments & Annotation Threads

Enable collaborative review on architecture diagrams by allowing team members to pin interactive comment threads directly onto nodes or arbitrary canvas coordinates with author avatars, real-time replies, and resolved status.

### Implementation

1. **Canvas Type Definitions**
   - In `types/canvas.ts`:
     - Define `CommentMessage` interface: `id`, `authorId`, `authorName`, `authorAvatar`, `authorColor`, `content`, `createdAt`.
     - Define `CommentThread` interface: `id`, `x`, `y`, `nodeId?`, `resolved`, `createdAt`, `messages: CommentMessage[]`.

2. **Pinned Comments Component**
   - Create `components/editor/canvas/pinned-comments.tsx`:
     - Renders pinned comment markers at canvas coordinates with author avatar and reply count badge.
     - Interactive floating thread popover with comment stream, Markdown text, timestamps, reply composer, "Resolve / Unresolve" toggle, and "Delete Thread".
     - Real-time collaborative synchronization via Liveblocks storage (`storage.get("threads")`).

3. **Canvas Controls & Placement Integration**
   - In `components/editor/canvas/canvas-controls.tsx`:
     - Add "Add Comment" button with active indicator.
   - In `components/editor/canvas/canvas-editor.tsx`:
     - Clicking the canvas while comment mode is active drops a new pin and opens the composer.

### Scope Limits

- Pins scale and translate correctly with XYFlow viewport zoom and pan.
- Resolved threads can be hidden or toggled.

### Check When Done

- Users can drop a comment pin on the canvas.
- Adding comments and replies updates Liveblocks storage in real time.
- Resolving and deleting threads works smoothly.
- `npx tsc --noEmit` and `npm run lint` pass with zero errors.
