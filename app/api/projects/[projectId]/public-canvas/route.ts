import { get } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import type { NextRequest } from "next/server"

interface RouteParams {
  params: Promise<{ projectId: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      canvasBlobUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!project || !project.isPublic) {
    return Response.json(
      { error: "This project is private or does not exist." },
      { status: 403 }
    )
  }

  let canvas = null
  if (project.canvasBlobUrl) {
    try {
      const result = await get(project.canvasBlobUrl, { access: "private" })
      if (result && result.statusCode === 200 && result.stream) {
        canvas = await new Response(result.stream).json()
      }
    } catch {
      canvas = null
    }
  }

  return Response.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    canvas,
  })
}
