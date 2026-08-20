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
  cloudProvider: z.enum(["aws", "gcp", "azure"]),
  trafficTier: z.enum(["starter", "growth", "scale", "enterprise"]),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
})

export interface CostItem {
  id: string
  serviceName: string
  category: "compute" | "database" | "storage" | "network" | "ai" | "other"
  monthlyCost: number
  details: string
  nodeIds: string[]
}

export interface CostSavingTip {
  title: string
  potentialSavings: string
  description: string
}

export interface CostReport {
  cloudProvider: "aws" | "gcp" | "azure"
  trafficTier: "starter" | "growth" | "scale" | "enterprise"
  totalMonthlyEstimate: number
  currency: "USD"
  categoryTotals: {
    compute: number
    database: number
    storage: number
    network: number
    ai: number
    other: number
  }
  breakdown: CostItem[]
  costSavingTips: CostSavingTip[]
  summary: string
  markdownReport: string
}

type Node = z.infer<typeof nodeSchema>
type Edge = z.infer<typeof edgeSchema>
type ChatMessage = z.infer<typeof chatMessageSchema>

const TRAFFIC_TIER_DESCRIPTIONS: Record<string, string> = {
  starter: "Starter Tier (~10,000 monthly requests, low traffic, MVP / dev environment, single small instances)",
  growth: "Growth Tier (~500,000 monthly requests, moderate production traffic, standard high-availability RDS + ECS/GKE)",
  scale: "Scale Tier (~10,000,000 monthly requests, high traffic, multi-AZ clusters, Redis caching, auto-scaling compute, high IOPS)",
  enterprise: "Enterprise Tier (~100,000,000+ monthly requests, multi-region failover, massive database clusters, dedicated bandwidth, 24/7 SLA)",
}

function buildTopologyContext(
  nodes: Node[],
  edges: Edge[],
  chatHistory: ChatMessage[],
  cloudProvider: string,
  trafficTier: string
): string {
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
    `## Target Cloud Provider: ${cloudProvider.toUpperCase()}`,
    `## Traffic & Scale Tier: ${trafficTier.toUpperCase()} (${TRAFFIC_TIER_DESCRIPTIONS[trafficTier] ?? "Standard Production"})`,
    "",
    "## Architecture Nodes (Services, Databases, Gateways, Storage, Queues):",
    nodeLines || "(none)",
    "",
    "## Architecture Connections & Data Flows:",
    edgeLines || "(none)",
    "",
    "## User Context & Requirements:",
    chatLines || "(none)",
  ].join("\n")
}

const SYSTEM_PROMPT = `You are Ghost AI, a seasoned Cloud FinOps Specialist and Principal Cloud Architect with deep knowledge of real-world public cloud pricing models for AWS, GCP, and Azure.

Your task is to compute a realistic monthly infrastructure cost estimate ($ USD / month) for the given architecture diagram based on the selected cloud provider and traffic tier.

Guidelines:
1. Map canvas components to realistic cloud services:
   - For AWS: ECS Fargate/EC2, RDS PostgreSQL/Aurora, ElastiCache Redis, S3, ALB, NAT Gateway, CloudWatch.
   - For GCP: Cloud Run/GKE, Cloud SQL, Memorystore, Cloud Storage, Cloud Load Balancing.
   - For Azure: Azure Container Apps/AKS, Azure Database for PostgreSQL, Azure Cache for Redis, Blob Storage, Application Gateway.
2. Calibrate costs to the selected traffic tier (e.g. Starter tier uses small burstable instances t4g/f1-micro, Scale tier uses multi-AZ provisioned r6g/db.r6g instances with high IOPS).
3. Include networking and egress costs where appropriate (e.g. NAT Gateways, load balancer base fees, inter-AZ data transfer).
4. Provide actionable FinOps optimization tips with estimated dollar savings.

You MUST return a valid JSON object matching this exact structure:
{
  "totalMonthlyEstimate": <number, integer or rounded dollar value>,
  "currency": "USD",
  "categoryTotals": {
    "compute": <number>,
    "database": <number>,
    "storage": <number>,
    "network": <number>,
    "ai": <number>,
    "other": <number>
  },
  "summary": "<2-3 sentence executive summary of the monthly cloud budget and primary cost drivers>",
  "breakdown": [
    {
      "id": "cost-item-1",
      "serviceName": "<e.g. AWS RDS PostgreSQL db.t4g.medium>",
      "category": "<'compute' | 'database' | 'storage' | 'network' | 'ai' | 'other'>",
      "monthlyCost": <number>,
      "details": "<e.g. 2 vCPU, 4GB RAM, 50GB gp3 SSD storage with automated daily snapshots>",
      "nodeIds": ["<node-id-1>"]
    }
  ],
  "costSavingTips": [
    {
      "title": "<e.g. Use 1-Year Savings Plans / Reserved Instances>",
      "potentialSavings": "<e.g. ~35% ($45/mo)>",
      "description": "<concrete action to take to reduce costs without sacrificing reliability>"
    }
  ]
}

Return raw valid JSON only (no markdown code block backticks, just the JSON).`

