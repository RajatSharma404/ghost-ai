"use client"

import { useState, useCallback } from "react"
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react"
import type { EdgeProps } from "@xyflow/react"
import { useMutation } from "@liveblocks/react"
import { LiveObject } from "@liveblocks/client"
import type { CanvasEdge } from "@/types/canvas"

type LiveEdgeData = LiveObject<{
  data: LiveObject<{
    label?: string
    isSimulating?: boolean
    trafficType?: "http" | "grpc" | "kafka" | "db" | "default"
    speed?: number
  }>
}>

function getFlowColor(label: string, trafficType?: string): string {
  const l = label.toLowerCase()
  if (trafficType === "kafka" || l.includes("kafka") || l.includes("queue") || l.includes("event") || l.includes("amqp") || l.includes("pubsub")) {
    return "#BF7AF0" // Purple for Event-Driven
  }
  if (trafficType === "db" || l.includes("db") || l.includes("postgres") || l.includes("redis") || l.includes("sql") || l.includes("query")) {
    return "#62C073" // Emerald for Database / Cache
  }
  if (trafficType === "grpc" || l.includes("grpc") || l.includes("proto") || l.includes("tcp")) {
    return "#FF990A" // Amber for gRPC / Low-latency TCP
  }
  if (trafficType === "http" || l.includes("http") || l.includes("rest") || l.includes("api") || l.includes("json")) {
    return "#52A8FF" // Cyan for HTTP / Web
  }
  return "#00c8d4" // Default Accent Cyan
}

export function CanvasEdgeComponent({
  id,
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
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")

  const updateEdgeLabel = useMutation(
    ({ storage }, newLabel: string) => {
      const edge = storage.get("flow").get("edges").get(id)
      if (!edge) return
      ;(edge as unknown as LiveEdgeData).get("data").set("label", newLabel)
    },
    [id]
  )

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

  const isActive = selected || isHovered || isEditing
  const stroke = isSimulating
    ? flowColor
    : isActive
    ? "rgba(255,255,255,0.7)"
    : "rgba(255,255,255,0.35)"

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setDraftLabel(label)
      setIsEditing(true)
    },
    [label]
  )

  const commitEdit = useCallback(() => {
    setIsEditing(false)
    updateEdgeLabel(draftLabel.trim())
  }, [draftLabel, updateEdgeLabel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation()
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault()
        e.currentTarget.blur()
      }
    },
    []
  )

  return (
    <>
      {/* Wide invisible stroke makes the edge easy to hover and click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      />

      {/* Base Edge Line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: isSimulating ? 1.8 : 1.5,
          strokeLinecap: "round",
          transition: "stroke 0.15s",
          opacity: isSimulating ? 0.6 : 1,
        }}
      />

      {/* Animated Flow Layer when Simulate Flow is active */}
      {isSimulating && (
        <>
          {/* Flowing electric dashed trace */}
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

          {/* Leading packet circle */}
          <circle r={3.5} fill="#FFFFFF" className="pointer-events-none" style={{ filter: `drop-shadow(0 0 6px ${flowColor})` }}>
            <animateMotion path={edgePath} dur={dur} repeatCount="indefinite" />
          </circle>

          {/* Trailing packet circle */}
          <circle r={2.5} fill={flowColor} className="pointer-events-none" style={{ filter: `drop-shadow(0 0 4px ${flowColor})` }}>
            <animateMotion path={edgePath} dur={dur} begin={halfDur} repeatCount="indefinite" />
          </circle>
        </>
      )}

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: `${Math.max((draftLabel.length + 2) * 8, 64)}px`,
                background: "var(--color-bg-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 12,
                outline: "none",
                textAlign: "center",
              }}
            />
          ) : label ? (
            <div
              onDoubleClick={startEditing}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: "var(--color-bg-surface)",
                color: isSimulating ? flowColor : "var(--color-text-primary)",
                border: isSimulating ? `1px solid ${flowColor}66` : "1px solid rgba(255,255,255,0.15)",
                borderRadius: 9999,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                userSelect: "none",
                boxShadow: isSimulating ? `0 0 8px ${flowColor}33` : "none",
              }}
            >
              {label}
            </div>
          ) : selected ? (
            <div
              onDoubleClick={startEditing}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 11,
                cursor: "pointer",
                padding: "2px 8px",
                userSelect: "none",
              }}
            >
              double-click to label
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
