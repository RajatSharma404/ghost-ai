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
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
})

export interface AlternativeNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    shape: string
    color: string
    textColor: string
  }
}

export interface AlternativeEdge {
  id: string
  source: string
  target: string
  data?: {
    label?: string
  }
}

export interface AlternativeArchitecture {
  id: string
  title: string
  paradigm: "serverless" | "event-driven" | "monolith" | "microservices" | "cqrs"
  description: string
  tradeoffs: {
    cost: "low" | "medium" | "high"
    complexity: "low" | "medium" | "high"
    latency: "low" | "medium" | "high"
    scalability: "low" | "medium" | "high"
  }
  pros: string[]
  cons: string[]
  nodes: AlternativeNode[]
  edges: AlternativeEdge[]
}

export interface AlternativesReport {
  summary: string
  alternatives: AlternativeArchitecture[]
}

type Node = z.infer<typeof nodeSchema>
type Edge = z.infer<typeof edgeSchema>
type ChatMessage = z.infer<typeof chatMessageSchema>

function buildTopologyContext(nodes: Node[], edges: Edge[], chatHistory: ChatMessage[]): string {
  const nodeLines = nodes
    .map((n) => {
      const label = n.data?.label ?? n.id
      const shape = n.data?.shape ?? "rectangle"
      return `- Node ID: "${n.id}", Label: "${label}", Shape: ${shape}`
    })
    .join("\n")

  const edgeLines = edges
    .map((e) => {
      const label = e.data?.label ? ` [Protocol/Label: ${e.data.label}]` : ""
      return `- ${e.source} -> ${e.target}${label}`
    })
    .join("\n")

  const chatLines = chatHistory
    .map((m) => `${m.role === "user" ? "User" : "Ghost AI"}: ${m.content}`)
    .join("\n")

  return [
    "## Current Architecture Nodes:",
    nodeLines || "(none)",
    "",
    "## Current Architecture Connections:",
    edgeLines || "(none)",
    "",
    "## User Context & Requirements:",
    chatLines || "(none)",
  ].join("\n")
}

const SYSTEM_PROMPT = `You are Ghost AI, a Principal Systems Architect.
Your task is to analyze the user's current architecture diagram and propose exactly 3 compelling, distinct alternative architectural paradigms.

Examples of paradigms to choose from:
1. Serverless Event-Driven (e.g. AWS Lambda / Cloud Run, EventBridge / PubSub, DynamoDB / Firestore)
2. Asynchronous Event-Driven Microservices (e.g. Kafka / RabbitMQ event bus, dedicated microservices, Redis caching)
3. High-Performance Modular Monolith (e.g. Unified compute cluster, read-replica Postgres, S3, CDN)
4. CQRS & Event Sourcing (e.g. Command/Query segregation, materialized views, ElasticSearch)

For each alternative, you MUST provide:
- A title, paradigm, and clear description.
- Tradeoffs rating (cost, complexity, latency, scalability as "low", "medium", or "high").
- 2-3 Pros and 2-3 Cons.
- A fully-formed set of canvas nodes and edges (with x/y positions arranged nicely left-to-right or top-to-bottom) so the user can apply it directly to the canvas!
  - Node shapes should be one of: "rectangle", "diamond", "circle", "pill", "cylinder", "hexagon".
  - Colors should use hex values like fill: "#1F1F1F", "#10233D", "#2E1938", "#331B00", "#0F2E18", "#062822".

Return raw valid JSON matching this exact structure:
{
  "summary": "<2-3 sentence overview of the 3 proposed alternatives and how they compare to the current design>",
  "alternatives": [
    {
      "id": "alt-1",
      "title": "<title>",
      "paradigm": "<'serverless' | 'event-driven' | 'monolith' | 'microservices' | 'cqrs'>",
      "description": "<description>",
      "tradeoffs": {
        "cost": "<'low' | 'medium' | 'high'>",
        "complexity": "<'low' | 'medium' | 'high'>",
        "latency": "<'low' | 'medium' | 'high'>",
        "scalability": "<'low' | 'medium' | 'high'>"
      },
      "pros": ["<pro 1>", "<pro 2>"],
      "cons": ["<con 1>", "<con 2>"],
      "nodes": [
        {
          "id": "node-1",
          "type": "canvasNode",
          "position": { "x": 100, "y": 200 },
          "data": {
            "label": "API Gateway",
            "shape": "rectangle",
            "color": "#10233D",
            "textColor": "#52A8FF"
          }
        }
      ],
      "edges": [
        {
          "id": "edge-1",
          "source": "node-1",
          "target": "node-2",
          "data": { "label": "HTTPS" }
        }
      ]
    }
  ]
}

Ensure raw JSON output only.`

