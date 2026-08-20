"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { NodeResizer, NodeToolbar } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"
import { useMutation } from "@liveblocks/react"
import { LiveObject } from "@liveblocks/client"
import {
  Cloud,
  Globe,
  Lock,
  Boxes,
  ShieldAlert,
  Layers,
  Sparkles,
} from "lucide-react"
import type {
  CanvasGroupNode,
  GroupBoundaryType,
} from "@/types/canvas"
import { BOUNDARY_PRESETS } from "@/types/canvas"
import { cn } from "@/lib/utils"

const MIN_WIDTH = 220
const MIN_HEIGHT = 140

const RESIZER_HANDLE_STYLE: React.CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(255,255,255,0.3)",
}

const RESIZER_LINE_STYLE: React.CSSProperties = {
  borderColor: "rgba(255,255,255,0.4)",
  borderWidth: 1,
}

type LiveGroupNodeData = LiveObject<{
  data: LiveObject<{
    label: string
    subtitle?: string
    boundaryType?: GroupBoundaryType
    borderColor?: string
    fillColor?: string
    textColor?: string
    isDashed?: boolean
  }>
}>

export function GroupNodeComponent({ id, data, selected }: NodeProps<CanvasGroupNode>) {
  const boundaryType: GroupBoundaryType = data.boundaryType ?? "vpc"
  const preset = BOUNDARY_PRESETS[boundaryType] ?? BOUNDARY_PRESETS.vpc

  const label = data.label || preset.label
  const subtitle = data.subtitle !== undefined ? data.subtitle : preset.subtitle
  const borderColor = data.borderColor || preset.borderColor
  const fillColor = data.fillColor || preset.fillColor
  const textColor = data.textColor || preset.textColor
  const isDashed = data.isDashed !== undefined ? data.isDashed : preset.isDashed

  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const subtitleInputRef = useRef<HTMLInputElement>(null)

  const updateGroupData = useMutation(
    (
      { storage },
      updates: Partial<{
        label: string
        subtitle: string
        boundaryType: GroupBoundaryType
        borderColor: string
        fillColor: string
        textColor: string
        isDashed: boolean
      }>
    ) => {
      const node = storage.get("flow").get("nodes").get(id)
      if (!node) return
      const liveData = (node as unknown as LiveGroupNodeData).get("data")
      if (updates.label !== undefined) liveData.set("label", updates.label)
      if (updates.subtitle !== undefined) liveData.set("subtitle", updates.subtitle)
      if (updates.boundaryType !== undefined) liveData.set("boundaryType", updates.boundaryType)
      if (updates.borderColor !== undefined) liveData.set("borderColor", updates.borderColor)
      if (updates.fillColor !== undefined) liveData.set("fillColor", updates.fillColor)
      if (updates.textColor !== undefined) liveData.set("textColor", updates.textColor)
      if (updates.isDashed !== undefined) liveData.set("isDashed", updates.isDashed)
    },
    [id]
  )

  const handleSelectPreset = useCallback(
    (newType: GroupBoundaryType) => {
      const p = BOUNDARY_PRESETS[newType]
      updateGroupData({
        boundaryType: newType,
        label: p.label,
        subtitle: p.subtitle,
        borderColor: p.borderColor,
        fillColor: p.fillColor,
        textColor: p.textColor,
        isDashed: p.isDashed,
      })
    },
    [updateGroupData]
  )

  const handleToggleDashed = useCallback(() => {
    updateGroupData({ isDashed: !isDashed })
  }, [updateGroupData, isDashed])

  const commitLabel = useCallback(() => {
    if (!labelInputRef.current) return
    const text = labelInputRef.current.value.trim()
    updateGroupData({ label: text || preset.label })
    setIsEditingLabel(false)
  }, [updateGroupData, preset.label])

  const commitSubtitle = useCallback(() => {
    if (!subtitleInputRef.current) return
    const text = subtitleInputRef.current.value.trim()
    updateGroupData({ subtitle: text })
    setIsEditingSubtitle(false)
  }, [updateGroupData])

  useEffect(() => {
    if (isEditingLabel) {
      labelInputRef.current?.focus()
      labelInputRef.current?.select()
    }
  }, [isEditingLabel])

  useEffect(() => {
    if (isEditingSubtitle) {
      subtitleInputRef.current?.focus()
      subtitleInputRef.current?.select()
    }
  }, [isEditingSubtitle])

  return (
    <div
      className={cn(
        "group/group-node relative h-full w-full rounded-2xl transition-all",
        selected && "ring-1 ring-white/40 shadow-lg shadow-black/40"
      )}
      style={{
        backgroundColor: fillColor,
        borderColor: borderColor,
        borderWidth: 1.5,
        borderStyle: isDashed ? "dashed" : "solid",
      }}
    >
      <NodeResizer
        color="rgba(255,255,255,0.4)"
        isVisible={!!selected}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={RESIZER_HANDLE_STYLE}
        lineStyle={RESIZER_LINE_STYLE}
      />

      {/* Preset & Style Toolbar */}
      <NodeToolbar
        isVisible={!!selected}
        position={selected ? undefined : undefined}
        className="flex items-center gap-1 rounded-full border border-border-default bg-bg-surface/95 p-1 shadow-2xl backdrop-blur-xl"
      >
        {(["vpc", "subnet-public", "subnet-private", "k8s-cluster", "security-zone"] as const).map(
          (t) => {
            const p = BOUNDARY_PRESETS[t]
            const isCurrent = boundaryType === t
            return (
              <button
                key={t}
                type="button"
                className={cn(
                  "nodrag nopan rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all",
                  isCurrent
                    ? "bg-accent-ai text-white shadow-xs"
                    : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                )}
                style={isCurrent ? { backgroundColor: p.textColor, color: "#000" } : undefined}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectPreset(t)
                }}
              >
                {t === "vpc"
                  ? "VPC"
                  : t === "subnet-public"
                  ? "Public"
                  : t === "subnet-private"
                  ? "Private"
                  : t === "k8s-cluster"
                  ? "K8s"
                  : "DMZ"}
              </button>
            )
          }
        )}

        <div className="mx-1 h-3 w-px bg-border-subtle" />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleDashed()
          }}
          className={cn(
            "nodrag nopan rounded-full px-2 py-1 text-[10px] font-medium transition-colors",
            isDashed
              ? "bg-bg-elevated text-text-primary"
              : "text-text-muted hover:text-text-primary"
          )}
          title="Toggle Dashed Border"
        >
          {isDashed ? "Dashed" : "Solid"}
        </button>
      </NodeToolbar>

      {/* Header Pill */}
      <div
        className="nodrag absolute left-3 top-3 z-10 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 backdrop-blur-md transition-opacity"
        style={{ backgroundColor: "rgba(10, 10, 10, 0.75)" }}
      >
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${textColor}22`, color: textColor }}
        >
          {boundaryType === "vpc" && <Cloud className="h-3 w-3" />}
          {boundaryType === "subnet-public" && <Globe className="h-3 w-3" />}
          {boundaryType === "subnet-private" && <Lock className="h-3 w-3" />}
          {boundaryType === "k8s-cluster" && <Boxes className="h-3 w-3" />}
          {boundaryType === "security-zone" && <ShieldAlert className="h-3 w-3" />}
          {boundaryType === "custom" && <Layers className="h-3 w-3" />}
        </div>

        <div className="min-w-0 flex-1">
          {/* Title */}
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              defaultValue={label}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLabel()
                if (e.key === "Escape") setIsEditingLabel(false)
              }}
              className="h-4 w-full bg-transparent p-0 text-xs font-semibold text-text-primary outline-none"
            />
          ) : (
            <p
              onDoubleClick={(e) => {
                e.stopPropagation()
                setIsEditingLabel(true)
              }}
              className="cursor-text truncate text-xs font-semibold text-text-primary hover:text-white"
              title="Double click to edit title"
            >
              {label}
            </p>
          )}

          {/* Subtitle / CIDR */}
          {isEditingSubtitle ? (
            <input
              ref={subtitleInputRef}
              defaultValue={subtitle}
              onBlur={commitSubtitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSubtitle()
                if (e.key === "Escape") setIsEditingSubtitle(false)
              }}
              className="h-3 w-full bg-transparent p-0 text-[10px] font-mono text-text-muted outline-none"
            />
          ) : (
            <p
              onDoubleClick={(e) => {
                e.stopPropagation()
                setIsEditingSubtitle(true)
              }}
              className="cursor-text truncate font-mono text-[10px] text-text-muted hover:text-text-secondary"
              title="Double click to edit subtitle/CIDR"
            >
              {subtitle || "Add CIDR / Subtitle"}
            </p>
          )}
        </div>
      </div>

      {/* Subtle background watermark */}
      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 opacity-20">
        <Sparkles className="h-3 w-3" style={{ color: textColor }} />
        <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: textColor }}>
          {boundaryType}
        </span>
      </div>
    </div>
  )
}
