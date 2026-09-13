import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ projects })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
  const rawName = typeof b.name === "string" ? b.name.trim() : ""
  const name = rawName.slice(0, 100) || "Untitled Project"
  const rawId = typeof b.id === "string" ? b.id.trim() : ""
  const validId = rawId && /^[a-z0-9-_]{3,64}$/i.test(rawId) ? rawId : undefined

  try {
    const project = await prisma.project.create({
      data: { ...(validId ? { id: validId } : {}), ownerId: userId, name },
    })
    return Response.json({ project }, { status: 201 })
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return Response.json(
        { error: "A project with this identifier already exists. Please choose a different name or ID." },
        { status: 409 }
      )
    }
    return Response.json({ error: "Failed to create project" }, { status: 500 })
  }
}
