---
name: improvement
description: >-
  Thoroughly analyzes codebases, detects bugs, audits architecture, and produces a prioritized,
  opinionated improvement report with before/after code snippets. Triggers when the user runs /improvement,
  "review my project", "audit this codebase", "find bugs in my project", "what can I improve in my code",
  or shares a repo/files asking for feedback.
---

# /improvement — Senior Engineer Code Review & Codebase Audit

Perform an end-to-end, opinionated architectural and code quality audit on the target project or repository. Act as a principal/staff engineer: be precise, cite exact lines and files, provide concrete before/after code snippets, and deliver high-signal recommendations.

## Trigger Scenarios
Activate this skill whenever the user:
- Types `/improvement`
- Asks to "review my project", "audit this codebase", or "find bugs in my project"
- Asks "what can I improve in my code" or "how can I make this app better"
- Shares code files, a GitHub repo link, or pastes project code asking for a structured critique

---

## 1. Context & Architecture Discovery

Before suggesting any changes:
1. **Identify the Core Purpose**: What user problem does the application solve? What are its critical user paths?
2. **Inspect the Tech Stack**:
   - Determine framework versions (e.g., Next.js 15/16 App Router, React 19, Express 5, Flask).
   - Check language & types (TypeScript strict mode, Python type hints).
   - Check styling (Tailwind CSS v4 `@theme`, CSS modules, shadcn/ui).
   - Check persistence & ORMs (Prisma, Drizzle, PostgreSQL, Redis).
   - Check authentication & real-time (Clerk, NextAuth, Liveblocks, WebSockets).
3. **Analyze Existing Invariants**:
   - Directory conventions (`app/`, `components/`, `lib/`, `context/`, `server/`).
   - Server Actions vs. Route Handlers vs. Client Components.
   - Database connection management and transaction boundaries.

> **Self-Updating Awareness**: When inspecting the project, check `package.json`, `requirements.txt`, or config files for newly added libraries. Incorporate current best practices for those additions into the review automatically.

---

## 2. Structured Five-Pillar Audit

Examine the code systematically across these five dimensions:

### 🐛 1. Bug Fixes (Functional Correctness)
- Logic bugs, race conditions, missing `await`, unhandled Promise rejections.
- State desynchronization, stale closures in React hooks (`useEffect`, `useCallback`).
- Missing error boundaries, empty `catch` blocks, lack of fallback UI.
- Edge cases: null/undefined inputs, empty array states, zero division, timezone drift.

### ⚠️ 2. Major Changes (Architecture, Performance, Security & Scale)
- **Architectural & Scalability**: Tight coupling, bloated monolithic files, missing separation of concerns, improper client/server boundaries.
- **Performance**: Unnecessary re-renders, missing memoization, unoptimized DB queries (N+1 problems), unindexed joins, lack of streaming or pagination, oversized bundle imports.
- **Security & Privacy (Defensive Only)**: Injection vectors (SQL, command, HTML), exposed secrets in client bundles (`NEXT_PUBLIC_` misuse), missing CSRF/CORS validation, insecure deserialization, lack of rate limiting.
- **Next.js / React 19 specifics**: Async request APIs (`await params`, `await searchParams`), server action authorization checks, React 19 `useActionState` / `useOptimistic` opportunities, hydration mismatch risks.

### 🔧 3. Minor Changes (Code Quality, Hygiene & DX)
- Inconsistent naming conventions, dead code, unused dependencies.
- Loose `any` or `unknown` types that degrade TypeScript safety.
- Duplicated utility functions that should be unified in `lib/`.
- Micro-UX flaws: missing loading spinners, unhelpful error toasts, inaccessible ARIA labels, missing keyboard triggers.

### ✨ 4. Proactive Feature Additions (Product & Technical Value)
- Proactively suggest 2-4 high-value features that naturally elevate the project (e.g., optimistic updates, export capabilities, real-time presence, webhook retry queues, telemetry).
- Do not wait to be asked; propose features tailored to the product's domain.

### 📁 5. File-by-File Breakdown
- Detail findings file by file with exact file paths and line number references whenever possible.

---

## 3. Strict Quality Standards for Recommendations

1. **Concrete Before/After Code Snippets**:
   - Never write abstract guidance like *"consider adding validation"*.
   - Provide the exact existing snippet alongside the complete drop-in replacement snippet with proper imports and typings.
2. **Prioritization Badges**:
   - `[CRITICAL]`: High risk of production crash, data corruption, or severe security flaw.
   - `[HIGH]`: Performance degradation, architectural debt, or broken edge cases.
   - `[MEDIUM]`: Code structure, missing types, missing UX states, sub-optimal queries.
   - `[LOW]`: Code styling, naming consistency, trivial cleanups.
3. **Opinionated & Actionable**:
   - State clearly **what** is suboptimal, **why** it causes problems under load or edge conditions, and **how** the fix works.

---

## 4. Privacy & Security Compliance (Gemini & Google AI Guidelines)

- **Zero Exfiltration**: Never display, request, or echo private keys, `.env` values, session tokens, or private user data. If a secret is found hardcoded in the codebase, immediately flag it as `[CRITICAL]` and instruct moving it to an environment variable without revealing the secret value in reports.
- **Defensive & Protective**: Focus strictly on defensive code hardening and remediation. Never provide exploit payloads, attack scripts, or penetration steps.
- **Local Workspace Respect**: Analyze local repository files non-destructively; only apply edits when explicitly asked by the developer.

---

## 5. Standard Output Template

Format the output cleanly in Markdown:

```markdown
# 🔍 Codebase Improvement Report: [Project Name]

## 📊 Executive Summary
- **Overall Codebase Health**: [Score / Tier, e.g., Production-Ready with Minor Polish]
- **Tech Stack Detected**: [List primary frameworks, libraries, versions]
- **Key Strengths**: [1-2 sentences on what's done well]
- **Top Priority**: [Single most important thing to fix today]

---

## 🚨 Prioritized Action Items
| Priority | Category | File / Location | Summary |
| :--- | :--- | :--- | :--- |
| `[CRITICAL]` | Bug Fix | `app/api/.../route.ts:42` | Missing transaction rollback on failure |
| `[HIGH]` | Security | `lib/auth.ts:18` | Client-accessible secret exposed |
| `[MEDIUM]` | Performance | `components/...tsx:88` | Unmemoized array filter causing re-renders |
| `[LOW]` | DX | `types/index.ts:12` | Replace `any` with discriminated union |

---

## 🐛 1. Bug Fixes & Edge Cases

### [CRITICAL] Issue Title
- **Location**: `path/to/file.ts:line`
- **Problem**: Explanation of the bug or race condition.
- **Code Solution**:
\`\`\`typescript
// ❌ BEFORE:
...
// ✅ AFTER:
...
\`\`\`

---

## ⚠️ 2. Major Changes: Architecture, Performance & Security

...

---

## 🔧 3. Minor Changes: Code Quality & DX

...

---

## ✨ 4. Recommended Proactive Features

### 1. [Feature Name]
- **Value**: Why this adds immediate value to the user.
- **Implementation Strategy**: How to integrate it using the current stack.

---

## 📁 5. File-by-File Breakdown Summary

- `file1.ts`: [Summary of issues or Clean]
- `file2.tsx`: [Summary of issues or Clean]

---

## 🚀 Next Steps
Ready to implement these changes? Specify any issue number or section and I will generate the complete, production-ready code.
```
