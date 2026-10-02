---
name: nextjs-react19-architect
description: >-
  Guides architecture, component design, Server Actions, and Tailwind CSS v4 styling for Next.js 16
  and React 19 projects. Triggers on "nextjs", "react 19", "server action", "hydration error",
  "app router architecture", or when building components and API routes in this stack.
---

# Next.js 16 & React 19 Architectural Mastery

Enforces best practices for modern full-stack development using Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

## Core Invariants & Rules

### 1. Next.js 16 Async Request APIs
In Next.js 15+, dynamic APIs are strictly asynchronous:
```typescript
// ✅ In Next.js 16:
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  // ...
}
```
- Also `await cookies()`, `await headers()`.

### 2. React 19 Server Components vs Client Boundaries
- Default to **Server Components** for data fetching, secrets handling, and static markup.
- Push `"use client"` down to the leaf nodes (only components requiring browser events, React state, or XYFlow / Liveblocks hooks).
- Never import server-only modules (like Prisma or secret keys) into client boundaries.

### 3. Server Actions & Mutations
- Always validate incoming inputs using `zod`.
- Use React 19 `useActionState` and `useOptimistic` for instant UX feedback.
- Authenticate the user session inside the server action before mutating database state:
```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function updateDiagramAction(id: string, data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await prisma.diagram.update({
    where: { id, userId },
    data,
  });
}
```

### 4. Tailwind CSS v4 Theme System
- Tailwind CSS v4 uses CSS `@theme` blocks in stylesheet rather than `tailwind.config.js`.
- Use semantic variables and container queries:
```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #8e75b2;
  --color-canvas-bg: #0b0f19;
}
```

### 5. Hydration & Streaming Protection
- Wrap dynamic/client-only islands (like canvases, voice speech recognition, and Liveblocks presence) in `<Suspense>` with skeleton fallbacks or client-only mounting guards.
