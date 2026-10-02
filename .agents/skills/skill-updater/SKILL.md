---
name: skill-updater
description: >-
  Scans project manifests and directory changes to automatically synchronize, update, or generate
  workspace skills whenever new dependencies, frameworks, or architectural patterns are added.
  Triggers on /update-skills, "update skills", "sync skills with new stack", or when new libraries/modules are introduced.
---

# /skill-updater — Automatic Skill Synchronization Engine

Keeps the agent's knowledge and workflow skills in `.agents/skills/` synchronized with the actual codebase. When new packages, frameworks, or architectural layers are introduced, this skill updates existing skills or scaffolds new ones.

## Trigger Scenarios
Activate this skill whenever:
- User runs `/update-skills` or says "sync skills with new stack", "update skills based on new additions"
- A new package or service is installed (e.g., `npm install <pkg>`, adding a new ORM, auth provider, or queue)
- The user modifies major configuration files (`next.config.ts`, `prisma/schema.prisma`, `package.json`, `trigger.config.ts`)

---

## Autonomous Synchronization Workflow

### 1. Inventory Project Manifests & Stack Delta
1. Read `package.json`, `requirements.txt`, `prisma/schema.prisma`, and config files.
2. Extract all dependencies, peer dependencies, and major version numbers.
3. Compare against the skills currently residing in `.agents/skills/`.
4. Identify deltas:
   - **New Dependencies**: e.g., `@trigger.dev/sdk`, `@liveblocks/client`, `zod`, `@prisma/client`.
   - **Version Upgrades**: e.g., Next.js 15 ➜ Next.js 16, React 18 ➜ React 19, Tailwind v3 ➜ v4.
   - **New Architecture Directories**: e.g., `app/api/`, `trigger/`, `context/`, `workers/`.

---

### 2. Autonomous Skill Updates & Scaffolding
For any detected delta:
1. **Update Relevant Existing Skills**:
   - In `improvement/SKILL.md`: update tech stack awareness and audit rules to incorporate new package conventions.
   - In `commit/SKILL.md`: update commit scopes to recognize new directory paths and module boundaries.
2. **Scaffold Dedicated Skills (if needed)**:
   - When a substantial system library is added (e.g., background job queue, real-time sync engine), scaffold a dedicated skill at `.agents/skills/<name>/SKILL.md`.
   - Include standard frontmatter (`name`, `description`), step-by-step best practices, and anti-patterns to avoid.

---

### 3. Policy & Guardrail Verification (Gemini AI Policy)
Before saving any updated or new skill:
- **Privacy Check**: Ensure instructions strictly prohibit logging or committing environment variables, keys, or credentials.
- **Defensive Security Check**: Ensure advice focuses on defensive coding, error handling, and authorization checks rather than exploit demonstration.
- **No Hallucinated Flags**: Verify API syntax against the installed package version in `node_modules` or official docs.

---

### 4. Output Delta Summary
Render a clear Markdown log of all updated skills:

```markdown
### 🔄 Workspace Skills Synchronized

- **Detected New Additions**: `Trigger.dev v4`, `Tailwind CSS v4`
- **Updated Skills**:
  - `improvement`: Added audit checks for Trigger.dev background task retries and Tailwind v4 `@theme` tokens.
  - `commit`: Added commit scopes `feat(trigger):` and `style(theme):`.
- **Status**: Skills are up to date with project version and patterns.
```
