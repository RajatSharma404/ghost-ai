import { schemaTask, metadata, logger } from "@trigger.dev/sdk"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { z } from "zod"

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

const nodeDataSchema = z
  .object({
    label: z.string().optional(),
    shape: z.string().optional(),
    color: z.string().optional(),
    textColor: z.string().optional(),
  })
  .passthrough()

const nodeSchema = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: nodeDataSchema.optional(),
  })
  .passthrough()

const edgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z.object({ label: z.string().optional() }).passthrough().optional(),
  })
  .passthrough()

const payloadSchema = z.object({
  projectId: z.string(),
  roomId: z.string(),
  framework: z.enum(["nextjs", "fastapi", "express"]),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
})

export interface ApiScaffoldResult {
  framework: "nextjs" | "fastapi" | "express"
  openapiYaml: string
  routesCode: string
  filename: string
  summary: string
  endpointsCount: number
}

type Node = z.infer<typeof nodeSchema>
type Edge = z.infer<typeof edgeSchema>
type ChatMessage = z.infer<typeof chatMessageSchema>

function buildTopologyContext(
  nodes: Node[],
  edges: Edge[],
  chatHistory: ChatMessage[],
  framework: string
): string {
  const nodeLines = nodes
    .map((n) => {
      const label = n.data?.label ?? n.id
      const shape = n.data?.shape ?? "rectangle"
      return `- Node ID: "${n.id}", Name: "${label}", Role/Shape: ${shape}`
    })
    .join("\n")

  const edgeLines = edges
    .map((e) => {
      const label = e.data?.label ? ` [Protocol/Route: ${e.data.label}]` : ""
      return `- ${e.source} -> ${e.target}${label}`
    })
    .join("\n")

  const chatLines = chatHistory
    .map((m) => `${m.role === "user" ? "User" : "Ghost AI"}: ${m.content}`)
    .join("\n")

  return [
    `## Target Framework: ${framework.toUpperCase()}`,
    "",
    "## Architecture Nodes (Gateways, Microservices, Databases):",
    nodeLines || "(none)",
    "",
    "## Connections & API Routes:",
    edgeLines || "(none)",
    "",
    "## User Context & Chat:",
    chatLines || "(none)",
  ].join("\n")
}

const SYSTEM_PROMPTS: Record<string, string> = {
  nextjs: `You are Ghost AI, a Principal API & Full-Stack Architect.
Generate an OpenAPI 3.0.3 specification and a complete Next.js App Router starter route handler file (\`route.ts\`) based on the architecture canvas.

Requirements:
1. Return a valid JSON object with:
   - "openapiYaml": A complete, valid OpenAPI 3.0.3 YAML string defining all paths, request bodies, query params, responses, and schemas for the services on the canvas.
   - "routesCode": Production-grade TypeScript Next.js App Router code (\`app/api/[...]/route.ts\`) exporting GET, POST, PUT, DELETE handlers with Zod schema validation, error handling, and JSON responses.
   - "summary": 2-3 sentence overview of the generated API surface.
   - "endpointsCount": Total number of distinct REST endpoints generated.

Return raw JSON only (no backticks).`,

  fastapi: `You are Ghost AI, a Principal Backend & Python Architect.
Generate an OpenAPI 3.0.3 specification and a complete FastAPI starter application (\`main.py\`) based on the architecture canvas.

Requirements:
1. Return a valid JSON object with:
   - "openapiYaml": A complete, valid OpenAPI 3.0.3 YAML string defining all paths, parameters, Pydantic schemas, and status codes.
   - "routesCode": Production-grade Python FastAPI code (\`main.py\`) with Pydantic v2 BaseModel schemas, APIRouters, dependency injection, and async route handlers.
   - "summary": 2-3 sentence overview of the generated API surface.
   - "endpointsCount": Total number of distinct REST endpoints generated.

Return raw JSON only (no backticks).`,

  express: `You are Ghost AI, a Principal Backend & TypeScript Architect.
Generate an OpenAPI 3.0.3 specification and a complete Express.js TypeScript starter router (\`routes.ts\`) based on the architecture canvas.

Requirements:
1. Return a valid JSON object with:
   - "openapiYaml": A complete, valid OpenAPI 3.0.3 YAML string defining all paths, request bodies, and responses.
   - "routesCode": Production-grade Express.js TypeScript code (\`routes.ts\`) with express.Router(), request validation, async middleware, and standardized JSON error responses.
   - "summary": 2-3 sentence overview of the generated API surface.
   - "endpointsCount": Total number of distinct REST endpoints generated.

Return raw JSON only (no backticks).`,
}

