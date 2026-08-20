"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Search, Sparkles, Layers } from "lucide-react"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
  type TemplateCategory,
} from "@/components/editor/starter-templates"
import { cn } from "@/lib/utils"

// Internal viewBox coordinate space — nodes are scaled/offset to fit here.
const VB_W = 500
const VB_H = 280
const VB_PAD = 20

interface TemplatePreviewProps {
  template: CanvasTemplate
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  if (template.nodes.length === 0) return null

  const minX = Math.min(...template.nodes.map((nd) => nd.position.x))
  const minY = Math.min(...template.nodes.map((nd) => nd.position.y))
  const maxX = Math.max(...template.nodes.map((nd) => nd.position.x + (nd.width ?? 140)))
  const maxY = Math.max(...template.nodes.map((nd) => nd.position.y + (nd.height ?? 60)))

  const bw = maxX - minX || 1
  const bh = maxY - minY || 1
  const scale = Math.min(
    (VB_W - VB_PAD * 2) / bw,
    (VB_H - VB_PAD * 2) / bh
  )

  const offsetX = (VB_W - bw * scale) / 2 - minX * scale
  const offsetY = (VB_H - bh * scale) / 2 - minY * scale

  const nodeMap = new Map(template.nodes.map((nd) => [nd.id, nd]))
  const markerId = `arr-${template.id}`

  return (
    <div className="w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(255,255,255,0.3)" />
          </marker>
        </defs>

        {template.edges.map((edge) => {
          const src = nodeMap.get(edge.source)
          const tgt = nodeMap.get(edge.target)
          if (!src || !tgt) return null
          const sx = (src.position.x + (src.width ?? 140) / 2) * scale + offsetX
          const sy = (src.position.y + (src.height ?? 60) / 2) * scale + offsetY
          const tx = (tgt.position.x + (tgt.width ?? 140) / 2) * scale + offsetX
          const ty = (tgt.position.y + (tgt.height ?? 60) / 2) * scale + offsetY
          return (
            <line
              key={edge.id}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1.5}
              markerEnd={`url(#${markerId})`}
            />
          )
        })}

        {template.nodes.map((nd) => {
          const x = nd.position.x * scale + offsetX
          const y = nd.position.y * scale + offsetY
          const nw = (nd.width ?? 140) * scale
          const nh = (nd.height ?? 60) * scale
          const rawData = nd.data as Record<string, unknown>
          const fill = typeof rawData.color === "string"
            ? rawData.color
            : typeof rawData.fillColor === "string"
            ? rawData.fillColor
            : "#1F1F1F"
          const stroke = "rgba(255,255,255,0.2)"
          const sw = 1
          const shape = typeof rawData.shape === "string" ? rawData.shape : "rectangle"

          if (shape === "circle") {
            return (
              <ellipse
                key={nd.id}
                cx={x + nw / 2}
                cy={y + nh / 2}
                rx={nw / 2}
                ry={nh / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "diamond") {
            return (
              <polygon
                key={nd.id}
                points={`${x + nw / 2},${y} ${x + nw},${y + nh / 2} ${x + nw / 2},${y + nh} ${x},${y + nh / 2}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "hexagon") {
            return (
              <polygon
                key={nd.id}
                points={`${x + nw * 0.25},${y} ${x + nw * 0.75},${y} ${x + nw},${y + nh / 2} ${x + nw * 0.75},${y + nh} ${x + nw * 0.25},${y + nh} ${x},${y + nh / 2}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "pill") {
            return (
              <rect
                key={nd.id}
                x={x}
                y={y}
                width={nw}
                height={nh}
                rx={nh / 2}
                ry={nh / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          return (
            <rect
              key={nd.id}
              x={x}
              y={y}
              width={nw}
              height={nh}
              rx={shape === "cylinder" ? Math.min(nw * 0.12, 6) : 4}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          )
        })}
      </svg>
    </div>
  )
}

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

const CATEGORIES: Array<{ id: TemplateCategory; label: string }> = [
  { id: "all", label: "All Templates" },
  { id: "ai", label: "AI & Agents" },
  { id: "streaming", label: "Real-Time & Streaming" },
  { id: "saas", label: "Cloud & SaaS" },
  { id: "microservices", label: "Microservices" },
  { id: "devops", label: "DevOps & CI/CD" },
]

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTemplates = useMemo(() => {
    return CANVAS_TEMPLATES.filter((t) => {
      const matchesCategory = activeCategory === "all" || t.category === activeCategory
      const matchesSearch =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  function handleImport(template: CanvasTemplate) {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1480px,95vw)]! gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b border-border-default px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-ai/15 text-accent-ai-text">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Architecture Template Gallery</DialogTitle>
                <DialogDescription className="text-xs text-text-muted">
                  Choose a battle-tested architecture blueprint to pre-populate your canvas.
                </DialogDescription>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 w-72">
              <Search className="h-4 w-4 text-text-faint" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-faint"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors shrink-0",
                  activeCategory === cat.id
                    ? "bg-accent-ai text-white"
                    : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="max-h-[68vh] overflow-y-auto px-8 py-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted">
              <Sparkles className="h-8 w-8 text-text-faint mb-2" />
              <p className="text-sm font-medium text-text-secondary">No templates found</p>
              <p className="text-xs text-text-muted mt-1">
                Try searching for a different keyword or select another category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-elevated transition-colors hover:border-border-subtle group"
                >
                  {/* Preview */}
                  <div className="bg-bg-base px-4 pt-4 pb-3">
                    <TemplatePreview template={template} />
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col gap-3 border-t border-border-default p-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {template.name}
                        </p>
                        <span className="flex items-center gap-1 rounded-full border border-border-subtle bg-bg-surface px-2 py-0.5 text-[10px] text-text-muted shrink-0">
                          <Layers className="h-2.5 w-2.5" />
                          {template.nodes.length} nodes
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-text-muted line-clamp-2">
                        {template.description}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-auto w-full gap-2 border-border-subtle group-hover:border-accent-ai/50 group-hover:bg-accent-ai/10 group-hover:text-accent-ai-text transition-colors"
                      onClick={() => handleImport(template)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Import Architecture</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
