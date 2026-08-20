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
  format: z.enum(["docker-compose", "terraform", "kubernetes"]),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
})

type Node = z.infer<typeof nodeSchema>
type Edge = z.infer<typeof edgeSchema>
type ChatMessage = z.infer<typeof chatMessageSchema>

function buildTopologyContext(
  nodes: Node[],
  edges: Edge[],
  chatHistory: ChatMessage[],
  format: string
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
      const label = e.data?.label ? ` [Protocol/Data: ${e.data.label}]` : ""
      return `- ${e.source} -> ${e.target}${label}`
    })
    .join("\n")

  const chatLines = chatHistory
    .map((m) => `${m.role === "user" ? "User" : "Ghost AI"}: ${m.content}`)
    .join("\n")

  return [
    `## Requested Format: ${format}`,
    "",
    "## Architecture Nodes (Services, Databases, Queues, Gateways):",
    nodeLines || "(none)",
    "",
    "## Architecture Connections & Data Flows:",
    edgeLines || "(none)",
    "",
    "## User Context & Chat History:",
    chatLines || "(none)",
  ].join("\n")
}

const SYSTEM_PROMPTS: Record<string, string> = {
  "docker-compose": `You are Ghost AI, a principal DevOps and Cloud Infrastructure Architect.
Generate a production-ready, clean, and fully-functioning \`docker-compose.yml\` file based on the architecture canvas and service connections provided.

Requirements:
1. Use standard modern Docker Compose specification format.
2. Define each node as an appropriate container service (e.g., PostgreSQL, Redis, Kafka, Node.js/Python microservices, Nginx/Traefik API Gateway, etc.).
3. Choose standard official Docker Hub images (e.g., \`postgres:16-alpine\`, \`redis:7-alpine\`, \`confluentinc/cp-kafka\`, \`nginx:alpine\`, etc.) or appropriate build contexts.
4. Configure realistic environment variables, internal networks, persistent named volumes for stateful services, and appropriate port mappings.
5. Set up \`depends_on\` service dependencies matching the incoming and outgoing canvas connections.
6. Return ONLY the valid YAML code without any explanatory conversational fluff. You may include clean YAML comments.`,

  terraform: `You are Ghost AI, a principal Cloud Infrastructure Architect.
Generate a complete, modular, and production-ready Terraform HCL configuration (\`main.tf\`) for AWS based on the architecture canvas.

Requirements:
1. Configure the AWS provider with realistic defaults and variables.
2. Translate canvas components into appropriate AWS resources:
   - VPC, Public/Private Subnets, Security Groups
   - RDS instances (PostgreSQL / MySQL) for databases
   - ElastiCache Redis / SQS / SNS / MSK for caching & messaging
   - ECS Fargate tasks / Lambda functions / EKS for microservices and compute
   - Application Load Balancer (ALB) or API Gateway for ingress
   - S3 buckets for object storage
3. Wire security groups and connection strings between resources according to the canvas connections.
4. Output useful endpoints and resource IDs in an \`outputs\` section.
5. Return ONLY the valid Terraform HCL code without any conversational fluff. You may include clean HCL comments.`,

  kubernetes: `You are Ghost AI, a principal Kubernetes and Cloud Native Infrastructure Architect.
Generate a complete, production-ready multi-resource Kubernetes manifest file (\`k8s.yaml\`) based on the architecture canvas.

Requirements:
1. Define all necessary Kubernetes resources separated by \`---\`:
   - Namespace
   - ConfigMaps and Secrets (stubs with placeholder env values)
   - PersistentVolumeClaims for stateful services
   - Deployments / StatefulSets with resource limits, liveness/readiness probes, and environment variables
   - Services (ClusterIP for internal microservices/databases, LoadBalancer / Ingress for external access)
   - Ingress resource routing to the entrypoint / API gateway
2. Ensure service DNS names and ports match the directed connections between services.
3. Return ONLY the valid Kubernetes YAML manifests without conversational fluff. You may include clean YAML comments.`,
}

const FILENAMES: Record<string, string> = {
  "docker-compose": "docker-compose.yml",
  terraform: "main.tf",
  kubernetes: "k8s.yaml",
}

function cleanCodeOutput(rawText: string): string {
  let cleaned = rawText.trim()
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\n?/, "")
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\n?```$/, "")
  }
  return cleaned.trim()
}

export async function runIaCDirect(payload: {
  nodes: Node[]
  edges: Edge[]
  chatHistory: ChatMessage[]
  format: "docker-compose" | "terraform" | "kubernetes"
  projectId?: string
  roomId?: string
}): Promise<{ code: string; format: string; filename: string }> {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GEMINI_API_KEY

  const google = createGoogleGenerativeAI({
    apiKey,
  })

  const context = buildTopologyContext(
    payload.nodes,
    payload.edges,
    payload.chatHistory,
    payload.format
  )

  const systemPrompt = SYSTEM_PROMPTS[payload.format] ?? SYSTEM_PROMPTS["docker-compose"]
  const modelName = process.env.GEMINI_SPEC_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash"

  const result = await generateText({
    model: google(modelName),
    system: systemPrompt,
    prompt: context,
  })

  const code = cleanCodeOutput(result.text)
  const filename = FILENAMES[payload.format] ?? "infrastructure.yaml"

  return {
    code,
    format: payload.format,
    filename,
  }
}

export const generateIaC = schemaTask({
  id: "generate-iac",
  schema: payloadSchema,
  retry: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2 },
  run: async (payload) => {
    metadata.set("status", "starting")
    metadata.set("format", payload.format)
    logger.info("Generating IaC", {
      projectId: payload.projectId,
      format: payload.format,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
    })

    metadata.set("status", "generating")
    const result = await runIaCDirect(payload)

    metadata.set("status", "complete")
    metadata.set("codeLength", result.code.length)
    metadata.set("filename", result.filename)

    logger.info("IaC generated successfully", {
      format: payload.format,
      filename: result.filename,
      length: result.code.length,
    })

    return result
  },
})