const FILENAMES: Record<string, string> = {
  nextjs: "route.ts",
  fastapi: "main.py",
  express: "routes.ts",
}

function parseScaffoldJson(rawText: string, framework: "nextjs" | "fastapi" | "express"): ApiScaffoldResult {
  let cleaned = rawText.trim()
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\n?/, "")
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\n?```$/, "")
  }
  cleaned = cleaned.trim()

  const defaultFilename = FILENAMES[framework] ?? "api-routes.ts"

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>
    const openapiYaml = typeof parsed.openapiYaml === "string" && parsed.openapiYaml.trim()
      ? parsed.openapiYaml.trim()
      : `openapi: 3.0.3\ninfo:\n  title: Architecture API\n  version: 1.0.0\npaths:\n  /api/health:\n    get:\n      summary: Health check\n      responses:\n        '200':\n          description: Healthy`

    const routesCode = typeof parsed.routesCode === "string" && parsed.routesCode.trim()
      ? parsed.routesCode.trim()
      : `// Starter API routes for ${framework}\nexport async function GET() { return Response.json({ status: "ok" }) }`

    const summary = typeof parsed.summary === "string" ? parsed.summary : `API scaffolding generated for ${framework.toUpperCase()}.`
    const endpointsCount = typeof parsed.endpointsCount === "number" ? parsed.endpointsCount : 4

    return {
      framework,
      openapiYaml,
      routesCode,
      filename: defaultFilename,
      summary,
      endpointsCount,
    }
  } catch {
    return {
      framework,
      openapiYaml: `openapi: 3.0.3\ninfo:\n  title: Ghost AI Scaffolding API\n  version: 1.0.0\npaths:\n  /api/v1/services:\n    get:\n      summary: List services\n      responses:\n        '200':\n          description: Successful response`,
      routesCode: `// API Scaffold for ${framework}\n// Generated by Ghost AI\nexport async function GET() {\n  return Response.json({ message: "API active" })\n}`,
      filename: defaultFilename,
      summary: `Generated starter API boilerplate and OpenAPI 3.0 specification for ${framework.toUpperCase()}.`,
      endpointsCount: 3,
    }
  }
}

export const generateApiScaffold = schemaTask({
  id: "generate-api-scaffold",
  schema: payloadSchema,
  retry: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2 },
  run: async (payload) => {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_AI_API_KEY,
    })

    metadata.set("status", "starting")
    metadata.set("framework", payload.framework)

    logger.info("Generating API scaffolding", {
      projectId: payload.projectId,
      framework: payload.framework,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
    })

    metadata.set("status", "generating")

    const context = buildTopologyContext(
      payload.nodes,
      payload.edges,
      payload.chatHistory,
      payload.framework
    )

    const systemPrompt = SYSTEM_PROMPTS[payload.framework] ?? SYSTEM_PROMPTS["nextjs"]
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash"

    const result = await generateText({
      model: google(modelName),
      system: systemPrompt,
      prompt: context,
    })

    const scaffold = parseScaffoldJson(result.text, payload.framework)

    metadata.set("status", "complete")
    metadata.set("endpointsCount", scaffold.endpointsCount)

    logger.info("API scaffolding generated successfully", {
      framework: payload.framework,
      endpointsCount: scaffold.endpointsCount,
    })

    return scaffold
  },
})
