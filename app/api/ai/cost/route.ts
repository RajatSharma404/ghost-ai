import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"
import type { estimateCost } from "@/trigger/estimate-cost"

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}

  const roomId = typeof b.roomId === "string" ? b.roomId.trim() : ""
  const cloudProviderRaw =
    typeof b.cloudProvider === "string" ? b.cloudProvider.trim().toLowerCase() : "aws"
  const cloudProvider =
    cloudProviderRaw === "gcp" || cloudProviderRaw === "azure" ? cloudProviderRaw : "aws"

  const trafficTierRaw =
    typeof b.trafficTier === "string" ? b.trafficTier.trim().toLowerCase() : "growth"
  const trafficTier =
    trafficTierRaw === "starter" || trafficTierRaw === "scale" || trafficTierRaw === "enterprise"
      ? trafficTierRaw
      : "growth"

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

  const handle = await tasks.trigger<typeof estimateCost>("estimate-cost", {
    projectId: project.id,
    roomId,
    cloudProvider,
    trafficTier,
    chatHistory,
    nodes,
    edges,
  })

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId: project.id, userId: identity.userId },
  })

  return Response.json({ runId: handle.id }, { status: 201 })
}
