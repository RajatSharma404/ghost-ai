---
name: commit
description: >-
  Commits each modified or newly added file individually with a dedicated, context-aware commit message
  and pushes the commits to GitHub (1 commit per file). Triggers when the user runs /commit, "commit my files",
  "commit each file", "atomic file commit", or "commit and push per file".
---

# /commit — Atomic Per-File Git Commit & Push Engine

Commits every modified, untracked, or deleted file individually with its own dedicated commit message and pushes all commits to the remote GitHub repository.

## Trigger Scenarios
Activate this skill whenever the user:
- Types `/commit`
- Says "commit each file", "commit my files", "make separate commits for each file"
- Asks for "atomic commits", "1 commit per file", or "commit and push per file"

---

## Workflow Steps

### Step 1: Discover Git Repository & Status
1. Locate the active git repository root.
2. Run `git status --porcelain` to enumerate all changed, untracked, or deleted files.
3. If the working tree is clean, inform the developer: *"Working tree clean, nothing to commit."*

---

### Step 2: Privacy, Security & Secret Guardrails (Gemini Policy)
Before staging anything, strictly check every candidate file against forbidden sensitive patterns:
- `.env*` (e.g., `.env`, `.env.local`, `.env.production`)
- `*.pem`, `*.key`, `id_rsa*`, `credentials.json`, `*secret*`, `*token*`
- Database credentials, private certs, auth tokens, logs, `.DS_Store`

> **Safety Rule**:
> - Never stage or commit any secret or sensitive file.
> - If an untracked secret file is detected, warn the user immediately and append it to `.gitignore` before proceeding.

---

### Step 3: Per-File Individual Staging & Diff Analysis
Iterate sequentially through each detected file:

1. **Inspect File Diff**:
   - For modified files: examine `git diff -- "<filepath>"`
   - For new files: review content to determine intent
   - For deleted files: examine git status removal
2. **Draft a Semantic Commit Message**:
   Follow Conventional Commits format with a clear scope:
   - `feat(<component/module>): <concise action-oriented description>`
   - `fix(<component/module>): <concise bug/issue resolution>`
   - `refactor(<component/module>): <structural improvement without behavior change>`
   - `style(<component/module>): <styling or formatting updates>`
   - `docs(<component/module>): <documentation updates>`
   - `chore(<component/module>): <dependency, config, or maintenance updates>`
   - `test(<component/module>): <test additions or updates>`
3. **Stage ONLY This File**:
   ```bash
   git add -- "<filepath>"
   ```
4. **Commit This File**:
   ```bash
   git commit -m "<conventional-commit-message>"
   ```
5. **Verify Commit**:
   Confirm the commit succeeded and record the short commit hash (`git rev-parse --short HEAD`).

---

### Step 4: Push to Remote (GitHub)
1. Verify the current branch: `git branch --show-current`
2. Push commits to the remote:
   ```bash
   git push origin <current-branch>
   ```
   *(If upstream tracking is missing, use `git push -u origin <current-branch>`)*

---

### Step 5: Output Summary Report
Render a clean Markdown summary table of all executed per-file commits:

```markdown
### 🚀 Per-File Commits Pushed to GitHub

| # | File | Commit Hash | Message | Status |
| :---: | :--- | :---: | :--- | :---: |
| 1 | `app/api/diagram/route.ts` | `a1b2c3d` | `fix(api): handle timeout in diagram generator` | ✅ Pushed |
| 2 | `components/canvas/node.tsx` | `e4f5g6h` | `feat(canvas): add hover tooltip for node metadata` | ✅ Pushed |
| 3 | `package.json` | `i7j8k9l` | `chore(deps): upgrade liveblocks client to v2` | ✅ Pushed |

**Branch:** `main` ➜ `origin/main`
**Total Commits:** 3
```

---

## Self-Updating Awareness
If the repository has a custom `.gitmessage`, pre-commit hooks (like Husky or lint-staged), or specific commit convention rules defined in `AGENTS.md` or `package.json`, adopt those conventions dynamically for the commit messages.
