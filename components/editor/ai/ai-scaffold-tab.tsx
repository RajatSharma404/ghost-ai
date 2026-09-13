"use client"

import { useState, useCallback, useEffect } from "react"
import {
  FileCode,
  Download,
  Copy,
  Check,
  Loader2,
} from "lucide-react"
import type { ApiScaffoldResult } from "@/trigger/generate-api-scaffold"
import { useFeedMessages, useStorage } from "@liveblocks/react"
import { ChatFeedMessageSchema } from "@/types/tasks"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { CHAT_FEED_ID } from "./types"
import { RunTracker } from "./run-tracker"

interface AiScaffoldTabProps {
  roomId: string
  projectId: string
}

export function AiScaffoldTab({ roomId, projectId }: AiScaffoldTabProps) {
  const [apiFramework, setApiFramework] = useState<"nextjs" | "fastapi" | "express">("nextjs")
  const [isScaffoldGenerating, setIsScaffoldGenerating] = useState(false)
  const [scaffoldRunId, setScaffoldRunId] = useState<string | null>(null)
  const [scaffoldPublicToken, setScaffoldPublicToken] = useState<string | null>(null)
  const [scaffoldResult, setScaffoldResult] = useState<ApiScaffoldResult | null>(() => {
    if (typeof window === "undefined" || !projectId) return null
    try {
      const raw = localStorage.getItem(`ghost_ai_scaffold_${projectId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [scaffoldModalOpen, setScaffoldModalOpen] = useState(false)
  const [scaffoldModalTab, setScaffoldModalTab] = useState<"openapi" | "routes">("openapi")
  const [scaffoldCopied, setScaffoldCopied] = useState(false)

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

  // Persist API Scaffold result when updated
  useEffect(() => {
    if (!projectId || typeof window === "undefined" || !scaffoldResult) return
    try {
      localStorage.setItem(`ghost_ai_scaffold_${projectId}`, JSON.stringify(scaffoldResult))
    } catch {}
  }, [scaffoldResult, projectId])

  const handleScaffoldRunTerminal = useCallback(
    (status: string, output: unknown) => {
      setIsScaffoldGenerating(false)
      setScaffoldRunId(null)
      setScaffoldPublicToken(null)
      if (status === "COMPLETED" && output) {
        const typed = output as ApiScaffoldResult
        setScaffoldResult(typed)
        setScaffoldModalOpen(true)
      }
    },
    []
  )

  const handleGenerateScaffold = useCallback(async () => {
    if (isScaffoldGenerating) return
    setIsScaffoldGenerating(true)

    const nodes = nodesArray ?? []
    const edges = edgesArray ?? []
    const chatHistory = validatedChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    try {
      const res = await fetch("/api/ai/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          framework: apiFramework,
          chatHistory,
          nodes,
          edges,
          direct: true,
        }),
      })
      if (!res.ok) throw new Error("Scaffold request failed")
      const data = (await res.json()) as { result?: ApiScaffoldResult; runId?: string }

      if (data.result) {
        setIsScaffoldGenerating(false)
        setScaffoldResult(data.result)
        setScaffoldModalOpen(true)
        return
      }

      if (data.runId) {
        const tokenRes = await fetch("/api/ai/scaffold/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: data.runId }),
        })
        if (!tokenRes.ok) throw new Error("Token request failed")
        const { token } = (await tokenRes.json()) as { token: string }

        setScaffoldRunId(data.runId)
        setScaffoldPublicToken(token)
      } else {
        setIsScaffoldGenerating(false)
      }
    } catch {
      setIsScaffoldGenerating(false)
    }
  }, [isScaffoldGenerating, roomId, apiFramework, nodesArray, edgesArray, validatedChatMessages])

  const handleCopyScaffold = useCallback(() => {
    if (!scaffoldResult) return
    const textToCopy =
      scaffoldModalTab === "openapi"
        ? scaffoldResult.openapiYaml
        : scaffoldResult.routesCode
    navigator.clipboard.writeText(textToCopy).catch(() => {})
    setScaffoldCopied(true)
    setTimeout(() => setScaffoldCopied(false), 2000)
  }, [scaffoldResult, scaffoldModalTab])

  const handleDownloadOpenApi = useCallback(() => {
    if (!scaffoldResult?.openapiYaml) return
    const blob = new Blob([scaffoldResult.openapiYaml], {
      type: "application/x-yaml;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "openapi.yaml"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [scaffoldResult])

  const handleDownloadRoutesCode = useCallback(() => {
    if (!scaffoldResult?.routesCode) return
    const blob = new Blob([scaffoldResult.routesCode], {
      type: "text/plain;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = scaffoldResult.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [scaffoldResult])

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {scaffoldRunId && scaffoldPublicToken && (
        <RunTracker
          runId={scaffoldRunId}
          publicToken={scaffoldPublicToken}
          onTerminal={handleScaffoldRunTerminal}
        />
      )}

      {/* API Scaffold & OpenAPI preview modal */}
      <Dialog
        open={scaffoldModalOpen}
        onOpenChange={(open) => {
          if (!open) setScaffoldModalOpen(false)
        }}
      >
        <DialogContent
          showCloseButton
          className="sm:max-w-4xl max-w-4xl border-border-default bg-bg-surface p-6"
        >
          <DialogHeader>
            <div className="flex items-center gap-2 pr-6">
              <FileCode className="h-4 w-4 text-accent-ai-text" />
              <DialogTitle className="text-sm font-medium text-text-primary">
                API Scaffolding & OpenAPI 3.0
              </DialogTitle>
              {scaffoldResult?.framework && (
                <span className="rounded-full bg-accent-ai/15 px-2 py-0.5 text-[10px] font-medium uppercase text-accent-ai-text">
                  {scaffoldResult.framework}
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="flex gap-2 border-b border-border-subtle pb-2 text-xs">
            <button
              type="button"
              onClick={() => setScaffoldModalTab("openapi")}
              className={cn(
                "rounded-lg px-3 py-1 font-medium transition-colors",
                scaffoldModalTab === "openapi"
                  ? "bg-accent-ai text-white"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              OpenAPI 3.0 YAML
            </button>
            <button
              type="button"
              onClick={() => setScaffoldModalTab("routes")}
              className={cn(
                "rounded-lg px-3 py-1 font-medium transition-colors",
                scaffoldModalTab === "routes"
                  ? "bg-accent-ai text-white"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              Route Handlers ({scaffoldResult?.filename})
            </button>
          </div>

          <ScrollArea className="max-h-[60vh] rounded-xl border border-border-subtle bg-bg-elevated font-mono text-xs">
            <pre className="overflow-x-auto p-4 leading-relaxed text-text-primary whitespace-pre">
              <code>
                {scaffoldModalTab === "openapi"
                  ? scaffoldResult?.openapiYaml
                  : scaffoldResult?.routesCode}
              </code>
            </pre>
          </ScrollArea>

          <div className="flex justify-end gap-2 border-t border-border-default pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyScaffold}
              className="h-7 gap-1.5 rounded-lg border-border-subtle px-3 text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
            >
              {scaffoldCopied ? (
                <Check className="h-3 w-3 text-state-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {scaffoldCopied ? "Copied!" : "Copy Active Tab"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadOpenApi}
              className="h-7 gap-1.5 rounded-lg border-border-subtle px-3 text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
            >
              <Download className="h-3 w-3" />
              Download openapi.yaml
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadRoutesCode}
              className="h-7 gap-1.5 rounded-lg bg-accent-ai px-3 text-xs text-white hover:bg-accent-ai/80"
            >
              <Download className="h-3 w-3" />
              Download {scaffoldResult?.filename}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-primary">Target Framework</p>
        <div className="flex gap-1 rounded-lg bg-bg-subtle p-0.5">
          {(["nextjs", "fastapi", "express"] as const).map((fw) => (
            <button
              key={fw}
              type="button"
              onClick={() => setApiFramework(fw)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all",
                apiFramework === fw
                  ? "bg-accent-ai text-white shadow-xs"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {fw === "nextjs" ? "Next.js" : fw === "fastapi" ? "FastAPI" : "Express"}
            </button>
          ))}
        </div>
      </div>

      {isScaffoldGenerating ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-ai/15">
            <FileCode className="h-7 w-7 text-accent-ai-text animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-accent-ai-text/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Generating API Scaffold & OpenAPI 3.0…
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Building schemas, route handlers & Swagger docs
            </p>
          </div>
        </div>
      ) : scaffoldResult ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                  API Scaffold
                </span>
                <p className="text-base font-bold text-text-primary mt-0.5">
                  {scaffoldResult.endpointsCount} Endpoints Generated
                </p>
              </div>
              <span className="rounded-full bg-accent-ai/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-accent-ai-text border border-accent-ai/30">
                {scaffoldResult.framework}
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              {scaffoldResult.summary}
            </p>

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScaffoldModalOpen(true)}
                className="flex-1 h-7 text-xs border-border-subtle"
              >
                View Code & OpenAPI
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadRoutesCode}
                className="h-7 gap-1.5 bg-accent-ai px-3 text-xs text-white hover:bg-accent-ai/80"
              >
                <Download className="h-3 w-3" />
                Download {scaffoldResult.filename}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-bg-elevated/50 p-3 text-[11px] leading-relaxed text-text-muted">
            Includes full OpenAPI 3.0.3 specification (`openapi.yaml`) and ready-to-run {scaffoldResult.framework} route handlers with parameter validation and JSON responses.
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/15">
            <FileCode className="h-6 w-6 text-accent-ai-text" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              API Scaffold & OpenAPI Generator
            </p>
            <p className="mt-1 max-w-[240px] text-xs text-text-muted">
              Generate OpenAPI 3.0 specs and starter route handlers (Next.js, FastAPI, Express) from your architecture.
            </p>
          </div>

          <Button
            onClick={handleGenerateScaffold}
            className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/80"
          >
            <FileCode className="mr-1.5 h-3.5 w-3.5" />
            Generate API Scaffold
          </Button>
        </div>
      )}
    </div>
  )
}
