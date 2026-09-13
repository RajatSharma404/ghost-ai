"use client"

import { useMemo } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from "@xyflow/react"
import type { NodeProps, EdgeProps } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type {
  CanvasNode,
  CanvasEdge,
  CanvasRegularNode,
  CanvasGroupNode,
  NodeShape,
  GroupBoundaryType,
} from "@/types/canvas"
import { NODE_COLORS, BOUNDARY_PRESETS } from "@/types/canvas"
import { TechIcon } from "@/components/editor/canvas/tech-icons"
import {
  Minus,
  Plus,
  Maximize,
  Cloud,
  Globe,
  Lock,
  Boxes,
  ShieldAlert,
  Layers,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getCanvasNodeCost } from "@/lib/canvas-cost-estimator"

// ---------------------------------------------------------------------------
// Read-Only Canvas Node Shapes
// ---------------------------------------------------------------------------

function DiamondShape({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="50,0 100,50 50,100 0,50" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

function HexagonShape({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="25,0 75,0 100,50 75,100 25,100 0,50" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

function CylinderShape({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="0" y="15" width="100" height="70" fill={fill} />
      <line x1="0" y1="15" x2="0" y2="85" stroke={stroke} strokeWidth="1.5" />
      <line x1="100" y1="15" x2="100" y2="85" stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="50" cy="85" rx="50" ry="15" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="50" cy="15" rx="50" ry="15" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

function cssBorderRadius(shape: NodeShape): string {
  if (shape === "pill") return "9999px"
  if (shape === "circle") return "50%"
  return "12px"
}

const DEFAULT_FILL = NODE_COLORS[0].fill
const DEFAULT_TEXT = NODE_COLORS[0].text
const BORDER_REST = "rgba(255,255,255,0.15)"
const BORDER_SELECTED = "rgba(255,255,255,0.4)"

function ReadOnlyCanvasNode({ data, selected }: NodeProps<CanvasRegularNode>) {
  const fill = data.color ?? DEFAULT_FILL
  const textColor = data.textColor ?? DEFAULT_TEXT
  const shape = data.shape ?? "rectangle"
  const stroke = selected ? BORDER_SELECTED : BORDER_REST
  const isSvg = shape === "diamond" || shape === "hexagon" || shape === "cylinder"
  const costEstimate = getCanvasNodeCost(data)

  return (
    <div
      className="group/node relative flex h-full w-full items-center justify-center select-none"
      style={
        isSvg
          ? undefined
          : {
              background: fill,
              borderRadius: cssBorderRadius(shape),
              border: `1.5px solid ${stroke}`,
              boxShadow: selected
                ? "0 0 0 2px rgba(98,192,115,0.3), 0 8px 24px rgba(0,0,0,0.5)"
                : "0 4px 12px rgba(0,0,0,0.35)",
              color: textColor,
            }
      }
    >
      {/* Invisible Handles so XYFlow connects edge paths properly */}
      <Handle type="source" position={Position.Top} className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Left} className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !pointer-events-none" />

      {/* SVG Shapes */}
      {shape === "diamond" && <DiamondShape fill={fill} stroke={stroke} />}
      {shape === "hexagon" && <HexagonShape fill={fill} stroke={stroke} />}
      {shape === "cylinder" && <CylinderShape fill={fill} stroke={stroke} />}

      {/* Cost Differential Badge */}
      {costEstimate && (
        <div
          className={cn(
            "pointer-events-none absolute -top-2.5 -left-2 z-20 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono font-bold tracking-tight shadow-md backdrop-blur-md transition-all border",
            costEstimate.badgeVariant === "emerald" &&
              "bg-emerald-950/85 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40",
            costEstimate.badgeVariant === "blue" &&
              "bg-blue-950/85 text-blue-300 border-blue-500/40 shadow-blue-950/40",
            costEstimate.badgeVariant === "purple" &&
              "bg-purple-950/85 text-purple-300 border-purple-500/40 shadow-purple-950/40",
            costEstimate.badgeVariant === "amber" &&
              "bg-amber-950/85 text-amber-300 border-amber-500/40 shadow-amber-950/40"
          )}
          title={`Estimated Monthly Cost: ${costEstimate.formatted} • ${costEstimate.tierDescription}`}
        >
          <DollarSign className="h-2.5 w-2.5 shrink-0 opacity-80" />
          <span>{costEstimate.formatted}</span>
        </div>
      )}

      {/* Node Body with Icon & Label */}
      <div
        className={
          isSvg
            ? "absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center"
            : "flex flex-col items-center justify-center gap-1.5 p-3 text-center"
        }
        style={{ color: textColor }}
      >
        {data.icon && <TechIcon iconId={data.icon} size={22} className="shrink-0" />}
        <span className="text-xs font-semibold tracking-wide drop-shadow-sm line-clamp-2">
          {data.label || "Untitled Service"}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Read-Only Group Boundary Node
// ---------------------------------------------------------------------------

function getBoundaryIcon(type: GroupBoundaryType) {
  switch (type) {
    case "vpc":
      return <Cloud className="h-3.5 w-3.5" />
    case "subnet-public":
      return <Globe className="h-3.5 w-3.5" />
    case "subnet-private":
      return <Lock className="h-3.5 w-3.5" />
    case "k8s-cluster":
      return <Boxes className="h-3.5 w-3.5" />
    case "security-zone":
      return <ShieldAlert className="h-3.5 w-3.5" />
    default:
      return <Layers className="h-3.5 w-3.5" />
  }
}

function ReadOnlyGroupNode({ data, selected }: NodeProps<CanvasGroupNode>) {
  const boundaryType: GroupBoundaryType = data.boundaryType ?? "vpc"
  const preset = BOUNDARY_PRESETS[boundaryType] ?? BOUNDARY_PRESETS.vpc

  const label = data.label || preset.label
  const subtitle = data.subtitle !== undefined ? data.subtitle : preset.subtitle
  const borderColor = data.borderColor || preset.borderColor
  const fillColor = data.fillColor || preset.fillColor
  const textColor = data.textColor || preset.textColor
  const isDashed = data.isDashed !== undefined ? data.isDashed : preset.isDashed

  return (
    <div
      className="relative h-full w-full rounded-2xl transition-all select-none"
      style={{
        border: `1.5px ${isDashed ? "dashed" : "solid"} ${
          selected ? "rgba(255,255,255,0.7)" : borderColor
        }`,
        backgroundColor: fillColor,
        boxShadow: selected ? `0 0 16px ${borderColor}` : "none",
      }}
    >
      {/* Invisible Handles */}
      <Handle type="source" position={Position.Top} className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Left} className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !pointer-events-none" />

      {/* Top Header Tag */}
      <div className="absolute top-2.5 left-3 flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            border: `1px solid ${borderColor}`,
            color: textColor,
          }}
        >
          {getBoundaryIcon(boundaryType)}
          <span>{label}</span>
        </div>

        {subtitle && (
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              color: "rgba(255, 255, 255, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Read-Only Canvas Edge
// ---------------------------------------------------------------------------

function getFlowColor(label: string, trafficType?: string): string {
  const l = label.toLowerCase()
  if (trafficType === "kafka" || l.includes("kafka") || l.includes("queue") || l.includes("event") || l.includes("amqp") || l.includes("pubsub")) {
    return "#BF7AF0"
  }
  if (trafficType === "db" || l.includes("db") || l.includes("postgres") || l.includes("redis") || l.includes("sql") || l.includes("query")) {
    return "#62C073"
  }
  if (trafficType === "grpc" || l.includes("grpc") || l.includes("proto") || l.includes("tcp")) {
    return "#FF990A"
  }
  if (trafficType === "http" || l.includes("http") || l.includes("rest") || l.includes("api") || l.includes("json")) {
    return "#52A8FF"
  }
  return "#00c8d4"
}

function ReadOnlyCanvasEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const label = data?.label ?? ""
  const isSimulating = Boolean(data?.isSimulating)
  const speed = typeof data?.speed === "number" && data.speed > 0 ? data.speed : 1
  const flowColor = getFlowColor(label, data?.trafficType)

  const baseDuration = 1.8 / speed
  const dur = `${baseDuration.toFixed(2)}s`
  const halfDur = `${(baseDuration / 2).toFixed(2)}s`

  const stroke = isSimulating
    ? flowColor
    : selected
    ? "rgba(255,255,255,0.7)"
    : "rgba(255,255,255,0.35)"

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: isSimulating ? 1.8 : 1.5,
          strokeLinecap: "round",
          opacity: isSimulating ? 0.6 : 1,
        }}
      />

      {isSimulating && (
        <>
          <path
            d={edgePath}
            fill="none"
            stroke={flowColor}
            strokeWidth={2}
            strokeDasharray="6 12"
            className="animate-flow-dash pointer-events-none"
            style={{
              filter: `drop-shadow(0 0 5px ${flowColor})`,
              animationDuration: dur,
              opacity: 0.85,
            }}
          />
          <circle r={3.5} fill="#FFFFFF" className="pointer-events-none" style={{ filter: `drop-shadow(0 0 6px ${flowColor})` }}>
            <animateMotion path={edgePath} dur={dur} repeatCount="indefinite" />
          </circle>
          <circle r={2.5} fill={flowColor} className="pointer-events-none" style={{ filter: `drop-shadow(0 0 4px ${flowColor})` }}>
            <animateMotion path={edgePath} dur={dur} begin={halfDur} repeatCount="indefinite" />
          </circle>
        </>
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                background: "var(--color-bg-surface)",
                color: isSimulating ? flowColor : "var(--color-text-primary)",
                border: isSimulating ? `1px solid ${flowColor}66` : "1px solid rgba(255,255,255,0.15)",
                borderRadius: 9999,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: "nowrap",
                userSelect: "none",
                boxShadow: isSimulating ? `0 0 8px ${flowColor}33` : "none",
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Types and Main Viewer
// ---------------------------------------------------------------------------

const nodeTypes = {
  canvasNode: ReadOnlyCanvasNode,
  groupNode: ReadOnlyGroupNode,
}
const edgeTypes = { canvasEdge: ReadOnlyCanvasEdge }

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