function parseAlternativesJson(rawText: string): AlternativesReport {
  let cleaned = rawText.trim()
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\n?/, "")
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\n?```$/, "")
  }
  cleaned = cleaned.trim()

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>
    const summary = typeof parsed.summary === "string" ? parsed.summary : "Architectural alternatives generated."
    const alternatives: AlternativeArchitecture[] = Array.isArray(parsed.alternatives)
      ? (parsed.alternatives.map((alt, idx) => {
          const a = (typeof alt === "object" && alt !== null ? alt : {}) as Record<string, unknown>
          const tradeoffs = (typeof a.tradeoffs === "object" && a.tradeoffs !== null ? a.tradeoffs : {}) as Record<string, string>

          const nodes: AlternativeNode[] = Array.isArray(a.nodes)
            ? a.nodes.map((n, nIdx) => {
                const node = (typeof n === "object" && n !== null ? n : {}) as Record<string, unknown>
                const pos = (typeof node.position === "object" && node.position !== null ? node.position : {}) as Record<string, number>
                const data = (typeof node.data === "object" && node.data !== null ? node.data : {}) as Record<string, string>

                return {
                  id: typeof node.id === "string" && node.id ? node.id : `node-${nIdx + 1}`,
                  type: "canvasNode",
                  position: { x: Number(pos.x) || 100 + nIdx * 180, y: Number(pos.y) || 200 },
                  data: {
                    label: typeof data.label === "string" ? data.label : `Service ${nIdx + 1}`,
                    shape: typeof data.shape === "string" ? data.shape : "rectangle",
                    color: typeof data.color === "string" ? data.color : "#1F1F1F",
                    textColor: typeof data.textColor === "string" ? data.textColor : "#EDEDED",
                  },
                }
              })
            : []

          const edges: AlternativeEdge[] = Array.isArray(a.edges)
            ? a.edges.map((e, eIdx) => {
                const edge = (typeof e === "object" && e !== null ? e : {}) as Record<string, unknown>
                const data = (typeof edge.data === "object" && edge.data !== null ? edge.data : {}) as Record<string, string>

                return {
                  id: typeof edge.id === "string" && edge.id ? edge.id : `edge-${eIdx + 1}`,
                  source: typeof edge.source === "string" ? edge.source : "",
                  target: typeof edge.target === "string" ? edge.target : "",
                  data: { label: typeof data.label === "string" ? data.label : undefined },
                }
              })
            : []

          return {
            id: typeof a.id === "string" && a.id ? a.id : `alt-${idx + 1}`,
            title: typeof a.title === "string" ? a.title : `Alternative Architecture ${idx + 1}`,
            paradigm:
              typeof a.paradigm === "string" &&
              ["serverless", "event-driven", "monolith", "microservices", "cqrs"].includes(a.paradigm.toLowerCase())
                ? (a.paradigm.toLowerCase() as AlternativeArchitecture["paradigm"])
                : "microservices",
            description: typeof a.description === "string" ? a.description : "",
            tradeoffs: {
              cost: tradeoffs.cost === "low" || tradeoffs.cost === "high" ? tradeoffs.cost : "medium",
              complexity: tradeoffs.complexity === "low" || tradeoffs.complexity === "high" ? tradeoffs.complexity : "medium",
              latency: tradeoffs.latency === "low" || tradeoffs.latency === "high" ? tradeoffs.latency : "medium",
              scalability: tradeoffs.scalability === "low" || tradeoffs.scalability === "high" ? tradeoffs.scalability : "high",
            },
            pros: Array.isArray(a.pros) ? (a.pros.filter((p) => typeof p === "string") as string[]) : ["Optimized resource efficiency"],
            cons: Array.isArray(a.cons) ? (a.cons.filter((c) => typeof c === "string") as string[]) : ["Requires operational migration"],
            nodes,
            edges,
          }
        }))
      : []

    return { summary, alternatives }
  } catch {
    return {
      summary: "Generated 3 architectural alternatives with varying cost, complexity, and performance tradeoffs.",
      alternatives: [
        {
          id: "alt-1",
          title: "Fully Serverless Event-Driven Architecture",
          paradigm: "serverless",
          description: "Replaces persistent containers with on-demand serverless functions and managed event routing.",
          tradeoffs: { cost: "low", complexity: "medium", latency: "medium", scalability: "high" },
          pros: ["Pay-per-request pricing with zero idle cost", "Instant horizontal scaling"],
          cons: ["Cold start latencies on rare invocations", "Vendor platform lock-in"],
          nodes: [
            {
              id: "alt-gw",
              type: "canvasNode",
              position: { x: 100, y: 200 },
              data: { label: "Serverless Gateway", shape: "rectangle", color: "#10233D", textColor: "#52A8FF" },
            },
            {
              id: "alt-fn",
              type: "canvasNode",
              position: { x: 320, y: 200 },
              data: { label: "App Lambda Functions", shape: "hexagon", color: "#331B00", textColor: "#FF990A" },
            },
            {
              id: "alt-db",
              type: "canvasNode",
              position: { x: 540, y: 200 },
              data: { label: "DynamoDB Serverless", shape: "cylinder", color: "#0F2E18", textColor: "#62C073" },
            },
          ],
          edges: [
            { id: "e1", source: "alt-gw", target: "alt-fn", data: { label: "HTTP" } },
            { id: "e2", source: "alt-fn", target: "alt-db", data: { label: "SDK" } },
          ],
        },
      ],
    }
  }
}

export const suggestAlternatives = schemaTask({
  id: "suggest-alternatives",
  schema: payloadSchema,
  retry: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2 },
  run: async (payload) => {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_AI_API_KEY,
    })

    metadata.set("status", "starting")
    logger.info("Generating architecture alternatives", {
      projectId: payload.projectId,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
    })

    metadata.set("status", "generating")

    const context = buildTopologyContext(payload.nodes, payload.edges, payload.chatHistory)
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash"

    const result = await generateText({
      model: google(modelName),
      system: SYSTEM_PROMPT,
      prompt: context,
    })

    const report = parseAlternativesJson(result.text)

    metadata.set("status", "complete")
    metadata.set("alternativesCount", report.alternatives.length)

    logger.info("Alternatives generated successfully", {
      count: report.alternatives.length,
    })

    return report
  },
})
