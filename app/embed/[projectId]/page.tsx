import { notFound } from "next/navigation"
import { get } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { PublicCanvasViewer } from "@/components/editor/canvas/public-canvas-viewer"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

interface EmbedPageProps {
  params: Promise<{ projectId: string }>
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      isPublic: true,
      canvasBlobUrl: true,
    },
  })

  if (!project || !project.isPublic) {
    notFound()
  }

  let nodes: CanvasNode[] = []
  let edges: CanvasEdge[] = []

  if (project.canvasBlobUrl) {
    try {
      const result = await get(project.canvasBlobUrl, { access: "private" })
      if (result && result.statusCode === 200 && result.stream) {
        const data = (await new Response(result.stream).json()) as {
          nodes?: CanvasNode[]
          edges?: CanvasEdge[]
        }
        nodes = data.nodes || []
        edges = data.edges || []
      }
    } catch {
      nodes = []
      edges = []
    }
  }

  return (
    <div className="h-screen w-screen bg-bg-base overflow-hidden">
      <PublicCanvasViewer initialNodes={nodes} initialEdges={edges} isEmbed />
    </div>
  )
}
