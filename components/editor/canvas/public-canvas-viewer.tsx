"use client"

import { useMemo } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"
import { CanvasNodeComponent } from "@/components/editor/canvas/canvas-node"
import { GroupNodeComponent } from "@/components/editor/canvas/group-node"
import { CanvasEdgeComponent } from "@/components/editor/canvas/canvas-edge"
import { Minus, Plus, Maximize } from "lucide-react"

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
  groupNode: GroupNodeComponent,
}
const edgeTypes = { canvasEdge: CanvasEdgeComponent }

interface PublicCanvasViewerProps {
  initialNodes: CanvasNode[]
  initialEdges: CanvasEdge[]
  isEmbed?: boolean
}

function ViewerControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-0.5 rounded-full border border-border-default bg-bg-surface/95 px-2 py-1.5 shadow-xl backdrop-blur-xl">
      <button
        type="button"
        onClick={() => zoomOut({ duration: 200 })}
        className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
        title="Zoom out"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => fitView({ duration: 200 })}
        className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
        title="Fit view"
      >
        <Maximize className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => zoomIn({ duration: 200 })}
        className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
        title="Zoom in"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function PublicCanvasInner({ initialNodes, initialEdges, isEmbed }: PublicCanvasViewerProps) {
  const nodes = useMemo(() => initialNodes, [initialNodes])
  const edges = useMemo(() => initialEdges, [initialEdges])

  return (
    <div className="relative h-full w-full bg-bg-base overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        className="bg-bg-base"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="var(--color-border-subtle)"
        />
      </ReactFlow>

      <ViewerControls />

      {isEmbed && (
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-border-default bg-bg-surface/90 px-3 py-1 text-[11px] font-medium text-text-muted hover:text-text-primary shadow-lg backdrop-blur-md transition-colors"
        >
          <span>Powered by</span>
          <span className="font-semibold text-accent-primary">Ghost AI</span>
        </a>
      )}
    </div>
  )
}

export function PublicCanvasViewer(props: PublicCanvasViewerProps) {
  return (
    <ReactFlowProvider>
      <PublicCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