function parseCostJson(
  rawText: string,
  cloudProvider: "aws" | "gcp" | "azure",
  trafficTier: "starter" | "growth" | "scale" | "enterprise"
): Omit<CostReport, "markdownReport"> {
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
    const breakdown: CostItem[] = Array.isArray(parsed.breakdown)
      ? parsed.breakdown.map((item, idx) => {
          const b = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>
          const category =
            typeof b.category === "string" &&
            ["compute", "database", "storage", "network", "ai", "other"].includes(b.category.toLowerCase())
              ? (b.category.toLowerCase() as CostItem["category"])
              : "compute"

          return {
            id: typeof b.id === "string" && b.id ? b.id : `cost-${idx + 1}`,
            serviceName: typeof b.serviceName === "string" ? b.serviceName : `Cloud Service ${idx + 1}`,
            category,
            monthlyCost: typeof b.monthlyCost === "number" ? Math.max(0, Math.round(b.monthlyCost)) : 20,
            details: typeof b.details === "string" ? b.details : "",
            nodeIds: Array.isArray(b.nodeIds) ? (b.nodeIds.filter((n) => typeof n === "string") as string[]) : [],
          }
        })
      : []

    const categoryTotals =
      typeof parsed.categoryTotals === "object" && parsed.categoryTotals !== null
        ? {
            compute: Number((parsed.categoryTotals as Record<string, unknown>).compute) || 0,
            database: Number((parsed.categoryTotals as Record<string, unknown>).database) || 0,
            storage: Number((parsed.categoryTotals as Record<string, unknown>).storage) || 0,
            network: Number((parsed.categoryTotals as Record<string, unknown>).network) || 0,
            ai: Number((parsed.categoryTotals as Record<string, unknown>).ai) || 0,
            other: Number((parsed.categoryTotals as Record<string, unknown>).other) || 0,
          }
        : {
            compute: breakdown.filter((b) => b.category === "compute").reduce((s, b) => s + b.monthlyCost, 0),
            database: breakdown.filter((b) => b.category === "database").reduce((s, b) => s + b.monthlyCost, 0),
            storage: breakdown.filter((b) => b.category === "storage").reduce((s, b) => s + b.monthlyCost, 0),
            network: breakdown.filter((b) => b.category === "network").reduce((s, b) => s + b.monthlyCost, 0),
            ai: breakdown.filter((b) => b.category === "ai").reduce((s, b) => s + b.monthlyCost, 0),
            other: breakdown.filter((b) => b.category === "other").reduce((s, b) => s + b.monthlyCost, 0),
          }

    const calculatedTotal = breakdown.reduce((sum, item) => sum + item.monthlyCost, 0)
    const totalMonthlyEstimate =
      typeof parsed.totalMonthlyEstimate === "number" && parsed.totalMonthlyEstimate > 0
        ? Math.round(parsed.totalMonthlyEstimate)
        : calculatedTotal || 85

    const summary =
      typeof parsed.summary === "string"
        ? parsed.summary
        : `Estimated monthly spend of $${totalMonthlyEstimate}/mo for ${cloudProvider.toUpperCase()} on the ${trafficTier} tier.`

    const costSavingTips: CostSavingTip[] = Array.isArray(parsed.costSavingTips)
      ? parsed.costSavingTips.map((tip) => {
          const t = (typeof tip === "object" && tip !== null ? tip : {}) as Record<string, unknown>
          return {
            title: typeof t.title === "string" ? t.title : "Optimize Cloud Resources",
            potentialSavings: typeof t.potentialSavings === "string" ? t.potentialSavings : "~20%",
            description: typeof t.description === "string" ? t.description : "",
          }
        })
      : []

    return {
      cloudProvider,
      trafficTier,
      totalMonthlyEstimate,
      currency: "USD",
      categoryTotals,
      breakdown,
      costSavingTips,
      summary,
    }
  } catch {
    return {
      cloudProvider,
      trafficTier,
      totalMonthlyEstimate: 95,
      currency: "USD",
      categoryTotals: { compute: 45, database: 30, storage: 10, network: 10, ai: 0, other: 0 },
      breakdown: [
        {
          id: "cost-1",
          serviceName: `${cloudProvider.toUpperCase()} App Service / Container Compute`,
          category: "compute",
          monthlyCost: 45,
          details: "2 vCPU, 4GB RAM scalable compute containers",
          nodeIds: [],
        },
        {
          id: "cost-2",
          serviceName: `${cloudProvider.toUpperCase()} Managed SQL Database`,
          category: "database",
          monthlyCost: 30,
          details: "Single-AZ instance with 20GB SSD storage",
          nodeIds: [],
        },
        {
          id: "cost-3",
          serviceName: `${cloudProvider.toUpperCase()} Object Storage & CDN`,
          category: "storage",
          monthlyCost: 10,
          details: "Standard storage tier with edge delivery",
          nodeIds: [],
        },
        {
          id: "cost-4",
          serviceName: `${cloudProvider.toUpperCase()} Load Balancer & Data Transfer`,
          category: "network",
          monthlyCost: 10,
          details: "Application Gateway with basic egress bandwidth",
          nodeIds: [],
        },
      ],
      costSavingTips: [
        {
          title: "Enable Auto-Scaling with Minimum Capacity of 1",
          potentialSavings: "~25% ($20/mo)",
          description: "Scale containers to zero during non-peak hours to reduce compute baseline costs.",
        },
      ],
      summary: `Estimated monthly budget of $95/month on ${cloudProvider.toUpperCase()} for the ${trafficTier} traffic profile.`,
    }
  }
}

