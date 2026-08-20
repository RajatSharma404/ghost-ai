import { put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import { currentUser } from "@clerk/nextjs/server"
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
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const snapshots = await prisma.projectSnapshot.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ snapshots })
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string
    description?: string
    nodes?: unknown[]
    edges?: unknown[]
  }

  const name = body.name?.trim() || `Milestone ${new Date().toLocaleDateString()}`
  const description = body.description?.trim() || null
  const nodes = body.nodes || []
  const edges = body.edges || []

  const user = await currentUser()
  const createdByName =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "Teammate"

  const timestamp = Date.now()
  const blob = await put(
    `snapshots/${projectId}/${timestamp}.json`,
    JSON.stringify({ nodes, edges }),
    {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    }
  )

  const snapshot = await prisma.projectSnapshot.create({
    data: {
      projectId,
      name,
      description,
      blobUrl: blob.url,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      createdByName,
    },
  })

  return Response.json({ snapshot })
}
