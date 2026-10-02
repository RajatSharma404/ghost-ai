---
name: prisma-postgres-optimizer
description: >-
  Optimizes Prisma ORM schemas, database queries, PostgreSQL indexing, and transaction handling.
  Triggers on "prisma", "database query", "prisma migration", "postgres performance",
  "N+1 query", or when writing database models and queries.
---

# Prisma ORM & PostgreSQL Optimization Engine

Best practices for relational data modeling, query optimization, connection pooling, and schema migrations with Prisma and PostgreSQL.

## Core Rules & Guardrails

### 1. Prevent N+1 Query Cascades
Always use explicit `include` or `select` blocks to fetch related entities in a single SQL query:
```typescript
// ❌ Anti-pattern: looping through diagrams and querying nodes individually
// ✅ Optimized pattern:
const diagramWithNodes = await prisma.diagram.findUnique({
  where: { id: diagramId },
  select: {
    id: true,
    title: true,
    nodes: {
      select: { id: true, type: true, positionX: true, positionY: true, label: true },
    },
    edges: true,
  },
});
```

### 2. Transaction Boundaries
For multi-step write operations, always wrap in an interactive transaction to prevent orphan records:
```typescript
await prisma.$transaction(async (tx) => {
  const diagram = await tx.diagram.create({ data: { title, userId } });
  await tx.diagramNode.createMany({
    data: nodes.map((node) => ({ ...node, diagramId: diagram.id })),
  });
  return diagram;
});
```

### 3. Connection Pooling & Serverless Safety
In serverless environments (Next.js route handlers / server actions), reuse a single global Prisma client instance to prevent exhausting PostgreSQL connection pools.

### 4. Indexing Strategy
Ensure any column used in `where`, `orderBy`, or foreign key joins has an explicit index in `schema.prisma`:
```prisma
model Diagram {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}
```
