<div align="center">
  <br />
    <a href="https://youtu.be/14RP8liACqo" target="_blank">
      <img src="public/readme/readme-hero.webp" alt="Project Banner">
    </a>
  <br />

  <div>
    <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logo=nextdotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/-Typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
    <img src="https://img.shields.io/badge/-shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" /><br/>
    <img src="https://img.shields.io/badge/-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
    <img src="https://img.shields.io/badge/-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" /><br/>
    <img src="https://img.shields.io/badge/Trigger.dev-22c55e?style=for-the-badge&logo=triggerdotdev&logoColor=white" />
    <img src="https://img.shields.io/badge/-Liveblocks-050505?style=for-the-badge&logo=liveblocks&logoColor=white" />
    <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
    <img src="https://img.shields.io/badge/-CodeRabbit-orange?style=for-the-badge&logo=coderabbit&logoColor=white" />
  </div>

  <h3 align="center">Ghost AI - AI-Powered Collaborative System Architect</h3>

  <div align="center">
    Build this project step by step with our detailed tutorial on <a href="https://www.youtube.com/watch?v=XUkNR-JfHwo" target="_blank"><b>JavaScript Mastery</b></a> YouTube. Join the JSM family!
  </div>
</div>

## 📋 Table of Contents

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 🔑 [Environment Variables Setup Guide](#environment-variables-setup-guide)
   - [1. Clerk (Authentication)](#1-clerk-authentication)
   - [2. Liveblocks (Real-Time Multiplayer Canvas)](#2-liveblocks-real-time-multiplayer-canvas)
   - [3. Trigger.dev (Background AI Tasks)](#3-triggerdev-background-ai-tasks)
   - [4. Database (PostgreSQL & Prisma)](#4-database-postgresql--prisma)
   - [5. Google Gemini AI Studio](#5-google-gemini-ai-studio)
   - [6. Vercel Blob (Spec File Storage)](#6-vercel-blob-spec-file-storage)
6. 🏃 [Running the Application](#running-the-application)
7. 💡 [Windows / PowerShell Tips](#windows--powershell-tips)
8. 📜 [Available Scripts](#available-scripts)
9. 📁 [Project Structure](#project-structure)
10. 🔗 [Assets & Resources](#links)

---

## ✨ <a name="introduction">Introduction</a>

**Ghost AI** is an agentic, AI-powered system architecture tool designed for modern engineering teams. 

A user provides a natural-language prompt (e.g., *"Design an event-driven e-commerce microservices architecture with Kafka and Redis"*), and a **Google Gemini**-powered AI agent autonomously generates and positions nodes, connections, and architectural layers onto a shared **React Flow** canvas in real-time. 

Teammates can watch the AI build live with animated cursors and live multiplayer presence (powered by **Liveblocks**), collaborate to refine the design, and generate full multi-page Markdown technical specifications with **Trigger.dev** background workflows.

---

## ⚙️ <a name="tech-stack">Tech Stack</a>

- **[Next.js 16](https://nextjs.org/)** (App Router, Turbopack, Server Actions) — Full-stack React framework.
- **[React 19](https://react.dev/)** — Declarative UI library with React Server Components.
- **[TypeScript](https://www.typescriptlang.org/)** — End-to-end type safety and maintainability.
- **[Vercel AI SDK](https://ai-sdk.dev/) & [@ai-sdk/google](https://ai-sdk.dev/providers/ai-sdk-providers/google)** — Unified interface for streaming AI generation using Google Gemini.
- **[Trigger.dev v4](https://trigger.dev/)** — Resumable, long-running background tasks and AI orchestration.
- **[Liveblocks](https://liveblocks.io/)** — Multiplayer canvas state synchronization, live presence, and cursor broadcasts.
- **[@xyflow/react (React Flow)](https://reactflow.dev/)** — Highly customizable node-based canvas and diagram engine.
- **[Clerk](https://clerk.com/)** — Comprehensive authentication and user management.
- **[Prisma ORM](https://www.prisma.io/) & [PostgreSQL](https://www.postgresql.org/)** — Database modeling, type-safe queries, and migrations.
- **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** — Cloud object storage for generated Markdown architecture specs.
- **[Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)** — Modern design system and accessible UI components.

---

## 🔋 <a name="features">Features</a>

- 🤖 **Autonomous AI System Architect**: Natural language prompts trigger Gemini to create, layout, and link nodes on the canvas.
- ⚡ **Multiplayer Real-time Collaboration**: Live multiplayer cursors, synchronized storage maps, and presence indicators via Liveblocks.
- 🎨 **Interactive Node Canvas**: Customizable shapes (rectangles, diamonds, circles, cylinders, pills, hexagons) with dynamic color swatches and inline label editing.
- 📄 **Automated Tech Spec Generator**: Generates comprehensive, multi-section Markdown documentation of your architecture with a single click.
- 💾 **Multi-Spec Project Storage**: PostgreSQL stores spec versions, metadata, and task runs; raw spec Markdown is saved to Vercel Blob.
- 📥 **Instant Spec Export**: Download formatted architectural specifications as `.md` files.
- 🔐 **Secure Authentication**: Protected routes and Liveblocks room auth tokens via Clerk.
- 🔄 **Background Task Resilience**: Long-running AI steps execute asynchronously on Trigger.dev without timing out.

---

## 🤸 <a name="quick-start">Quick Start</a>

### Prerequisites
- [Git](https://git-scm.com/) installed
- [Node.js 20+](https://nodejs.org/en) installed
- [npm](https://www.npmjs.com/) (or pnpm / yarn)

### 1. Clone the Repository
```bash
git clone https://github.com/RajatSharma404/ghost-ai.git
cd ghost-ai/ghost-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create `.env.local` inside the project folder:
```bash
cp .env.example .env.local
```
*(Or create a new `.env.local` file and follow the step-by-step credentials guide below).*

### 4. Push Database Schema
```bash
npx prisma db push
```

---

## 🔑 <a name="environment-variables-setup-guide">Environment Variables Setup Guide</a>

Create a file named `.env.local` in `ghost-ai/` with the following template:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Liveblocks (Multiplayer & Canvas Sync)
LIVEBLOCKS_SECRET_KEY=sk_dev_...
LIVEBLOCKS_PUBLIC_KEY=pk_dev_...

# Trigger.dev (Background Tasks)
TRIGGER_SECRET_KEY=tr_dev_...
NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY=pk_...
TRIGGER_PROJECT_REF=proj_...

# Database (PostgreSQL / Prisma)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_SPEC_MODEL=gemini-2.5-flash

# Vercel Blob (Spec File Storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Application URL
APP_URL=http://localhost:3000
```

---

### Step-by-Step Instructions to Obtain Each Credential

#### 1. Clerk (Authentication)
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/) and sign in.
2. Click **Create Application**, name it (e.g. `Ghost AI`), and choose your sign-in options (Email, Google, GitHub, etc.).
3. In the left sidebar, navigate to **Configure > Developers > API Keys**.
4. Copy:
   - **Publishable Key** (`pk_test_...`) → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** (`sk_test_...`) → `CLERK_SECRET_KEY`
5. Keep `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`.

---

#### 2. Liveblocks (Real-Time Multiplayer Canvas)
1. Go to [Liveblocks Dashboard](https://liveblocks.io/dashboard) and sign in.
2. Create a new project (e.g., `ghost-ai`).
3. In your project settings, click **API Keys**.
4. Copy:
   - **Development Secret Key** (`sk_dev_...`) → `LIVEBLOCKS_SECRET_KEY`
   - **Development Public Key** (`pk_dev_...`) → `LIVEBLOCKS_PUBLIC_KEY`

---

#### 3. Trigger.dev (Background AI Tasks)
1. Go to [Trigger.dev Cloud](https://cloud.trigger.dev) and create a free account.
2. Create a new project (e.g., `ghost-ai`).
3. Go to **Project Settings** → **API Keys**.
4. Copy:
   - **Dev Secret Key** (`tr_dev_...`) → `TRIGGER_SECRET_KEY`
   - **Public API Key** (`pk_...`) → `NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY`
   - **Project Ref** (`proj_...`) → `TRIGGER_PROJECT_REF`
5. *(Optional CLI Login)*: You can link the project via terminal with:
   ```bash
   npx trigger.dev@latest login
   ```

---

#### 4. Database (PostgreSQL & Prisma)
You can use any PostgreSQL provider (e.g. [Prisma Postgres](https://www.prisma.io/postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com)):
1. Create a PostgreSQL database instance on your chosen provider.
2. Copy the pooled / direct connection string (URI).
3. Set `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@<host>:5432/<database>?sslmode=require
   ```
4. Run Prisma synchronization:
   ```bash
   npx prisma db push
   ```

---

#### 5. Google Gemini AI Studio
1. Visit [Google AI Studio (API Keys)](https://aistudio.google.com/apikey).
2. Click **Create API Key** (choose a Google Cloud project or create a new one).
3. Copy the generated key (`AIzaSy...`) → `GOOGLE_GENERATIVE_AI_API_KEY`.
4. Leave `GEMINI_MODEL=gemini-2.5-flash` (or `gemini-2.0-flash`).

---

#### 6. Vercel Blob (Spec File Storage)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard/stores).
2. Navigate to **Storage** → Click **Create Database** → Select **Blob**.
3. Name the store (e.g., `ghost-ai-specs`) and create it.
4. Under **Quickstart / .env.local tab**, copy the **`BLOB_READ_WRITE_TOKEN`** (`vercel_blob_rw_...`).

---

## 🏃 <a name="running-the-application">Running the Application</a>

Ghost AI requires two processes to run simultaneously during development:

### Terminal 1: Next.js Web App
```bash
npm run dev
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Terminal 2: Trigger.dev Background Worker
```bash
npx trigger.dev@latest dev
```
*(This process listens for `designAgent` and `generateSpec` tasks triggered by users and executes the Gemini AI steps).*

---

## 💡 <a name="windows--powershell-tips">Windows / PowerShell Tips</a>

When using **PowerShell**, package names starting with the `@` symbol (such as `@ai-sdk/google` or `@trigger.dev/sdk`) trigger PowerShell's splatting operator. Always wrap scoped package names in double quotes:

```powershell
# ✅ Correct in PowerShell:
npm install "@trigger.dev/sdk" "@ai-sdk/google" ai

# ❌ Will throw SplattingNotPermitted error:
npm install @trigger.dev/sdk @ai-sdk/google ai
```

---

## 📜 <a name="available-scripts">Available Scripts</a>

| Script | Command | Description |
| :--- | :--- | :--- |
| **Start Dev Server** | `npm run dev` | Starts the Next.js development server on Turbopack |
| **Build Project** | `npm run build` | Builds the production bundle |
| **Start Production** | `npm run start` | Starts the built production application |
| **Lint Code** | `npm run lint` | Runs ESLint analysis |
| **Trigger Dev Worker** | `npx trigger.dev@latest dev` | Runs the Trigger.dev background task dev listener |
| **Prisma Push** | `npx prisma db push` | Syncs schema with your PostgreSQL database without migration files |
| **Prisma Studio** | `npx prisma studio` | Opens an interactive web GUI to view and edit database rows |
| **Prisma Generate** | `npx prisma generate` | Regenerates the type-safe Prisma client |

---

## 📁 <a name="project-structure">Project Structure</a>

```text
ghost-ai/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/           # Clerk custom sign-in page
│   │   └── sign-up/           # Clerk custom sign-up page
│   ├── api/
│   │   ├── ai/
│   │   │   ├── design/        # Endpoint to trigger AI canvas generation task
│   │   │   └── spec/          # Endpoint to trigger Markdown spec generation
│   │   ├── liveblocks-auth/   # Issues authenticated Liveblocks tokens
│   │   └── projects/          # Project CRUD, canvas auto-save & spec download routes
│   ├── editor/
│   │   └── [slug]/            # Main interactive canvas editor page
│   ├── layout.tsx             # Root layout with Clerk & Theme providers
│   └── page.tsx               # Landing / Dashboard redirect
├── components/
│   ├── editor/
│   │   ├── canvas/            # Custom React Flow nodes, edges, toolbar, avatars & cursors
│   │   ├── ai-sidebar.tsx     # AI chat, activity feeds & spec generation panel
│   │   └── projects-sidebar.tsx # Project navigation & creation sidebar
│   └── ui/                    # Reusable shadcn/ui components (dialog, button, tooltip, etc.)
├── lib/
│   ├── liveblocks.ts          # Liveblocks Node.js SDK server client
│   ├── prisma.ts              # Global Prisma client singleton
│   └── project-access.ts      # Project authorization helper
├── prisma/
│   └── schema.prisma          # Database schema (Project, Spec, TaskRun)
├── trigger/
│   ├── design-agent.ts        # Gemini AI agent creating canvas nodes & edges
│   └── generate-spec.ts       # Gemini task compiling graph into Markdown spec
├── types/
│   └── canvas.ts              # Node, Edge, Shape & Color type definitions
├── liveblocks.config.ts       # Liveblocks Presence, Storage & RoomEvent typing
├── trigger.config.ts          # Trigger.dev v4 project configuration
└── package.json
```

---

## 🔗 <a name="links">Assets & Resources</a>

- **Tutorial Video**: [JavaScript Mastery YouTube](https://youtu.be/14RP8liACqo)
- **Video Kit & Assets**: [JSM Video Kit](https://jsmastery.com/video-kit/f94dd75a-4d9c-4c7c-af39-6e4668389421)
- **Join the Community**: [Discord Community (50k+ members)](https://discord.com/invite/n6EdbFJ)

---

<div align="center">
  <b>Built with ❤️ by the JavaScript Mastery community</b>
</div>