"use client"

import { useState, useMemo } from "react"
import {
  Download,
  Copy,
  Check,
  FileCode,
  Image as ImageIcon,
  FileType,
} from "lucide-react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  generateMermaid,
  generatePlantUML,
  downloadFile,
} from "@/lib/diagram-export"
import { cn } from "@/lib/utils"

interface DiagramExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  projectName?: string
}

type ExportTab = "image" | "mermaid" | "plantuml"

export function DiagramExportDialog({
  open,
  onOpenChange,
  nodes,
  edges,
  projectName = "architecture-diagram",
}: DiagramExportDialogProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("mermaid")
  const [mermaidDirection, setMermaidDirection] = useState<"LR" | "TD">("LR")
  const [copied, setCopied] = useState(false)
  const [imageBg, setImageBg] = useState<"dark" | "transparent">("dark")
  const [imageScale, setImageScale] = useState<number>(2)

  const mermaidCode = useMemo(() => {
    return generateMermaid(nodes, edges, { direction: mermaidDirection })
  }, [nodes, edges, mermaidDirection])

  const plantUmlCode = useMemo(() => {
    return generatePlantUML(nodes, edges, { title: projectName })
  }, [nodes, edges, projectName])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadImage = async (format: "png" | "svg") => {
    const flowViewport = document.querySelector(".react-flow__viewport") as HTMLElement
    if (!flowViewport) return

    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, "-")

    if (format === "svg") {
      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
        <rect width="100%" height="100%" fill="${imageBg === "dark" ? "#080809" : "none"}"/>
        ${flowViewport.innerHTML}
      </svg>`
      downloadFile(`${sanitizedName}.svg`, fullSvg, "image/svg+xml")
      return
    }

    // For PNG: draw to canvas
    const canvas = document.createElement("canvas")
    const width = 1600 * imageScale
    const height = 1000 * imageScale
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (imageBg === "dark") {
      ctx.fillStyle = "#080809"
      ctx.fillRect(0, 0, width, height)
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: #f0f0f4; font-family: sans-serif;">
          ${flowViewport.innerHTML}
        </div>
      </foreignObject>
    </svg>`

    const img = new Image()
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const URLObj = window.URL || window.webkitURL || window
    const blobURL = URLObj.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      URLObj.revokeObjectURL(blobURL)
      const pngUrl = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = pngUrl
      a.download = `${sanitizedName}-${imageScale}x.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    img.src = blobURL
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-2xl border-border-default bg-bg-surface p-0 overflow-hidden"
      >
        <DialogHeader className="p-4 pb-2 border-b border-border-default">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-primary/15 text-accent-primary">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-text-primary">
                Export Architecture Diagram
              </DialogTitle>
              <p className="text-xs text-text-muted">
                Export to images or documentation code (Mermaid / PlantUML)
              </p>
            </div>
          </div>

          {/* Format Tabs */}
          <div className="flex gap-1.5 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("mermaid")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "mermaid"
                  ? "bg-accent-ai text-white"
                  : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Mermaid.js</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("plantuml")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "plantuml"
                  ? "bg-accent-ai text-white"
                  : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <FileType className="h-3.5 w-3.5" />
              <span>PlantUML</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "image"
                  ? "bg-accent-ai text-white"
                  : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>PNG / SVG Image</span>
            </button>
          </div>
        </DialogHeader>

        {/* Tab Body */}
        <div className="p-4">
          {activeTab === "mermaid" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span>Flow Direction:</span>
                  <div className="flex rounded-lg border border-border-subtle bg-bg-elevated p-0.5">
                    <button
                      type="button"
                      onClick={() => setMermaidDirection("LR")}
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                        mermaidDirection === "LR"
                          ? "bg-accent-ai text-white"
                          : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Left to Right (LR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMermaidDirection("TD")}
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                        mermaidDirection === "TD"
                          ? "bg-accent-ai text-white"
                          : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Top to Down (TD)
                    </button>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(mermaidCode)}
                  className="h-7 gap-1.5 border-border-subtle text-xs"
                >
                  {copied ? <Check className="h-3 w-3 text-state-success" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </Button>
              </div>

              <ScrollArea className="h-64 rounded-xl border border-border-subtle bg-bg-elevated p-3">
                <pre className="font-mono text-xs text-text-secondary leading-relaxed whitespace-pre">
                  {mermaidCode}
                </pre>
              </ScrollArea>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-text-muted">
                  Embed directly in GitHub READMEs, Notion, and Markdown docs using <code>```mermaid</code> blocks.
                </p>
                <Button
                  size="sm"
                  onClick={() => downloadFile(`${projectName}.mmd`, mermaidCode, "text/plain")}
                  className="h-8 gap-1.5 bg-accent-ai text-xs text-white hover:bg-accent-ai/80"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .mmd</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === "plantuml" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">PlantUML Architecture Model</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(plantUmlCode)}
                  className="h-7 gap-1.5 border-border-subtle text-xs"
                >
                  {copied ? <Check className="h-3 w-3 text-state-success" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </Button>
              </div>

              <ScrollArea className="h-64 rounded-xl border border-border-subtle bg-bg-elevated p-3">
                <pre className="font-mono text-xs text-text-secondary leading-relaxed whitespace-pre">
                  {plantUmlCode}
                </pre>
              </ScrollArea>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-text-muted">
                  Use with PlantUML CLI, VSCode PlantUML extension, or GitLab architecture pages.
                </p>
                <Button
                  size="sm"
                  onClick={() => downloadFile(`${projectName}.puml`, plantUmlCode, "text/plain")}
                  className="h-8 gap-1.5 bg-accent-ai text-xs text-white hover:bg-accent-ai/80"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .puml</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === "image" && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Background Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary">Background</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImageBg("dark")}
                      className={cn(
                        "flex-1 rounded-xl border p-2.5 text-center text-xs font-medium transition-all",
                        imageBg === "dark"
                          ? "border-accent-ai bg-accent-ai/10 text-text-primary ring-1 ring-accent-ai"
                          : "border-border-subtle bg-bg-elevated text-text-muted hover:text-text-primary"
                      )}
                    >
                      Dark (#080809)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageBg("transparent")}
                      className={cn(
                        "flex-1 rounded-xl border p-2.5 text-center text-xs font-medium transition-all",
                        imageBg === "transparent"
                          ? "border-accent-ai bg-accent-ai/10 text-text-primary ring-1 ring-accent-ai"
                          : "border-border-subtle bg-bg-elevated text-text-muted hover:text-text-primary"
                      )}
                    >
                      Transparent
                    </button>
                  </div>
                </div>

                {/* Resolution Scale */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary">Resolution</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => setImageScale(scale)}
                        className={cn(
                          "flex-1 rounded-xl border p-2.5 text-center text-xs font-medium transition-all",
                          imageScale === scale
                            ? "border-accent-ai bg-accent-ai/10 text-text-primary ring-1 ring-accent-ai"
                            : "border-border-subtle bg-bg-elevated text-text-muted hover:text-text-primary"
                        )}
                      >
                        {scale}x {scale === 2 ? "(Retina)" : scale === 3 ? "(Print)" : ""}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border-default">
                <Button
                  onClick={() => handleDownloadImage("png")}
                  className="flex-1 h-9 gap-2 bg-accent-ai text-xs text-white hover:bg-accent-ai/80"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PNG Image</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadImage("svg")}
                  className="flex-1 h-9 gap-2 border-border-subtle text-xs text-text-primary hover:bg-bg-elevated"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Vector SVG</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
