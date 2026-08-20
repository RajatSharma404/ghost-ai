import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"
import { generateIaC, runIaCDirect } from "@/trigger/generate-iac"

type ValidFormat = "docker-compose" | "terraform" | "kubernetes"

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}

  const roomId = typeof b.roomId === "string" ? b.roomId.trim() : ""
  
  // Support both array of formats or single format string
  let targetFormats: ValidFormat[] = []
  if (Array.isArray(b.formats) && b.formats.length > 0) {
    targetFormats = b.formats
      .map((f) => (typeof f === "string" ? f.trim().toLowerCase() : ""))
      .filter((f): f is ValidFormat => f === "docker-compose" || f === "terraform" || f === "kubernetes")
  }

  if (targetFormats.length === 0) {
    const formatRaw = typeof b.format === "string" ? b.format.trim().toLowerCase() : "docker-compose"
    const singleFormat: ValidFormat =
      formatRaw === "terraform" || formatRaw === "kubernetes" ? formatRaw : "docker-compose"
    targetFormats = [singleFormat]
  }

  const chatHistory = Array.isArray(b.chatHistory) ? b.chatHistory : []
  const nodes = Array.isArray(b.nodes) ? b.nodes : []
  const edges = Array.isArray(b.edges) ? b.edges : []
  const direct = b.direct === true

  if (!roomId) {
    return Response.json({ error: "Missing roomId" }, { status: 400 })
  }

  const project = await getAccessibleProject(roomId, identity)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (direct) {
    try {
      const results = await Promise.all(
        targetFormats.map((fmt) =>
          runIaCDirect({
            projectId: project.id,
            roomId,
            format: fmt,
            chatHistory,
            nodes,
            edges,
          })
        )
      )
      return Response.json({ results, result: results[0] }, { status: 200 })
    } catch (err) {
      console.error("Direct IaC generation error:", err)
      return Response.json(
        { error: "Failed to generate Infrastructure as Code." },
        { status: 500 }
      )
    }
  }

  try {
    const handles = await Promise.all(
      targetFormats.map((fmt) =>
        tasks.trigger<typeof generateIaC>("generate-iac", {
          projectId: project.id,
          roomId,
          format: fmt,
          chatHistory,
          nodes,
          edges,
        })
      )
    )

    await Promise.all(
      handles.map((h) =>
        prisma.taskRun.create({
          data: { runId: h.id, projectId: project.id, userId: identity.userId as string },
        })
      )
    )

    return Response.json({ runId: handles[0]?.id ?? "", runIds: handles.map((h) => h.id) }, { status: 201 })
  } catch {
    const results = await Promise.all(
      targetFormats.map((fmt) =>
        runIaCDirect({
          projectId: project.id,
          roomId,
          format: fmt,
          chatHistory,
          nodes,
          edges,
        })
      )
    )
    return Response.json({ results, result: results[0] }, { status: 200 })
  }
}