function generateMarkdownReport(report: Omit<CostReport, "markdownReport">): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const breakdownRows = report.breakdown
    .map(
      (item) =>
        `| **${item.serviceName}** | \`${item.category.toUpperCase()}\` | $${item.monthlyCost}/mo | ${item.details} |`
    )
    .join("\n")

  const tipsMd = report.costSavingTips
    .map(
      (tip, i) => `### ${i + 1}. ${tip.title} *(Potential Savings: ${tip.potentialSavings})*
- ${tip.description}
`
    )
    .join("\n")

  return `# Cloud Cost & Capacity Estimate Report
*Generated on ${dateStr} by Ghost AI*

---

## 💰 Executive Summary
- **Target Cloud Provider**: **${report.cloudProvider.toUpperCase()}**
- **Traffic Scale Tier**: **${report.trafficTier.toUpperCase()}**
- **Estimated Monthly Cost**: **$${report.totalMonthlyEstimate} USD / month**
- **Estimated Annual Run Rate**: **$${report.totalMonthlyEstimate * 12} USD / year**

${report.summary}

---

## 📊 Spend by Category
| Category | Monthly Spend | Share |
|:---------|:--------------|:------|
| 🖥️ Compute | $${report.categoryTotals.compute}/mo | ${report.totalMonthlyEstimate ? Math.round((report.categoryTotals.compute / report.totalMonthlyEstimate) * 100) : 0}% |
| 🗄️ Database | $${report.categoryTotals.database}/mo | ${report.totalMonthlyEstimate ? Math.round((report.categoryTotals.database / report.totalMonthlyEstimate) * 100) : 0}% |
| 📦 Storage | $${report.categoryTotals.storage}/mo | ${report.totalMonthlyEstimate ? Math.round((report.categoryTotals.storage / report.totalMonthlyEstimate) * 100) : 0}% |
| 🌐 Network & Egress | $${report.categoryTotals.network}/mo | ${report.totalMonthlyEstimate ? Math.round((report.categoryTotals.network / report.totalMonthlyEstimate) * 100) : 0}% |
| 🤖 AI / LLM APIs | $${report.categoryTotals.ai}/mo | ${report.totalMonthlyEstimate ? Math.round((report.categoryTotals.ai / report.totalMonthlyEstimate) * 100) : 0}% |
| ⚙️ Other / Monitoring | $${report.categoryTotals.other}/mo | ${report.totalMonthlyEstimate ? Math.round((report.categoryTotals.other / report.totalMonthlyEstimate) * 100) : 0}% |

---

## 📋 Itemized Service Breakdown
| Service | Category | Monthly Cost | Configuration Details |
|:--------|:---------|:-------------|:----------------------|
${breakdownRows || "| (none) | - | $0 | - |"}

---

## 💡 FinOps Cost Optimization Recommendations
${tipsMd || "- Architecture is already cost-optimized for the target scale."}

---
*Report generated automatically by Ghost AI Cloud FinOps Architect.*`
}

export const estimateCost = schemaTask({
  id: "estimate-cost",
  schema: payloadSchema,
  retry: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2 },
  run: async (payload) => {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_AI_API_KEY,
    })

    metadata.set("status", "starting")
    metadata.set("provider", payload.cloudProvider)
    metadata.set("tier", payload.trafficTier)

    logger.info("Starting cost estimation", {
      projectId: payload.projectId,
      provider: payload.cloudProvider,
      tier: payload.trafficTier,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
    })

    metadata.set("status", "estimating")

    const context = buildTopologyContext(
      payload.nodes,
      payload.edges,
      payload.chatHistory,
      payload.cloudProvider,
      payload.trafficTier
    )

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash"

    const result = await generateText({
      model: google(modelName),
      system: SYSTEM_PROMPT,
      prompt: context,
    })

    const parsedReport = parseCostJson(result.text, payload.cloudProvider, payload.trafficTier)
    const markdownReport = generateMarkdownReport(parsedReport)

    const finalReport: CostReport = {
      ...parsedReport,
      markdownReport,
    }

    metadata.set("status", "complete")
    metadata.set("totalCost", finalReport.totalMonthlyEstimate)

    logger.info("Cost estimation completed", {
      totalCost: finalReport.totalMonthlyEstimate,
      provider: payload.cloudProvider,
      tier: payload.trafficTier,
    })

    return finalReport
  },
})
