import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"
import type { generateIaC } from "@/trigger/generate-iac"

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}

  const roomId = typeof b.roomId === "string" ? b.roomId.trim() : ""
  const formatRaw = typeof b.format === "string" ? b.format.trim().toLowerCase() : "docker-compose"
  const format =
    formatRaw === "terraform" || formatRaw === "kubernetes" ? formatRaw : "docker-compose"
  const chatHistory = Array.isArray(b.chatHistory) ? b.chatHistory : []
  const nodes = Array.isArray(b.nodes) ? b.nodes : []
  const edges = Array.isArray(b.edges) ? b.edges : []

  if (!roomId) {
    return Response.json({ error: "Missing roomId" }, { status: 400 })
  }

  const project = await getAccessibleProject(roomId, identity)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const handle = await tasks.trigger<typeof generateIaC>("generate-iac", {
    projectId: project.id,
    roomId,
    format,
    chatHistory,
    nodes,
    edges,
  })

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId: project.id, userId: identity.userId },
  })

  return Response.json({ runId: handle.id }, { status: 201 })
}
