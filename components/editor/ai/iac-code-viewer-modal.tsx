"use client"

import { useState, useMemo, memo } from "react"
import {
  Code2,
  Copy,
  Check,
  Download,
  X,
  Maximize2,
  Minimize2,
  GitCommit,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { IaCFormat, IaCResult } from "./types"

export function renderValueTokens(text: string): React.ReactNode {
  if (!text) return null
  const parts = text.split(/("[^"]*"|'[^']*'|\b(?:true|false|null|yes|no)\b|\b\d+\b)/g)
  return parts.map((part, i) => {
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
      return (
        <span key={i} className="text-emerald-300">
          {part}
        </span>
      )
    }
    if (/^(true|false|null|yes|no)$/i.test(part)) {
      return (
        <span key={i} className="text-amber-400 font-semibold">
          {part}
        </span>
      )
    }
    if (/^\d+$/.test(part)) {
      return (
        <span key={i} className="text-purple-300 font-medium">
          {part}
        </span>
      )
    }
    return (
      <span key={i} className="text-zinc-300">
        {part}
      </span>
    )
  })
}

export function highlightSyntax(line: string, format: IaCFormat): React.ReactNode {
  const trimmed = line.trim()
  if (!trimmed) return "\u00A0"

  // Comments
  if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
    return <span className="text-slate-500 italic">{line}</span>
  }

  // YAML (Docker Compose / Kubernetes)
  if (format === "docker-compose" || format === "kubernetes") {
    // List bullet item "- image: postgres"
    const listMatch = line.match(/^(\s*-\s+)([\w\-.]+)(\s*:\s*)(.*)$/)
    if (listMatch) {
      const [, dash, key, colon, rest] = listMatch
      return (
        <span>
          <span className="text-accent-ai-text font-bold">{dash}</span>
          <span className="text-sky-400 font-semibold">{key}</span>
          <span className="text-zinc-500">{colon}</span>
          {renderValueTokens(rest)}
        </span>
      )
    }

    // Standard key-value "services:" or "image: node:alpine"
    const keyMatch = line.match(/^(\s*)([\w\-.]+)(\s*:\s*)(.*)$/)
    if (keyMatch) {
      const [, indent, key, colon, rest] = keyMatch
      return (
        <span>
          {indent}
          <span className="text-sky-400 font-semibold">{key}</span>
          <span className="text-zinc-500">{colon}</span>
          {renderValueTokens(rest)}
        </span>
      )
    }
  }

  // Terraform HCL
  if (format === "terraform") {
    const blockMatch = line.match(/^(\s*)(resource|variable|provider|output|module|data)(\s+)(.*)$/)
    if (blockMatch) {
      const [, indent, keyword, space, rest] = blockMatch
      return (
        <span>
          {indent}
          <span className="text-purple-400 font-bold">{keyword}</span>
          {space}
          {renderValueTokens(rest)}
        </span>
      )
    }

    const assignMatch = line.match(/^(\s*)([\w\-_]+)(\s*=\s*)(.*)$/)
    if (assignMatch) {
      const [, indent, key, eq, rest] = assignMatch
      return (
        <span>
          {indent}
          <span className="text-sky-400">{key}</span>
          <span className="text-pink-400 font-semibold">{eq}</span>
          {renderValueTokens(rest)}
        </span>
      )
    }
  }

  return renderValueTokens(line)
}

