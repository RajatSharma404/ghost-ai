"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Handle, Position, NodeResizer, NodeToolbar } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"
import { useMutation } from "@liveblocks/react"
import { LiveObject } from "@liveblocks/client"
import { Sparkles } from "lucide-react"
import type { CanvasRegularNode, NodeShape } from "@/types/canvas"
import { NODE_COLORS } from "@/types/canvas"
import { TechIcon } from "@/components/editor/canvas/tech-icons"
import { IconPickerDialog } from "@/components/editor/canvas/icon-picker-dialog"
import { cn } from "@/lib/utils"

const DEFAULT_FILL = NODE_COLORS[0].fill
const DEFAULT_TEXT = NODE_COLORS[0].text
const BORDER_REST = "rgba(255,255,255,0.1)"
const BORDER_SELECTED = "rgba(255,255,255,0.35)"
const RESIZER_COLOR = "rgba(255,255,255,0.3)"

const MIN_WIDTH = 60
const MIN_HEIGHT = 40

const HANDLE_CLS =
  "!h-2.5 !w-2.5 !rounded-full !border-2 !border-bg-base !bg-white opacity-0 transition-opacity group-hover/node:opacity-100"

const RESIZER_HANDLE_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.2)",
}

const RESIZER_LINE_STYLE: React.CSSProperties = {
  borderColor: RESIZER_COLOR,
  borderWidth: 1,
}

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

interface ColorSwatchProps {
  pair: (typeof NODE_COLORS)[number]
  isActive: boolean
  onSelect: (fill: string, text: string) => void
}

function ColorSwatch({ pair, isActive, onSelect }: ColorSwatchProps) {
  return (
    <button
      className="nodrag nopan"
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: pair.fill,
        border: isActive ? `2px solid ${pair.text}` : "2px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        flexShrink: 0,
        outline: "none",
        transition: "box-shadow 0.12s",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 5px 2px ${pair.text}55`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "none"
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(pair.fill, pair.text)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    />
  )
}

type LiveNodeData = LiveObject<{
  data: LiveObject<{
    label: string
    color?: string
    textColor?: string
    shape?: NodeShape
    icon?: string
  }>
}>

export function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasRegularNode>) {
  const fill = data.color ?? DEFAULT_FILL
  const textColor = data.textColor ?? DEFAULT_TEXT
  const shape = data.shape ?? "rectangle"
  const stroke = selected ? BORDER_SELECTED : BORDER_REST
  const isSvg = shape === "diamond" || shape === "hexagon" || shape === "cylinder"

  const [isEditing, setIsEditing] = useState(false)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const editRef = useRef<HTMLDivElement>(null)

  const updateNodeLabel = useMutation(({ storage }, newLabel: string) => {
    const node = storage.get("flow").get("nodes").get(id)
    if (!node) return
    ;(node as unknown as LiveNodeData).get("data").set("label", newLabel)
  }, [id])

  const updateNodeColor = useMutation(({ storage }, colorFill: string, colorText: string) => {
    const node = storage.get("flow").get("nodes").get(id)
    if (!node) return
    const liveData = (node as unknown as LiveNodeData).get("data")
    liveData.set("color", colorFill)
    liveData.set("textColor", colorText)
  }, [id])

  const updateNodeIcon = useMutation(({ storage }, iconKey: string | null) => {
    const node = storage.get("flow").get("nodes").get(id)
    if (!node) return
    const liveData = (node as unknown as LiveNodeData).get("data")
    liveData.set("icon", iconKey ?? "")
  }, [id])

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }, [])

  const commitEdit = useCallback(() => {
    const value = editRef.current?.textContent ?? ""
    setIsEditing(false)
    updateNodeLabel(value)
  }, [updateNodeLabel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (e.key === "Escape" || e.key === "Enter") {
      commitEdit()
    }
  }, [commitEdit])

  useEffect(() => {
    if (!isEditing || !editRef.current) return
    const el = editRef.current
    el.textContent = data.label ?? ""
    el.focus()
    const sel = window.getSelection()
    if (sel) {
      const range = document.createRange()
      range.selectNodeContents(el)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const labelContent = (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 max-w-full px-3",
        isSvg ? "relative z-10" : ""
      )}
      style={{ visibility: isEditing ? "hidden" : "visible" }}
    >
      {data.icon && (
        <div className="shrink-0 flex items-center justify-center">
          <TechIcon iconId={data.icon} size={18} />
        </div>
      )}
      <span
        className="truncate"
        style={{ color: textColor }}
      >
        {data.label || <span style={{ opacity: 0.35 }}>Label</span>}
      </span>
    </div>
  )

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      className="group/node relative flex items-center justify-center text-sm font-medium"
      onDoubleClick={startEditing}
    >
      <NodeResizer
        isVisible={selected ?? false}
        color={RESIZER_COLOR}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={RESIZER_HANDLE_STYLE}
        lineStyle={RESIZER_LINE_STYLE}
      />

      <NodeToolbar isVisible={selected ?? false} position={Position.Top}>
        <div className="nodrag nopan flex items-center gap-1.5 rounded-full border border-border-default bg-bg-surface/95 px-2.5 py-1.5 shadow-xl backdrop-blur-xl">
          {NODE_COLORS.map((pair) => (
            <ColorSwatch
              key={pair.fill}
              pair={pair}
              isActive={pair.fill === fill}
              onSelect={updateNodeColor}
            />
          ))}

          <div className="mx-0.5 h-3.5 w-px bg-border-subtle" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIconPickerOpen(true)
            }}
            className="nodrag nopan flex items-center gap-1 rounded-full bg-bg-elevated px-2 py-1 text-[10px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
            title="Choose Tech Icon"
          >
            {data.icon ? (
              <TechIcon iconId={data.icon} size={13} />
            ) : (
              <Sparkles className="h-3 w-3 text-accent-ai-text" />
            )}
            <span>{data.icon ? "Icon" : "Add Icon"}</span>
          </button>
        </div>
      </NodeToolbar>

      <IconPickerDialog
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        currentIcon={data.icon}
        onSelectIcon={updateNodeIcon}
      />

      {isSvg ? (
        <>
          <div className="absolute inset-0">
            {shape === "diamond" && <DiamondShape fill={fill} stroke={stroke} />}
            {shape === "hexagon" && <HexagonShape fill={fill} stroke={stroke} />}
            {shape === "cylinder" && <CylinderShape fill={fill} stroke={stroke} />}
          </div>
          {labelContent}
        </>
      ) : (
        <div
          style={{
            background: fill,
            borderRadius: cssBorderRadius(shape),
            border: `1px solid ${stroke}`,
            width: "100%",
            height: "100%",
          }}
          className="flex items-center justify-center"
        >
          {labelContent}
        </div>
      )}

      {isEditing && (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className="nodrag nopan absolute inset-0 z-20 flex items-center justify-center text-center text-sm font-medium outline-none cursor-text"
          style={{ color: textColor, wordBreak: "break-word", padding: "0 12px" }}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}

      <Handle id="top" type="source" position={Position.Top} className={HANDLE_CLS} />
      <Handle id="bottom" type="source" position={Position.Bottom} className={HANDLE_CLS} />
      <Handle id="left" type="source" position={Position.Left} className={HANDLE_CLS} />
      <Handle id="right" type="source" position={Position.Right} className={HANDLE_CLS} />
    </div>
  )
}
