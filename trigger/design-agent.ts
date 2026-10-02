import { task } from "@trigger.dev/sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import { mutateFlow, type MutableFlow } from "@liveblocks/react-flow/node";
import { getLiveblocks } from "@/lib/liveblocks";
import { NODE_COLORS, SHAPE_DEFAULTS, NODE_SHAPES } from "@/types/canvas";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";

const AI_USER_ID = "ghost-ai";
const AI_USER_INFO = { name: "Ghost AI", avatar: "", color: "#6457f9" };

const COLOR_NAMES = ["neutral", "blue", "purple", "orange", "red", "pink", "green", "teal"];

function buildSystemPrompt(): string {
  const colorGuide = NODE_COLORS.map(
    (c, i) => `  ${i} (${COLOR_NAMES[i]}): fill=${c.fill} text=${c.text}`
  ).join("\n");

  return `You are Ghost AI, a world-class cloud architect that designs technical architecture diagrams on a collaborative canvas.

ALLOWED SHAPES (use exact string):
- rectangle  → backend services, APIs, microservices, application workers
- cylinder   → databases, data warehouses, persistent storage, Redis caches
- hexagon    → external systems, CDN, third-party APIs, authentication providers
- circle     → client apps, browsers, mobile devices, user entrypoints
- diamond    → load balancers, decision gateways, routing proxies
- pill       → async queues, message brokers, streaming pipelines, background jobs

COLOR PALETTE (colorIndex 0-7):
${colorGuide}
Semantic mapping:
- 1 (blue)   → APIs, backend microservices, core servers
- 7 (teal)   → databases (PostgreSQL, MongoDB, MySQL), storage
- 3 (orange) → message queues (RabbitMQ, Kafka, SQS), background jobs
- 6 (green)  → CDN (Cloudflare), ingress, edge caching, web frontend
- 2 (purple) → auth & security (Cognito, Auth0, JWT, Vault)
- 5 (pink)   → client devices, web/mobile UI
- 4 (red)    → payment gateways, external billing, third-party webhooks
- 0 (neutral)→ generic or unclassified utilities

2D CANVAS LAYOUT TIERS (Clean left-to-right flow):
- Tier 1 (x: 80 - 140): Client & Edge (Web / Mobile Apps, Cloudflare CDN, DNS)
- Tier 2 (x: 360 - 420): Ingress & API Gateway (Reverse Proxy, Load Balancer, API Gateway)
- Tier 3 (x: 640 - 700): Application & Microservices (Auth, Order Service, User Service, Payment Service)
- Tier 4 (x: 940 - 1000): Persistence & Async (PostgreSQL, Redis Cache, Kafka/RabbitMQ, S3 Storage)
- Vertical spacing: start at y=100, space sibling components in the same tier by 140-180px vertically (y=100, y=260, y=420, etc.).

CRITICAL TOOL CALLING RULE:
- To design, create, or build an architecture, YOU MUST CALL THE \`generateArchitecture\` TOOL.
- DO NOT call \`addNode\` one-by-one when creating an architecture. One-by-one calls will only output a single block.
- \`generateArchitecture\` accepts the COMPLETE diagram at once: all 5 to 10 nodes representing the full multi-tier system AND all connecting directed edges.
- Ensure every edge has valid \`source\` and \`target\` matching the node \`id\`s.
- If there are existing nodes on the canvas and the user wants a new architecture from scratch, set \`clearCanvas: true\`. If extending, set \`clearCanvas: false\`.
- For minor incremental edits to an existing diagram (e.g. "move the database", "delete Redis", "update label"), use the individual tools (moveNode, deleteNode, updateNodeData, addNode, addEdge).`;
}

function clampColor(idx: number): number {
  return Math.min(Math.max(Math.round(idx ?? 0), 0), NODE_COLORS.length - 1);
}