export const FormattedCodeBlock = memo(function FormattedCodeBlock({
  code,
  format,
}: {
  code: string
  format: IaCFormat
}) {
  const highlightedLines = useMemo(() => {
    const rawLines = (code || "").split("\n")
    return rawLines.map((line, i) => ({
      lineNum: i + 1,
      element: highlightSyntax(line, format),
    }))
  }, [code, format])

  return (
    <div className="flex font-mono text-xs leading-relaxed select-text min-w-full">
      {/* Line Numbers Gutter */}
      <div className="shrink-0 select-none border-r border-border-subtle bg-bg-surface/60 py-4 px-3.5 text-right text-text-faint font-mono">
        {highlightedLines.map(({ lineNum }) => (
          <div key={lineNum} className="text-[11px] leading-relaxed opacity-50">
            {lineNum}
          </div>
        ))}
      </div>

      {/* Code Content */}
      <pre className="flex-1 overflow-x-auto p-4 text-text-primary whitespace-pre font-mono">
        <code>
          {highlightedLines.map(({ lineNum, element }) => (
            <div
              key={lineNum}
              className="leading-relaxed hover:bg-bg-elevated/50 px-1.5 -mx-1.5 rounded-xs transition-colors"
            >
              {element}
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
})

interface IacCodeViewerModalProps {
  isOpen: boolean
  onClose: () => void
  results: Partial<Record<IaCFormat, IaCResult>>
  activeTab: IaCFormat
  onTabChange: (tab: IaCFormat) => void
  onCopy: (code?: string) => void
  onDownload: (result?: IaCResult | null) => void
  onDownloadAll: () => void
  onExportGithub?: () => void
  isCopied: boolean
}

export function IacCodeViewerModal({
  isOpen,
  onClose,
  results,
  activeTab,
  onTabChange,
  onCopy,
  onDownload,
  onDownloadAll,
  onExportGithub,
  isCopied,
}: IacCodeViewerModalProps) {
  const [fullscreen, setFullscreen] = useState(false)

  const activeResult = results[activeTab] ?? Object.values(results)[0] ?? null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setFullscreen(false)
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "border-border-default bg-bg-surface p-0 overflow-hidden flex flex-col transition-all duration-200 shadow-2xl",
          fullscreen
            ? "sm:max-w-[96vw] max-w-[96vw] w-[96vw] h-[92vh] max-h-[92vh] rounded-2xl"
            : "sm:max-w-5xl max-w-5xl w-[90vw] max-h-[82vh] h-[82vh] rounded-2xl"
        )}
      >
        {/* Top Title & Controls Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-default bg-bg-subtle/40 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-ai/15 text-accent-ai-text">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-text-primary">
                Infrastructure as Code
              </DialogTitle>
              <p className="text-[10px] text-text-muted">
                {Object.keys(results).length} format{Object.keys(results).length > 1 ? "s" : ""} generated from architecture topology
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent-ai/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent-ai-text uppercase">
              {activeTab === "docker-compose" ? "Docker" : activeTab === "terraform" ? "Terraform AWS" : "Kubernetes"}
            </span>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setFullscreen((prev) => !prev)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary"
              title={fullscreen ? "Exit Fullscreen" : "Maximize Fullscreen"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                onClose()
                setFullscreen(false)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* VS Code Style Editor Tabs */}
        <div className="flex shrink-0 items-center gap-1 border-b border-border-subtle bg-bg-surface px-4 pt-2">
          {(["docker-compose", "terraform", "kubernetes"] as const).map((fmt) => {
            const res = results[fmt]
            if (!res) return null
            const label =
              fmt === "docker-compose"
                ? "docker-compose.yml"
                : fmt === "terraform"
                ? "main.tf"
                : "k8s.yaml"
            const icon =
              fmt === "docker-compose" ? "🐳" : fmt === "terraform" ? "🌐" : "☸️"
            const isActive = activeTab === fmt

            return (
              <button
                key={fmt}
                type="button"
                onClick={() => onTabChange(fmt)}
                className={cn(
                  "relative flex items-center gap-2 rounded-t-xl px-4 py-2 text-xs font-medium transition-all border-t border-x",
                  isActive
                    ? "bg-bg-elevated text-text-primary border-border-default font-semibold shadow-xs"
                    : "bg-bg-subtle/50 text-text-muted border-transparent hover:text-text-secondary hover:bg-bg-subtle"
                )}
              >
                <span className="text-sm">{icon}</span>
                <span className="font-mono">{label}</span>
                <span className="rounded bg-accent-ai/10 px-1 py-0.2 text-[9px] uppercase opacity-75">
                  {fmt === "docker-compose" ? "Compose" : fmt === "terraform" ? "AWS" : "K8s"}
                </span>
                {isActive && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-accent-ai" />
                )}
              </button>
            )
          })}
        </div>

        {/* Code Viewer Body */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-bg-elevated/90 font-mono text-xs">
          <FormattedCodeBlock
            code={activeResult?.code || "No code available."}
            format={activeTab}
          />
        </div>

        {/* Footer Bar */}
        <div className="flex shrink-0 items-center justify-between border-t border-border-default bg-bg-subtle/40 px-5 py-3">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>
              File: <code className="font-mono text-accent-ai-text font-semibold">{activeResult?.filename}</code>
            </span>
            <span className="text-border-default">•</span>
            <span>{(activeResult?.code || "").split("\n").length} lines</span>
            <span className="text-border-default">•</span>
            <span>{Math.round(((activeResult?.code || "").length / 1024) * 10) / 10} KB</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy()}
              className="h-8 gap-1.5 rounded-lg border-border-subtle px-3.5 text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-state-success" /> : <Copy className="h-3.5 w-3.5" />}
              {isCopied ? "Copied!" : `Copy ${activeResult?.filename ?? "Code"}`}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload()}
              className="h-8 gap-1.5 rounded-lg border-border-subtle px-3.5 text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              Download {activeResult?.filename ?? "File"}
            </Button>
            {onExportGithub && (
              <Button
                size="sm"
                variant="outline"
                onClick={onExportGithub}
                className="h-8 gap-1.5 rounded-lg border-border-subtle px-3 text-xs text-accent-ai-text hover:border-border-default hover:text-text-primary"
                title="Export manifests directly to GitHub"
              >
                <GitCommit className="h-3.5 w-3.5" />
                Push to GitHub
              </Button>
            )}
            {Object.keys(results).length > 1 && (
              <Button
                size="sm"
                onClick={onDownloadAll}
                className="h-8 gap-1.5 rounded-lg bg-accent-ai px-4 text-xs text-white hover:bg-accent-ai/80"
              >
                <Download className="h-3.5 w-3.5" />
                Download All ({Object.keys(results).length} files)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
