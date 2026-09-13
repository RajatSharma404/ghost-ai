import type { CanvasNodeData } from "@/types/canvas"
import { TECH_ICONS } from "@/components/editor/canvas/tech-icons"

export interface NodeCostEstimate {
  monthlyCost: number
  formatted: string
  category: "database" | "compute" | "messaging"
  tierDescription: string
  badgeVariant: "emerald" | "blue" | "purple" | "amber"
}

// Baseline cloud cost metrics per unit (USD / month)
const COST_CATALOG: Record<
  string,
  { cost: number; category: "database" | "compute" | "messaging"; desc: string; variant: NodeCostEstimate["badgeVariant"] }
> = {
  // Databases & Cache
  postgresql: { cost: 45, category: "database", desc: "RDS PostgreSQL (db.t4g.medium)", variant: "emerald" },
  mysql: { cost: 42, category: "database", desc: "RDS MySQL (db.t4g.medium)", variant: "emerald" },
  mongodb: { cost: 57, category: "database", desc: "MongoDB Atlas (M10 Cluster)", variant: "emerald" },
  redis: { cost: 22, category: "database", desc: "Redis Cache (cache.t4g.micro)", variant: "emerald" },
  dynamodb: { cost: 18, category: "database", desc: "DynamoDB On-Demand", variant: "emerald" },
  elasticsearch: { cost: 65, category: "database", desc: "OpenSearch / ES Node", variant: "emerald" },
  clickhouse: { cost: 85, category: "database", desc: "ClickHouse Cloud Node", variant: "emerald" },
  supabase: { cost: 25, category: "database", desc: "Supabase Pro Tier", variant: "emerald" },
  firebase: { cost: 25, category: "database", desc: "Firestore Blaze Plan", variant: "emerald" },

  // Compute & Serverless
  docker: { cost: 28, category: "compute", desc: "ECS Container (0.5 vCPU, 1GB)", variant: "blue" },
  kubernetes: { cost: 72, category: "compute", desc: "EKS Worker (t4g.xlarge)", variant: "blue" },
  lambda: { cost: 8, category: "compute", desc: "Serverless Lambda Pay-per-use", variant: "purple" },
  nodejs: { cost: 30, category: "compute", desc: "Node.js Service Instance", variant: "blue" },
  python: { cost: 32, category: "compute", desc: "FastAPI / Python Worker", variant: "blue" },
  go: { cost: 26, category: "compute", desc: "Go Microservice Container", variant: "blue" },
  rust: { cost: 24, category: "compute", desc: "Rust High-Perf Service", variant: "blue" },
  nextjs: { cost: 20, category: "compute", desc: "Edge / Next.js SSR Cluster", variant: "blue" },
  react: { cost: 15, category: "compute", desc: "Static SPA / CDN Hosting", variant: "blue" },

  // Messaging & Queues
  kafka: { cost: 110, category: "messaging", desc: "MSK Apache Kafka (3-node)", variant: "amber" },
  rabbitmq: { cost: 35, category: "messaging", desc: "RabbitMQ Cluster Node", variant: "amber" },
  graphql: { cost: 30, category: "compute", desc: "GraphQL Gateway Engine", variant: "blue" },
  grpc: { cost: 30, category: "compute", desc: "gRPC High-Throughput RPC", variant: "blue" },
}

/**
 * Returns estimated monthly infrastructure cost for a canvas node, or null if non-costed.
 */
export function getCanvasNodeCost(nodeData: CanvasNodeData): NodeCostEstimate | null {
  const iconId = (nodeData.icon || "").toLowerCase()
  const label = (nodeData.label || "").toLowerCase()
  const shape = nodeData.shape

  // Parse replicas if configured in metadata
  const replicasRaw = nodeData.metadata?.replicas
  const replicas = replicasRaw ? Math.max(1, parseInt(replicasRaw, 10) || 1) : 1

  // 1. Direct catalog match by tech icon ID
  if (iconId && COST_CATALOG[iconId]) {
    const item = COST_CATALOG[iconId]
    const totalCost = item.category === "compute" ? item.cost * replicas : item.cost
    const formatted =
      replicas > 1 && item.category === "compute"
        ? `~$${totalCost}/mo (${replicas}x)`
        : `~$${totalCost}/mo`

    return {
      monthlyCost: totalCost,
      formatted,
      category: item.category,
      tierDescription: replicas > 1 ? `${item.desc} (${replicas} replicas)` : item.desc,
      badgeVariant: item.variant,
    }
  }

  // 2. Lookup by TechIcon category if registered in TECH_ICONS
  if (iconId && TECH_ICONS[iconId]) {
    const techCategory = TECH_ICONS[iconId].category
    if (techCategory === "database") {
      return {
        monthlyCost: 40,
        formatted: "~$40/mo",
        category: "database",
        tierDescription: `${TECH_ICONS[iconId].name} Managed Instance`,
        badgeVariant: "emerald",
      }
    }
    if (techCategory === "compute") {
      const totalCost = 30 * replicas
      return {
        monthlyCost: totalCost,
        formatted: replicas > 1 ? `~$${totalCost}/mo (${replicas}x)` : `~$${totalCost}/mo`,
        category: "compute",
        tierDescription: `${TECH_ICONS[iconId].name} Service`,
        badgeVariant: "blue",
      }
    }
    if (techCategory === "messaging") {
      return {
        monthlyCost: 45,
        formatted: "~$45/mo",
        category: "messaging",
        tierDescription: `${TECH_ICONS[iconId].name} Message Broker`,
        badgeVariant: "amber",
      }
    }
  }

  // 3. Cylinder shape convention (Standard database representation)
  if (shape === "cylinder") {
    return {
      monthlyCost: 38,
      formatted: "~$38/mo",
      category: "database",
      tierDescription: "Managed Database Instance (20GB Storage)",
      badgeVariant: "emerald",
    }
  }

  // 4. Keyword heuristics from node label
  if (
    label.includes("postgres") ||
    label.includes("mysql") ||
    label.includes("mongo") ||
    label.includes("database") ||
    label.includes("db") ||
    label.includes("aurora") ||
    label.includes("rds")
  ) {
    return {
      monthlyCost: 45,
      formatted: "~$45/mo",
      category: "database",
      tierDescription: "Cloud Relational / NoSQL Database",
      badgeVariant: "emerald",
    }
  }

  if (label.includes("redis") || label.includes("cache") || label.includes("memcached")) {
    return {
      monthlyCost: 22,
      formatted: "~$22/mo",
      category: "database",
      tierDescription: "In-Memory Cache Node",
      badgeVariant: "emerald",
    }
  }

  if (label.includes("kafka") || label.includes("queue") || label.includes("rabbit") || label.includes("sqs")) {
    return {
      monthlyCost: 45,
      formatted: "~$45/mo",
      category: "messaging",
      tierDescription: "Event Streaming / Queue Service",
      badgeVariant: "amber",
    }
  }

  if (
    label.includes("api") ||
    label.includes("server") ||
    label.includes("service") ||
    label.includes("worker") ||
    label.includes("gateway") ||
    label.includes("backend") ||
    label.includes("auth") ||
    label.includes("microservice")
  ) {
    const totalCost = 30 * replicas
    return {
      monthlyCost: totalCost,
      formatted: replicas > 1 ? `~$${totalCost}/mo (${replicas}x)` : `~$${totalCost}/mo`,
      category: "compute",
      tierDescription: `Compute Service (${replicas > 1 ? `${replicas}x instances` : "1x instance"})`,
      badgeVariant: "blue",
    }
  }

  return null
}
