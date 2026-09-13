"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  Code2,
  Copy,
  Check,
  Download,
  Loader2,
  Box,
  Layers,
  Terminal,
  GitCommit,
} from "lucide-react"
import { useFeedMessages, useStorage } from "@liveblocks/react"
import { ChatFeedMessageSchema } from "@/types/tasks"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CHAT_FEED_ID, type IaCFormat, type IaCResult } from "./types"
import { RunTracker } from "./run-tracker"
import { IacCodeViewerModal } from "./iac-code-viewer-modal"
import { GitHubExportDialog } from "./github-export-dialog"

interface AiIacTabProps {
  roomId: string
  projectId: string
}

export function AiIacTab({ roomId, projectId }: AiIacTabProps) {
  const [selectedIacFormats, setSelectedIacFormats] = useState<IaCFormat[]>([
    "docker-compose",
    "terraform",
    "kubernetes",
  ])
  const [isIacGenerating, setIsIacGenerating] = useState(false)
  const [iacRunId, setIacRunId] = useState<string | null>(null)
  const [iacPublicToken, setIacPublicToken] = useState<string | null>(null)
  const [iacResults, setIacResults] = useState<Partial<Record<IaCFormat, IaCResult>>>(() => {
    if (typeof window === "undefined" || !projectId) return {}
    try {
      const raw = localStorage.getItem(`ghost_ai_iac_${projectId}`)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [activeIacTab, setActiveIacTab] = useState<IaCFormat>(() => {
    if (typeof window === "undefined" || !projectId) return "docker-compose"
    try {
      const raw = localStorage.getItem(`ghost_ai_iac_${projectId}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        const firstKey = Object.keys(parsed)[0] as IaCFormat | undefined
        if (firstKey) return firstKey
      }
    } catch {}
    return "docker-compose"
  })
  const [iacModalOpen, setIacModalOpen] = useState(false)
  const [iacCopied, setIacCopied] = useState(false)
  const [githubDialogOpen, setGithubDialogOpen] = useState(false)

  const exportableFiles = useMemo(() => {
    return (Object.values(iacResults).filter(Boolean) as IaCResult[]).map((r) => ({
      path: r.filename,
      content: r.code,
    }))
  }, [iacResults])

  const nodesArray = useStorage((root) => {
    const m = root.flow?.nodes
    return m ? Object.values(m) : []
  })
  const edgesArray = useStorage((root) => {
    const m = root.flow?.edges
    return m ? Object.values(m) : []
  })

  const { messages: chatFeedMessages } = useFeedMessages(CHAT_FEED_ID)

  const validatedChatMessages = (chatFeedMessages ?? [])
    .map((msg) => {
      const parsed = ChatFeedMessageSchema.safeParse(msg.data)
      if (!parsed.success) return null
      return { id: msg.id, createdAt: msg.createdAt, ...parsed.data }
    })
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
    .sort((a, b) => a.createdAt - b.createdAt)

  // Persist IaC results when updated
  useEffect(() => {
    if (!projectId || typeof window === "undefined" || Object.keys(iacResults).length === 0) return
    try {
      localStorage.setItem(`ghost_ai_iac_${projectId}`, JSON.stringify(iacResults))
    } catch {}
  }, [iacResults, projectId])

  const toggleIacFormat = useCallback((format: IaCFormat) => {
    setSelectedIacFormats((prev) => {
      if (prev.includes(format)) {
        if (prev.length === 1) return prev
        return prev.filter((f) => f !== format)
      } else {
        return [...prev, format]
      }
    })
  }, [])

  const selectAllIacFormats = useCallback(() => {
    setSelectedIacFormats((prev) =>
      prev.length === 3
        ? ["docker-compose"]
        : ["docker-compose", "terraform", "kubernetes"]
    )
  }, [])

  const handleIacRunTerminal = useCallback(
    (status: string, output: unknown) => {
      setIsIacGenerating(false)
      setIacRunId(null)
      setIacPublicToken(null)
      if (status === "COMPLETED" && output) {
        const typed = output as IaCResult
        setIacResults((prev) => ({ ...prev, [typed.format]: typed }))
        setActiveIacTab(typed.format)
        setIacModalOpen(true)
      }
    },
    []
  )

  const handleGenerateIac = useCallback(async () => {
    if (isIacGenerating || selectedIacFormats.length === 0) return
    setIsIacGenerating(true)

    const nodes = nodesArray ?? []
    const edges = edgesArray ?? []
    const chatHistory = validatedChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    try {
      const res = await fetch("/api/ai/iac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          formats: selectedIacFormats,
          chatHistory,
          nodes,
          edges,
          direct: true,
        }),
      })
      if (!res.ok) throw new Error("IaC generation failed")
      const data = (await res.json()) as {
        result?: IaCResult
        results?: IaCResult[]
        runId?: string
      }

      const receivedList: IaCResult[] =
        data.results ?? (data.result ? [data.result] : [])

      if (receivedList.length > 0) {
        setIacResults((prev) => {
          const next = { ...prev }
          for (const item of receivedList) {
            next[item.format] = item
          }
          return next
        })
        setActiveIacTab(receivedList[0].format)
        setIsIacGenerating(false)
        setIacModalOpen(true)
        return
      }

      if (data.runId) {
        const tokenRes = await fetch("/api/ai/iac/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: data.runId }),
        })
        if (!tokenRes.ok) throw new Error("Token request failed")
        const { token } = (await tokenRes.json()) as { token: string }

        setIacRunId(data.runId)
        setIacPublicToken(token)
      } else {
        setIsIacGenerating(false)
      }
    } catch {
      setIsIacGenerating(false)
    }
  }, [isIacGenerating, roomId, selectedIacFormats, nodesArray, edgesArray, validatedChatMessages])

  const activeIacResult = iacResults[activeIacTab] ?? Object.values(iacResults)[0] ?? null

  const handleCopyIac = useCallback(
    (code?: string) => {
      const codeToCopy = code ?? activeIacResult?.code
      if (!codeToCopy) return
      navigator.clipboard.writeText(codeToCopy).catch(() => {})
      setIacCopied(true)
      setTimeout(() => setIacCopied(false), 2000)
    },
    [activeIacResult]
  )

  const handleDownloadIac = useCallback(
    (result?: IaCResult | null) => {
      const target = result ?? activeIacResult
      if (!target?.code) return
      const blob = new Blob([target.code], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = target.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [activeIacResult]
  )

  const handleDownloadAllIac = useCallback(() => {
    const list = Object.values(iacResults).filter(Boolean) as IaCResult[]
    list.forEach((item, index) => {
      setTimeout(() => {
        handleDownloadIac(item)
      }, index * 250)
    })
  }, [iacResults, handleDownloadIac])

  return (
    <div className="flex h-full flex-col gap-3 p-4 overflow-y-auto">
      {iacRunId && iacPublicToken && (
        <RunTracker
          runId={iacRunId}
          publicToken={iacPublicToken}
          onTerminal={handleIacRunTerminal}
        />
      )}

      {/* IaC code viewer modal */}
      <IacCodeViewerModal
        isOpen={iacModalOpen}
        onClose={() => setIacModalOpen(false)}
        results={iacResults}
        activeTab={activeIacTab}
        onTabChange={setActiveIacTab}
        onCopy={handleCopyIac}
        onDownload={handleDownloadIac}
        onDownloadAll={handleDownloadAllIac}
        onExportGithub={() => setGithubDialogOpen(true)}
        isCopied={iacCopied}
      />

      {/* GitHub Export Modal Dialog */}
      <GitHubExportDialog
        open={githubDialogOpen}
        onOpenChange={setGithubDialogOpen}
        files={exportableFiles}
      />

      {/* Header & Multi-Select Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-primary">
          Select Formats to Generate
        </p>
        <button
          type="button"
          onClick={selectAllIacFormats}
          className="text-[10px] text-accent-ai-text hover:underline font-medium"
        >
          {selectedIacFormats.length === 3 ? "Select 1" : "Select All (3)"}
        </button>
      </div>

      {/* Format selection cards */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-bg-subtle p-1">
        {[
          { id: "docker-compose" as const, label: "Compose", icon: Box, ext: "docker-compose.yml" },
          { id: "terraform" as const, label: "Terraform", icon: Layers, ext: "main.tf" },
          { id: "kubernetes" as const, label: "Kubernetes", icon: Terminal, ext: "k8s.yaml" },
        ].map(({ id, label, icon: Icon, ext }) => {
          const isSelected = selectedIacFormats.includes(id)
          const isGenerated = !!iacResults[id]

          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleIacFormat(id)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-lg py-2.5 px-1 text-center transition-all border",
                isSelected
                  ? "bg-bg-elevated text-text-primary border-accent-ai/40 shadow-xs ring-1 ring-accent-ai/20"
                  : "bg-transparent text-text-muted border-transparent hover:text-text-secondary hover:bg-bg-elevated/40"
              )}
            >
              <div className="flex items-center gap-1">
                <Icon className={cn("h-4 w-4", isSelected ? "text-accent-ai-text" : "text-text-muted")} />
                {isSelected && (
                  <Check className="h-3 w-3 text-accent-ai-text font-bold" />
                )}
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
              <span className="text-[8px] font-mono text-text-faint truncate max-w-full">
                {ext}
              </span>
              {isGenerated && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Description note */}
      <div className="rounded-xl border border-border-subtle bg-bg-elevated/50 p-2.5 text-[11px] leading-relaxed text-text-muted">
        {selectedIacFormats.length === 3 && (
          <span>
            Generates full infrastructure suite: <code className="font-mono text-accent-ai-text">docker-compose.yml</code>, <code className="font-mono text-accent-ai-text">main.tf</code> (AWS), and <code className="font-mono text-accent-ai-text">k8s.yaml</code>.
          </span>
        )}
        {selectedIacFormats.length === 2 && (
          <span>
            Generates {selectedIacFormats.map((f) => f === "docker-compose" ? "Docker Compose" : f === "terraform" ? "Terraform" : "Kubernetes").join(" and ")}.
          </span>
        )}
        {selectedIacFormats.length === 1 && (
          <span>
            Generates {selectedIacFormats[0] === "docker-compose" ? "Docker Compose (docker-compose.yml)" : selectedIacFormats[0] === "terraform" ? "AWS Terraform (main.tf)" : "Kubernetes Manifests (k8s.yaml)"}.
          </span>
        )}
      </div>

      <Button
        onClick={handleGenerateIac}
        disabled={isIacGenerating || selectedIacFormats.length === 0}
        className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/80 disabled:opacity-60"
      >
        {isIacGenerating ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Generating {selectedIacFormats.length} Format{selectedIacFormats.length > 1 ? "s" : ""}…
          </>
        ) : (
          <>
            <Code2 className="mr-1.5 h-3.5 w-3.5" />
            {selectedIacFormats.length === 3
              ? "Generate All 3 Formats"
              : selectedIacFormats.length === 2
              ? "Generate 2 Formats"
              : selectedIacFormats.length === 1
              ? `Generate ${selectedIacFormats[0] === "docker-compose" ? "Docker Compose" : selectedIacFormats[0] === "terraform" ? "Terraform" : "Kubernetes"}`
              : "Select at least 1 format"}
          </>
        )}
      </Button>

      {/* Generated Artifacts List */}
      {Object.keys(iacResults).length > 0 ? (
        <div className="mt-1 flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-text-primary">
              Generated Infrastructure ({Object.keys(iacResults).length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGithubDialogOpen(true)}
                className="text-[10px] text-accent-ai-text hover:underline flex items-center gap-1"
                title="Export generated manifests directly to GitHub"
              >
                <GitCommit className="h-2.5 w-2.5" />
                Push to GitHub
              </button>
              {Object.keys(iacResults).length > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadAllIac}
                  className="text-[10px] text-accent-ai-text hover:underline flex items-center gap-1"
                >
                  <Download className="h-2.5 w-2.5" />
                  Download All
                </button>
              )}
            </div>
          </div>

          {Object.values(iacResults).map((res) => {
            if (!res) return null
            return (
              <div
                key={res.format}
                className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-bg-elevated p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Code2 className="h-3.5 w-3.5 shrink-0 text-accent-ai-text" />
                    <span className="truncate text-xs font-medium text-text-primary">
                      {res.filename}
                    </span>
                  </div>
                  <span className="rounded bg-accent-ai/15 px-1.5 py-0.5 text-[9px] font-medium text-accent-ai-text uppercase">
                    {res.format}
                  </span>
                </div>

                <div className="flex gap-1.5 pt-0.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveIacTab(res.format)
                      setIacModalOpen(true)
                    }}
                    className="flex-1 h-7 text-xs"
                  >
                    View Code
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyIac(res.code)}
                    className="h-7 px-2.5 text-xs"
                    title="Copy code"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadIac(res)}
                    className="h-7 px-2.5 bg-accent-ai text-white hover:bg-accent-ai/80 text-xs"
                    title="Download file"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center py-6">
          <Code2 className="h-8 w-8 text-text-faint" />
          <p className="text-xs text-text-muted">
            No code generated yet. Select 1, 2, or all 3 formats and click generate.
          </p>
        </div>
      )}
    </div>
  )
}
