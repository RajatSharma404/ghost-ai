import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk"
import { designAgent, runDesignAgentDirect } from "@/trigger/design-agent"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
  const prompt = typeof b.prompt === "string" ? b.prompt.trim().slice(0, 3000) : ""
  const roomId = typeof b.roomId === "string" ? b.roomId.trim() : ""
  const direct = b.direct === true

  if (!prompt || !roomId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const project = await getAccessibleProject(roomId, identity)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (direct) {
    try {
      const result = await runDesignAgentDirect({ prompt, roomId, userId: identity.userId })
      return Response.json({ success: true, summary: result.summary }, { status: 200 })
    } catch (err) {
      console.error("Direct design agent error:", err)
      return Response.json({ error: "Failed to generate design." }, { status: 500 })
    }
  }

  try {
    const handle = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt,
      roomId,
      userId: identity.userId,
    })

    await prisma.taskRun.create({
      data: { runId: handle.id, projectId: project.id, userId: identity.userId },
    })

    return Response.json({ runId: handle.id }, { status: 201 })
  } catch {
    const result = await runDesignAgentDirect({ prompt, roomId, userId: identity.userId })
    return Response.json({ success: true, summary: result.summary }, { status: 200 })
  }
}
