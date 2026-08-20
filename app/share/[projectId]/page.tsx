import { notFound } from "next/navigation"
import Link from "next/link"
import { get } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { PublicCanvasViewer } from "@/components/editor/canvas/public-canvas-viewer"
import { Eye, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

interface SharePageProps {
  params: Promise<{ projectId: string }>
}

export default async function SharePage({ params }: SharePageProps) {
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
    <div className="flex h-screen flex-col bg-bg-base text-text-primary">
      {/* Header */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-border-default bg-bg-surface px-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold tracking-tight text-text-primary hover:opacity-80 transition-opacity">
            Ghost<span className="text-accent-primary">AI</span>
          </Link>
          <div className="h-4 w-px bg-border-default" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-text-primary">{project.name}</h1>
              <span className="flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated px-2 py-0.5 text-[10px] font-medium text-text-muted">
                <Eye className="h-3 w-3 text-accent-primary" />
                Read-Only
              </span>
            </div>
            {project.description && (
              <p className="text-[11px] text-text-muted truncate max-w-md">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/project/${project.id}`}>
            <Button size="sm" className="h-8 gap-1.5 bg-accent-ai text-xs text-white hover:bg-accent-ai/80">
              <span>Open in Studio</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Canvas Viewer */}
      <main className="relative flex-1">
        <PublicCanvasViewer initialNodes={nodes} initialEdges={edges} />
      </main>
    </div>
  )
}
