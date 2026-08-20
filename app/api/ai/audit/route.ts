import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"
import { auditArchitecture, runAuditDirect } from "@/trigger/audit-architecture"

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}

  const roomId = typeof b.roomId === "string" ? b.roomId.trim() : ""
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

  // If direct execution is requested, perform the audit immediately using Gemini
  if (direct) {
    try {
      const report = await runAuditDirect({
        projectId: project.id,
        roomId,
        chatHistory,
        nodes,
        edges,
      })
      return Response.json({ report }, { status: 200 })
    } catch (err) {
      console.error("Direct audit error:", err)
      return Response.json(
        { error: "Failed to generate architecture audit. Please check your Gemini API key." },
        { status: 500 }
      )
    }
  }

  // Otherwise trigger Trigger.dev background task
  try {
    const handle = await tasks.trigger<typeof auditArchitecture>("audit-architecture", {
      projectId: project.id,
      roomId,
      chatHistory,
      nodes,
      edges,
    })

    await prisma.taskRun.create({
      data: { runId: handle.id, projectId: project.id, userId: identity.userId },
    })

    return Response.json({ runId: handle.id }, { status: 201 })
  } catch {
    // If Trigger.dev task dispatch fails (e.g. offline dev), fallback to direct execution
    const report = await runAuditDirect({
      projectId: project.id,
      roomId,
      chatHistory,
      nodes,
      edges,
    })
    return Response.json({ report }, { status: 200 })
  }
}
