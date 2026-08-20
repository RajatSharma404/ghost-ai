import { MarkerType } from "@xyflow/react"
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas"
import { NODE_COLORS, SHAPE_DEFAULTS } from "@/types/canvas"

export type TemplateCategory = "all" | "ai" | "streaming" | "saas" | "microservices" | "devops"

export interface CanvasTemplate {
  id: string
  name: string
  category: TemplateCategory
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const C = NODE_COLORS

function n(
  id: string,
  label: string,
  colorIdx: number,
  shape: NodeShape,
  x: number,
  y: number,
  icon?: string,
  w?: number,
  h?: number
): CanvasNode {
  const def = SHAPE_DEFAULTS[shape]
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: {
      label,
      color: C[colorIdx].fill,
      textColor: C[colorIdx].text,
      shape,
      icon,
    },
    width: w ?? def.width,
    height: h ?? def.height,
  }
}

const MARKER_END = {
  type: MarkerType.ArrowClosed,
  color: "rgba(255,255,255,0.4)",
  width: 16,
  height: 16,
} as const

function e(id: string, source: string, target: string, label = ""): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    data: { label },
    markerEnd: MARKER_END,
  }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "rag-ai-pipeline",
    name: "RAG AI Agent Pipeline",
    category: "ai",
    description: "Enterprise Retrieval-Augmented Generation pipeline featuring query embedding, semantic cache, pgvector hybrid search, LLM generator, and observability tracing.",
    nodes: [
      n("rag-user",   "User Prompt Ingress", 1, "rectangle",   0, 140, "nextjs"),
      n("rag-cache",  "Semantic Cache",      3, "rectangle", 240,  40, "redis"),
      n("rag-embed",  "Embedding Model",     2, "hexagon",   240, 240, "python"),
      n("rag-vdb",    "pgvector Vector DB",  0, "cylinder",  500, 240, "postgresql"),
      n("rag-rerank", "Hybrid Reranker",     6, "diamond",   740, 210, "fastapi"),
      n("rag-llm",    "Gemini 2.5 Pro LLM",  7, "rectangle", 740,  40, "gcp"),
      n("rag-trace",  "Langfuse Tracing",    5, "rectangle", 980, 140, "docker"),
    ],
    edges: [
      e("rag-e1", "rag-user",   "rag-cache", "Check Cache"),
      e("rag-e2", "rag-user",   "rag-embed", "Cache Miss"),
      e("rag-e3", "rag-embed",  "rag-vdb", "Dense Vectors"),
      e("rag-e4", "rag-vdb",    "rag-rerank", "Top 50 Chunks"),
      e("rag-e5", "rag-rerank", "rag-llm", "Top 5 Context"),
      e("rag-e6", "rag-cache",  "rag-llm", "Direct Context"),
      e("rag-e7", "rag-llm",    "rag-trace", "Latency & Cost"),
    ],
  },
  {
    id: "netflix-streaming",
    name: "Netflix Video Streaming & CDN",
    category: "streaming",
    description: "Global multi-tier video streaming infrastructure with Anycast CDN edge caching, distributed transcoders, S3 origin, and microservice recommendation engine.",
    nodes: [
      n("st-cdn",     "Cloudflare Anycast CDN", 1, "rectangle", 240,   0, "cloudflare"),
      n("st-edge",    "Edge Transcoders",       3, "rectangle",   0, 150, "aws"),
      n("st-origin",  "S3 Video Storage",       0, "cylinder",    0, 310, "aws"),
      n("st-auth",    "Session Auth Gate",      2, "pill",      240, 160, "redis"),
      n("st-recom",   "ML Recommendations",     6, "hexagon",   480, 150, "python"),
      n("st-meta",    "DynamoDB Metadata",      0, "cylinder",  480, 310, "aws"),
      n("st-stream",  "HLS Video Packaging",    7, "rectangle", 240, 310, "docker"),
    ],
    edges: [
      e("st-e1", "st-cdn",   "st-edge", "Transcode"),
      e("st-e2", "st-cdn",   "st-auth", "JWT Validate"),
      e("st-e3", "st-cdn",   "st-recom", "Personalize"),
      e("st-e4", "st-edge",  "st-origin", "Store Assets"),
      e("st-e5", "st-auth",  "st-stream", "Generate Token"),
      e("st-e6", "st-recom", "st-meta", "Query Ratings"),
      e("st-e7", "st-stream","st-cdn", "Manifest Delivery"),
    ],
  },
  {
    id: "uber-dispatch",
    name: "Uber Real-Time Geolocation",
    category: "streaming",
    description: "High-throughput real-time ride dispatcher with WebSocket gateway, H3 spatial geo-sharding, Kafka event stream, and Cassandra trip logs.",
    nodes: [
      n("ub-app",     "Driver / Rider Mobile", 1, "rectangle",   0, 140, "nextjs"),
      n("ub-ws",      "WebSocket Gateway",     3, "rectangle", 240, 140, "go"),
      n("ub-redis",   "Geo-Sharded Redis",     2, "cylinder",  480,  30, "redis"),
      n("ub-kafka",   "Kafka Event Bus",       5, "hexagon",   480, 250, "kafka"),
      n("ub-match",   "H3 Dispatch Matcher",   7, "rectangle", 720, 140, "kubernetes"),
      n("ub-db",      "Cassandra Trip DB",     0, "cylinder",  960, 140, "postgresql"),
    ],
    edges: [
      e("ub-e1", "ub-app",   "ub-ws", "GPS Ping (1s)"),
      e("ub-e2", "ub-ws",    "ub-redis", "Update Geo Index"),
      e("ub-e3", "ub-ws",    "ub-kafka", "Ride Requested"),
      e("ub-e4", "ub-kafka", "ub-match", "Consume Request"),
      e("ub-e5", "ub-redis", "ub-match", "Query Nearby Drivers"),
      e("ub-e6", "ub-match", "ub-db", "Persist Match"),
    ],
  },
  {
    id: "b2b-saas",
    name: "Multi-Tenant Enterprise SaaS",
    category: "saas",
    description: "Enterprise SaaS architecture with Cloudflare DDoS protection, Clerk auth, multi-tenant API gateway, sharded Postgres, Stripe webhooks, and BullMQ worker queue.",
    nodes: [
      n("saas-ing",   "Cloudflare Ingress",   1, "rectangle", 240,   0, "cloudflare"),
      n("saas-gw",    "API Gateway",          3, "rectangle", 240, 130, "nextjs"),
      n("saas-auth",  "Clerk Auth Service",   2, "pill",        0, 130, "supabase"),
      n("saas-db",    "Sharded PostgreSQL",   0, "cylinder",  240, 270, "postgresql"),
      n("saas-queue", "BullMQ Worker Queue",  5, "hexagon",   480, 130, "redis"),
      n("saas-pay",   "Stripe Webhook Worker",4, "rectangle", 480, 270, "docker"),
    ],
    edges: [
      e("saas-e1", "saas-ing",   "saas-gw", "HTTPS Ingress"),
      e("saas-e2", "saas-gw",    "saas-auth", "Tenant Check"),
      e("saas-e3", "saas-gw",    "saas-db", "Tenant Query"),
      e("saas-e4", "saas-gw",    "saas-queue", "Async Jobs"),
      e("saas-e5", "saas-queue", "saas-pay", "Process Billing"),
    ],
  },
  {
    id: "microservices",
    name: "Kubernetes Microservices",
    category: "microservices",
    description: "API Gateway routes traffic to isolated microservices, each backed by dedicated databases and connected via an asynchronous event bus.",
    nodes: [
      n("ms-gw",    "Ingress Gateway",   1, "rectangle", 240,   0, "kubernetes"),
      n("ms-auth",  "Auth Service",      2, "pill",        0, 160, "go"),
      n("ms-users", "User Service",      7, "rectangle",  200, 160, "docker"),
      n("ms-orders","Order Service",     3, "rectangle",  380, 160, "docker"),
      n("ms-pay",   "Payment Service",   5, "rectangle",  560, 160, "docker"),
      n("ms-udb",   "User DB",           0, "cylinder",   200, 320, "postgresql"),
      n("ms-odb",   "Order DB",          0, "cylinder",   380, 320, "postgresql"),
    ],
    edges: [
      e("ms-e1", "ms-gw",    "ms-auth"),
      e("ms-e2", "ms-gw",    "ms-users"),
      e("ms-e3", "ms-gw",    "ms-orders"),
      e("ms-e4", "ms-gw",    "ms-pay"),
      e("ms-e5", "ms-users", "ms-udb"),
      e("ms-e6", "ms-orders","ms-odb"),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "Cloud CI/CD Pipeline",
    category: "devops",
    description: "End-to-end automated delivery from source commit through container build, security scan, and staged canary deployment.",
    nodes: [
      n("ci-src",   "GitHub Repository",    1, "rectangle",    0, 60, "docker"),
      n("ci-build", "Docker Build",         3, "rectangle",  220, 60, "docker"),
      n("ci-test",  "Test & Vulnerability", 6, "diamond",    440, 30, "python"),
      n("ci-pkg",   "Registry Artifact",    1, "rectangle",  680, 60, "aws"),
      n("ci-stg",   "Staging Cluster",      3, "rectangle",  900, 60, "kubernetes"),
      n("ci-prod",  "Production Fleet",     7, "rectangle", 1140, 60, "kubernetes"),
    ],
    edges: [
      e("ci-e1", "ci-src",   "ci-build"),
      e("ci-e2", "ci-build", "ci-test"),
      e("ci-e3", "ci-test",  "ci-pkg"),
      e("ci-e4", "ci-pkg",   "ci-stg"),
      e("ci-e5", "ci-stg",   "ci-prod"),
    ],
  },
]
