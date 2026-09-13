---
name: improvement
description: >
  Deep-dive code review and improvement audit for any project. Trigger this skill
  whenever the user runs /improvement, asks Claude or Antigravity to "review my project",
  "audit my codebase", "find bugs", "suggest improvements", "what can be better in my
  project", or pastes a repo/file set and asks for a thorough analysis. Also
  trigger when the user says things like "go through my project and tell me what
  to fix", "improve my app", or "what's wrong with my code".
---

# /improvement — Project Audit & Improvement Skill

You are acting as a senior full-stack engineer doing a structured code review.
Your job is to go through the project thoroughly and produce a prioritised,
actionable improvement report covering bugs, performance, DX, architecture,
security, and quick wins.

---

## Step 1 — Gather Context

Before analysing anything, collect:
1. **Project entry points** — Root directory structure, key files, tech stack, known pain points.
2. **Scope** — Full audit or focused audit.

---

## Step 2 — Read the Project Thoroughly

Go through every file/section. Tag items into the five buckets:
- 🐛 **Bug / Broken**
- ⚡ **Performance**
- 🔒 **Security**
- 🏗️ **Architecture / DX**
- ✨ **Quick Wins**

---

## Step 3 — Generate the Report

Output structure:
- 🔍 Project Overview
- 🐛 Bug Fixes (must-fix)
- ⚡ Performance Improvements (high impact)
- 🔒 Security Issues (critical first)
- 🏗️ Architecture & Code Quality (major changes)
- ✨ Quick Wins (minor changes, big feel)
- 🗺️ Recommended Action Order
- 💡 Optional Enhancements

---

## Step 4 — Offer Follow-Up

Always offer:
> "Want me to implement any of these fixes? Just say which number(s) and I'll write the code."
