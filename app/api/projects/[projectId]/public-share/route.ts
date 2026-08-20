import { prisma } from "@/lib/prisma"
import { getCurrentProjectIdentity } from "@/lib/project-access"
import type { NextRequest } from "next/server"

interface RouteParams {
  params: Promise<{ projectId: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true, isPublic: true, name: true },
  })

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const isOwner = project.ownerId === identity.userId

  return Response.json({
    isPublic: project.isPublic,
    isOwner,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  })

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (project.ownerId !== identity.userId) {
    return Response.json({ error: "Only the project owner can change public share settings" }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as { isPublic?: boolean }
  const isPublic = Boolean(body.isPublic)

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { isPublic },
    select: { id: true, isPublic: true },
  })

  return Response.json({ isPublic: updated.isPublic })
}