const canvasTools = {
  generateArchitecture: tool({
    description:
      "Generate a complete multi-tier system architecture diagram on the canvas with all components (nodes) and all connecting data/request flows (edges). ALWAYS use this tool when asked to design, build, create, or generate an architecture.",
    inputSchema: z.object({
      summary: z.string().describe("1-2 sentence high-level summary of the architecture"),
      clearCanvas: z
        .boolean()
        .optional()
        .describe("Set to true if creating a new architecture from scratch to replace existing nodes; false if extending"),
      nodes: z
        .array(
          z.object({
            id: z.string().describe('Unique slug ID e.g. "cdn", "client-web", "api-gateway", "auth-service", "order-service", "user-db", "redis"'),
            label: z.string().describe("Descriptive label e.g. 'Cloudflare CDN', 'Next.js Frontend', 'API Gateway', 'PostgreSQL DB'"),
            shape: z.enum(NODE_SHAPES).describe("Node shape: rectangle, cylinder, hexagon, circle, diamond, pill"),
            colorIndex: z.number().int().min(0).max(7).describe("Color palette index 0-7"),
            x: z.number().describe("X coordinate in pixels"),
            y: z.number().describe("Y coordinate in pixels"),
          })
        )
        .describe("Complete list of nodes representing all tiers of the architecture (typically 5 to 10 nodes)"),
      edges: z
        .array(
          z.object({
            id: z.string().describe('Unique edge ID e.g. "edge-cdn-web", "edge-web-api", "edge-api-db"'),
            source: z.string().describe("Source node ID matching a node's id"),
            target: z.string().describe("Target node ID matching a node's id"),
            label: z.string().optional().describe("Optional protocol or flow description e.g. 'HTTPS', 'gRPC', 'SQL', 'Events'"),
          })
        )
        .describe("Directed edges interconnecting all components to illustrate request and data flows"),
    }),
  }),
  addNode: tool({
    description: "Add a single new node to the canvas (use for minor incremental edits)",
    inputSchema: z.object({
      id: z.string().describe('Unique slug ID e.g. "api-gateway", "user-db"'),
      label: z.string().describe("Display label for the node"),
      shape: z.enum(NODE_SHAPES).describe("Node shape"),
      colorIndex: z.number().int().min(0).max(7).describe("Color palette index 0-7"),
      x: z.number().describe("X position in pixels"),
      y: z.number().describe("Y position in pixels"),
    }),
  }),
  moveNode: tool({
    description: "Move an existing node to a new position",
    inputSchema: z.object({
      id: z.string().describe("ID of the node to move"),
      x: z.number(),
      y: z.number(),
    }),
  }),
  resizeNode: tool({
    description: "Resize an existing node",
    inputSchema: z.object({
      id: z.string(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
  }),
  updateNodeData: tool({
    description: "Update the label, shape, or color of an existing node",
    inputSchema: z.object({
      id: z.string(),
      label: z.string().optional(),
      shape: z.enum(NODE_SHAPES).optional(),
      colorIndex: z.number().int().min(0).max(7).optional(),
    }),
  }),
  deleteNode: tool({
    description: "Delete a node from the canvas",
    inputSchema: z.object({
      id: z.string(),
    }),
  }),
  addEdge: tool({
    description: "Add a directed edge between two nodes",
    inputSchema: z.object({
      id: z.string().describe('Unique edge ID e.g. "edge-api-db"'),
      source: z.string().describe("Source node ID"),
      target: z.string().describe("Target node ID"),
      label: z.string().optional().describe("Optional edge label"),
    }),
  }),
  deleteEdge: tool({
    description: "Delete an edge from the canvas",
    inputSchema: z.object({
      id: z.string(),
    }),
  }),
  finalizeDesign: tool({
    description: "Complete the design and provide a summary — call this last",
    inputSchema: z.object({
      summary: z.string().describe("1-2 sentence description of the designed architecture"),
    }),
  }),
};

type ToolName = keyof typeof canvasTools;
type ToolCall = { toolName: ToolName; input: Record<string, unknown> };

export async function runDesignAgentDirect(payload: {
  prompt: string
  roomId: string
  userId: string
}): Promise<{ success: boolean; actionsApplied: number; summary: string }> {
  const lb = getLiveblocks()
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GEMINI_API_KEY

  const google = createGoogleGenerativeAI({
    apiKey,
  })

  await lb
    .setPresence(payload.roomId, {
      userId: AI_USER_ID,
      data: { cursor: null, thinking: true },
      userInfo: AI_USER_INFO,
      ttl: 120_000,
    })
    .catch(() => {})

  await lb
    .broadcastEvent(payload.roomId, {
      type: "ai-status",
      message: "Ghost AI is analyzing your request…",
      status: "start",
    })
    .catch(() => {})

  try {
    let canvasContext = "The canvas is currently empty — create a fresh design."
    try {
      const doc = await lb.getStorageDocument(payload.roomId, "json")
      const parsed =
        typeof doc === "string"
          ? (JSON.parse(doc) as Record<string, unknown>)
          : (doc as Record<string, unknown>)
      const flow = parsed?.flow as Record<string, unknown> | undefined
      const nodeCount = flow?.nodes ? Object.keys(flow.nodes as object).length : 0
      if (nodeCount > 0) {
        canvasContext = `Canvas has ${nodeCount} existing node(s). Current state:\n${JSON.stringify(flow, null, 2)}\nExtend or modify based on the request; if the user is asking to design/build a new architecture from scratch, set clearCanvas: true.`
      }
    } catch {
      // No storage yet — treat as empty
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
    const result = await generateText({
      model: google(modelName),
      system: buildSystemPrompt(),
      prompt: `User request: ${payload.prompt}\n\n${canvasContext}`,
      tools: canvasTools,
      toolChoice: "required",
    })

    const toolCalls = result.steps.flatMap((s) => s.toolCalls) as ToolCall[]
    const actionCalls = toolCalls.filter((c) => c.toolName !== "finalizeDesign")
    const finalizeCall = toolCalls.find((c) => c.toolName === "finalizeDesign")
    const genArchCall = toolCalls.find((c) => c.toolName === "generateArchitecture")

    const summary =
      (genArchCall?.input as { summary?: string } | undefined)?.summary ??
      (finalizeCall?.input as { summary?: string } | undefined)?.summary ??
      "Architecture applied to canvas."

    let totalNodesCount = actionCalls.filter((c) => c.toolName === "addNode").length
    if (genArchCall) {
      const nodes = (genArchCall.input as { nodes?: unknown[] })?.nodes
      if (Array.isArray(nodes)) {
        totalNodesCount += nodes.length
      }
    }

    await lb
      .broadcastEvent(payload.roomId, {
        type: "ai-status",
        message:
          totalNodesCount > 0
            ? `Placing ${totalNodesCount} component${totalNodesCount !== 1 ? "s" : ""} on the canvas…`
            : "Applying changes to canvas…",
        status: "thinking",
      })
      .catch(() => {})

    await mutateFlow<CanvasNode, CanvasEdge>(
      { client: lb, roomId: payload.roomId },
      (flow) => {
        for (const call of actionCalls) {
          applyToolCall(call, flow)
        }
      }
    )

    await lb
      .broadcastEvent(payload.roomId, {
        type: "ai-status",
        message: summary,
        status: "complete",
      })
      .catch(() => {})

    return { success: true, actionsApplied: actionCalls.length, summary }
  } catch (error) {
    await lb
      .broadcastEvent(payload.roomId, {
        type: "ai-status",
        message: "Ghost AI encountered an error. Please try again.",
        status: "error",
      })
      .catch(() => {})
    throw error
  } finally {
    await lb
      .setPresence(payload.roomId, {
        userId: AI_USER_ID,
        data: { cursor: null, thinking: false },
        userInfo: AI_USER_INFO,
        ttl: 3_000,
      })
      .catch(() => {})
  }
}

export const designAgent = task({
  id: "design-agent",
  retry: { maxAttempts: 2 },
  run: async (payload: { prompt: string; roomId: string; userId: string }) => {
    return runDesignAgentDirect(payload)
  },
})

function applyToolCall(call: ToolCall, flow: MutableFlow<CanvasNode, CanvasEdge>) {
  const input = call.input;

  switch (call.toolName) {
    case "generateArchitecture": {
      const { nodes, edges, clearCanvas } = input as {
        summary?: string;
        clearCanvas?: boolean;
        nodes: Array<{
          id: string;
          label: string;
          shape: NodeShape;
          colorIndex: number;
          x: number;
          y: number;
        }>;
        edges: Array<{
          id: string;
          source: string;
          target: string;
          label?: string;
        }>;
      };

      if (clearCanvas && flow.nodes.length > 0) {
        flow.removeNodes(flow.nodes.map((n) => n.id));
        flow.removeEdges(flow.edges.map((e) => e.id));
      }

      if (Array.isArray(nodes)) {
        for (const n of nodes) {
          const ci = clampColor(n.colorIndex);
          const color = NODE_COLORS[ci];
          const size = SHAPE_DEFAULTS[n.shape] ?? SHAPE_DEFAULTS.rectangle;
          flow.addNode({
            id: n.id,
            type: "canvasNode",
            position: { x: n.x, y: n.y },
            data: { label: n.label, color: color.fill, textColor: color.text, shape: n.shape },
            width: size.width,
            height: size.height,
          });
        }
      }

      if (Array.isArray(edges)) {
        for (const e of edges) {
          flow.addEdge({
            id: e.id,
            type: "canvasEdge",
            source: e.source,
            target: e.target,
            sourceHandle: null,
            targetHandle: null,
            data: { label: e.label ?? "" },
            markerEnd: {
              type: "arrowclosed",
              color: "rgba(255,255,255,0.4)",
              width: 16,
              height: 16,
            },
          });
        }
      }
      break;
    }

    case "addNode": {
      const { id, label, shape, colorIndex, x, y } = input as {
        id: string;
        label: string;
        shape: NodeShape;
        colorIndex: number;
        x: number;
        y: number;
      };
      const ci = clampColor(colorIndex);
      const color = NODE_COLORS[ci];
      const size = SHAPE_DEFAULTS[shape] ?? SHAPE_DEFAULTS.rectangle;
      flow.addNode({
        id,
        type: "canvasNode",
        position: { x, y },
        data: { label, color: color.fill, textColor: color.text, shape },
        width: size.width,
        height: size.height,
      });
      break;
    }

    case "moveNode": {
      const { id, x, y } = input as { id: string; x: number; y: number };
      flow.updateNode(id, { position: { x, y } });
      break;
    }

    case "resizeNode": {
      const { id, width, height } = input as { id: string; width: number; height: number };
      flow.updateNode(id, { width, height });
      break;
    }

    case "updateNodeData": {
      const { id, label, shape, colorIndex } = input as {
        id: string;
        label?: string;
        shape?: NodeShape;
        colorIndex?: number;
      };
      flow.updateNodeData(id, (prev) => {
        const next = { ...prev };
        if (label !== undefined) next.label = label;
        if (shape !== undefined) next.shape = shape;
        if (colorIndex !== undefined) {
          const ci = clampColor(colorIndex);
          next.color = NODE_COLORS[ci].fill;
          next.textColor = NODE_COLORS[ci].text;
        }
        return next;
      });
      break;
    }

    case "deleteNode": {
      const { id } = input as { id: string };
      flow.removeNode(id);
      break;
    }

    case "addEdge": {
      const { id, source, target, label } = input as {
        id: string;
        source: string;
        target: string;
        label?: string;
      };
      flow.addEdge({
        id,
        type: "canvasEdge",
        source,
        target,
        sourceHandle: null,
        targetHandle: null,
        data: { label: label ?? "" },
        markerEnd: {
          type: "arrowclosed",
          color: "rgba(255,255,255,0.4)",
          width: 16,
          height: 16,
        },
      });
      break;
    }

    case "deleteEdge": {
      const { id } = input as { id: string };
      flow.removeEdge(id);
      break;
    }
  }
}

