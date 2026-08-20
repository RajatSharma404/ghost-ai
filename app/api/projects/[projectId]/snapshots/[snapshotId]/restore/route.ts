import { get } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import type { NextRequest } from "next/server"

interface RouteParams {
  params: Promise<{ projectId: string; snapshotId: string }>
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId, snapshotId } = await params
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const snapshot = await prisma.projectSnapshot.findUnique({
    where: { id: snapshotId },
  })

  if (!snapshot || snapshot.projectId !== projectId) {
    return Response.json({ error: "Snapshot not found" }, { status: 404 })
  }

  const result = await get(snapshot.blobUrl, { access: "private" })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return Response.json({ error: "Failed to read snapshot data from storage" }, { status: 500 })
  }

  const canvas: unknown = await new Response(result.stream).json()
  return Response.json({ canvas })
}
