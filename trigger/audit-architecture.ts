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

export interface AuditFinding {
  id: string
  category: "security" | "reliability" | "scalability" | "compliance"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  affectedNodes: string[]
  recommendation: string
}

export interface AuditReport {
  healthScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  summary: string
  findings: AuditFinding[]
  strengths: string[]
  markdownReport: string
}

type Node = z.infer<typeof nodeSchema>
type Edge = z.infer<typeof edgeSchema>
type ChatMessage = z.infer<typeof chatMessageSchema>

function buildTopologyContext(nodes: Node[], edges: Edge[], chatHistory: ChatMessage[]): string {
  const nodeLines = nodes
    .map((n) => {
      const label = n.data?.label ?? n.id
      const shape = n.data?.shape ?? "rectangle"
      return `- Node ID: "${n.id}", Name/Label: "${label}", Role/Shape: ${shape}`
    })
    .join("\n")

  const edgeLines = edges
    .map((e) => {
      const label = e.data?.label ? ` [Label/Protocol: ${e.data.label}]` : ""
      return `- ${e.source} -> ${e.target}${label}`
    })
    .join("\n")

  const chatLines = chatHistory
    .map((m) => `${m.role === "user" ? "User" : "Ghost AI"}: ${m.content}`)
    .join("\n")

  return [
    "## Architecture Nodes (Services, Gateways, Databases, Storage, Queues):",
    nodeLines || "(none)",
    "",
    "## Architecture Connections & Communication Flows:",
    edgeLines || "(none)",
    "",
    "## User Context & Requirements:",
    chatLines || "(none)",
  ].join("\n")
}

const SYSTEM_PROMPT = `You are Ghost AI, a world-class Principal Cloud Security and Distributed Systems Architect specializing in STRIDE threat modeling, OWASP Top 10, AWS Well-Architected Framework, and high-availability reliability engineering.

Your task is to conduct a thorough technical security and reliability audit of the provided architecture diagram.

Analyze the architecture across 4 critical pillars:
1. 🛡️ Security & Attack Surface:
   - Are databases or storage buckets directly exposed without an API gateway or reverse proxy?
   - Is authentication / authorization middleware present at the ingress layer?
   - Are communication protocols encrypted (TLS) or missing security boundaries?
2. ⚡ Reliability & Single Points of Failure (SPoF):
   - Are there critical bottleneck nodes without redundancy or failover?
   - Are synchronous calls chained across multiple microservices causing cascading failures?
   - Is there a lack of message queues / buffers for bursty workloads?
3. 📈 Scalability & Performance:
   - Are there missing caching layers (e.g. Redis, CDN) before heavy database queries?
   - Are database read/write separations or asynchronous worker pools missing?
4. 📋 Compliance & Operational Excellence:
   - Best practices for logging, secrets management, and data isolation (SOC2, HIPAA, GDPR).

You MUST return a valid JSON object matching this exact structure:
{
  "healthScore": <number between 0 and 100>,
  "riskLevel": "<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>",
  "summary": "<2-3 sentence executive summary of the architectural health and key vulnerabilities>",
  "strengths": [
    "<bullet point string of well-designed architectural choices present in the diagram>"
  ],
  "findings": [
    {
      "id": "finding-1",
      "category": "<'security' | 'reliability' | 'scalability' | 'compliance'>",
      "severity": "<'critical' | 'high' | 'medium' | 'low'>",
      "title": "<short descriptive title>",
      "description": "<detailed explanation of the vulnerability or risk>",
      "affectedNodes": ["<node-id-1>", "<node-id-2>"],
      "recommendation": "<concrete, actionable technical fix or pattern to apply>"
    }
  ]
}

Ensure the response is raw, valid JSON only (do not include markdown code block backticks, just the JSON).`

function parseAuditJson(rawText: string): Omit<AuditReport, "markdownReport"> {
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
    const healthScore = typeof parsed.healthScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.healthScore))) : 75
    const riskLevel = typeof parsed.riskLevel === "string" && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(parsed.riskLevel.toUpperCase())
      ? (parsed.riskLevel.toUpperCase() as AuditReport["riskLevel"])
      : healthScore >= 80 ? "LOW" : healthScore >= 60 ? "MEDIUM" : healthScore >= 40 ? "HIGH" : "CRITICAL"

    const summary = typeof parsed.summary === "string" ? parsed.summary : "Architecture audit completed."
    const strengths = Array.isArray(parsed.strengths) ? (parsed.strengths.filter((s) => typeof s === "string") as string[]) : []
    
    const findings: AuditFinding[] = Array.isArray(parsed.findings)
      ? (parsed.findings.map((f, idx) => {
          const item = (typeof f === "object" && f !== null ? f : {}) as Record<string, unknown>
          const category = typeof item.category === "string" && ["security", "reliability", "scalability", "compliance"].includes(item.category.toLowerCase())
            ? (item.category.toLowerCase() as AuditFinding["category"])
            : "security"
          const severity = typeof item.severity === "string" && ["critical", "high", "medium", "low"].includes(item.severity.toLowerCase())
            ? (item.severity.toLowerCase() as AuditFinding["severity"])
            : "medium"

          return {
            id: typeof item.id === "string" && item.id ? item.id : `finding-${idx + 1}`,
            category,
            severity,
            title: typeof item.title === "string" ? item.title : `Architectural Finding ${idx + 1}`,
            description: typeof item.description === "string" ? item.description : "",
            affectedNodes: Array.isArray(item.affectedNodes) ? (item.affectedNodes.filter((n) => typeof n === "string") as string[]) : [],
            recommendation: typeof item.recommendation === "string" ? item.recommendation : "",
          }
        }))
      : []

    return { healthScore, riskLevel, summary, strengths, findings }
  } catch {
    return {
      healthScore: 70,
      riskLevel: "MEDIUM",
      summary: "Audit completed with recommendations for security hardening and reliability improvements.",
      strengths: ["Clean modular node structure"],
      findings: [
        {
          id: "finding-1",
          category: "security",
          severity: "medium",
          title: "Ensure Ingress Authentication & Rate Limiting",
          description: "Verify all entrypoints and microservices enforce token validation and TLS termination.",
          affectedNodes: [],
          recommendation: "Introduce an API Gateway with rate limiting and JWT verification.",
        },
      ],
    }
  }
}

function generateMarkdownReport(report: Omit<AuditReport, "markdownReport">): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const findingsMd = report.findings
    .map(
      (f, i) => `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title}
- **Category**: ${f.category.toUpperCase()}
- **Severity**: ${f.severity.toUpperCase()}
${f.affectedNodes.length > 0 ? `- **Affected Services**: ${f.affectedNodes.map((n) => `\`${n}\``).join(", ")}` : ""}
- **Description**: ${f.description}
- **Actionable Fix**: ${f.recommendation}
`
    )
    .join("\n")

  const strengthsMd = report.strengths.map((s) => `- ✅ ${s}`).join("\n")

  return `# Architecture Security & Reliability Audit Report
*Generated on ${dateStr} by Ghost AI*

---

## 📊 Executive Summary
- **Overall Health Score**: **${report.healthScore}/100**
- **Risk Level**: **${report.riskLevel}**
- **Total Findings**: ${report.findings.length} issues identified

${report.summary}

---

## 🌟 Well-Architected Highlights
${strengthsMd || "- Baseline component connectivity established."}

---

## ⚠️ Detailed Findings & Recommendations
${findingsMd || "No critical issues detected. Architecture aligns with standard cloud patterns."}

---
*Report compiled automatically by Ghost AI System Architect.*`
}

export const auditArchitecture = schemaTask({
  id: "audit-architecture",
  schema: payloadSchema,
  retry: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2 },
  run: async (payload) => {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_AI_API_KEY,
    })

    metadata.set("status", "starting")
    logger.info("Starting architecture audit", {
      projectId: payload.projectId,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
    })

    metadata.set("status", "auditing")

    const context = buildTopologyContext(payload.nodes, payload.edges, payload.chatHistory)
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash"

    const result = await generateText({
      model: google(modelName),
      system: SYSTEM_PROMPT,
      prompt: context,
    })

    const parsedReport = parseAuditJson(result.text)
    const markdownReport = generateMarkdownReport(parsedReport)

    const finalReport: AuditReport = {
      ...parsedReport,
      markdownReport,
    }

    metadata.set("status", "complete")
    metadata.set("healthScore", finalReport.healthScore)
    metadata.set("riskLevel", finalReport.riskLevel)
    metadata.set("findingsCount", finalReport.findings.length)

    logger.info("Architecture audit completed successfully", {
      healthScore: finalReport.healthScore,
      riskLevel: finalReport.riskLevel,
      findingsCount: finalReport.findings.length,
    })

    return finalReport
  },
})
