"use client"

import { useState, useCallback, useEffect } from "react"
import {
  GitFork,
  Check,
  Loader2,
} from "lucide-react"
import type {
  AlternativesReport,
  AlternativeArchitecture,
} from "@/trigger/suggest-alternatives"
import { LiveObject } from "@liveblocks/client"
import { useFeedMessages, useStorage, useMutation } from "@liveblocks/react"
import { ChatFeedMessageSchema } from "@/types/tasks"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CHAT_FEED_ID } from "./types"
import { RunTracker } from "./run-tracker"

interface AiDiffTabProps {
  roomId: string
  projectId: string
}

export function AiDiffTab({ roomId, projectId }: AiDiffTabProps) {
  const [isAlternativesGenerating, setIsAlternativesGenerating] = useState(false)
  const [alternativesRunId, setAlternativesRunId] = useState<string | null>(null)
  const [alternativesPublicToken, setAlternativesPublicToken] = useState<string | null>(null)
  const [alternativesReport, setAlternativesReport] = useState<AlternativesReport | null>(() => {
    if (typeof window === "undefined" || !projectId) return null
    try {
      const raw = localStorage.getItem(`ghost_ai_diff_${projectId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [appliedAlternativeId, setAppliedAlternativeId] = useState<string | null>(null)

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

  // Persist Alternatives / Diff report when updated
  useEffect(() => {
    if (!projectId || typeof window === "undefined" || !alternativesReport) return
    try {
      localStorage.setItem(`ghost_ai_diff_${projectId}`, JSON.stringify(alternativesReport))
    } catch {}
  }, [alternativesReport, projectId])

  const handleAlternativesRunTerminal = useCallback(
    (status: string, output: unknown) => {
      setIsAlternativesGenerating(false)
      setAlternativesRunId(null)
      setAlternativesPublicToken(null)
      if (status === "COMPLETED" && output) {
        setAlternativesReport(output as AlternativesReport)
      }
    },
    []
  )

  const handleSuggestAlternatives = useCallback(async () => {
    if (isAlternativesGenerating) return
    setIsAlternativesGenerating(true)

    const nodes = nodesArray ?? []
    const edges = edgesArray ?? []
    const chatHistory = validatedChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    try {
      const res = await fetch("/api/ai/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory, nodes, edges, direct: true }),
      })
      if (!res.ok) throw new Error("Alternatives request failed")
      const data = (await res.json()) as { report?: AlternativesReport; runId?: string }

      if (data.report) {
        setAlternativesReport(data.report)
        setIsAlternativesGenerating(false)
        return
      }

      if (data.runId) {
        const tokenRes = await fetch("/api/ai/alternatives/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: data.runId }),
        })
        if (!tokenRes.ok) throw new Error("Token request failed")
        const { token } = (await tokenRes.json()) as { token: string }

        setAlternativesRunId(data.runId)
        setAlternativesPublicToken(token)
      } else {
        setIsAlternativesGenerating(false)
      }
    } catch {
      setIsAlternativesGenerating(false)
    }
  }, [isAlternativesGenerating, roomId, nodesArray, edgesArray, validatedChatMessages])

  const applyAlternativeToCanvas = useMutation(
    ({ storage }, alt: AlternativeArchitecture) => {
      const flow = storage.get("flow")
      if (!flow) return
      const nodesMap = flow.get("nodes")
      const edgesMap = flow.get("edges")

      // Clear existing nodes and edges
      for (const key of Array.from(nodesMap.keys())) {
        nodesMap.delete(key)
      }
      for (const key of Array.from(edgesMap.keys())) {
        edgesMap.delete(key)
      }

      // Add new nodes
      for (const node of alt.nodes) {
        nodesMap.set(
          node.id,
          new LiveObject({
            id: node.id,
            type: node.type || "canvasNode",
            position: new LiveObject(node.position),
            data: new LiveObject({
              label: node.data.label,
              shape: node.data.shape || "rectangle",
              color: node.data.color || "#1F1F1F",
              textColor: node.data.textColor || "#EDEDED",
            }),
          }) as unknown as Parameters<typeof nodesMap.set>[1]
        )
      }

      // Add new edges
      for (const edge of alt.edges) {
        edgesMap.set(
          edge.id,
          new LiveObject({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "canvasEdge",
            data: new LiveObject({
              label: edge.data?.label || "",
            }),
          }) as unknown as Parameters<typeof edgesMap.set>[1]
        )
      }
    },
    []
  )

  const handleApplyAlternative = useCallback(
    (alt: AlternativeArchitecture) => {
      applyAlternativeToCanvas(alt)
      setAppliedAlternativeId(alt.id)
      setTimeout(() => setAppliedAlternativeId(null), 2500)
    },
    [applyAlternativeToCanvas]
  )

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {alternativesRunId && alternativesPublicToken && (
        <RunTracker
          runId={alternativesRunId}
          publicToken={alternativesPublicToken}
          onTerminal={handleAlternativesRunTerminal}
        />
      )}

      {isAlternativesGenerating ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-ai/15">
            <GitFork className="h-7 w-7 text-accent-ai-text animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-accent-ai-text/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Synthesizing 3 Architectural Alternatives…
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Comparing serverless, event-driven & modular paradigms
            </p>
          </div>
        </div>
      ) : alternativesReport ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-elevated p-3">
            <div>
              <p className="text-xs font-semibold text-text-primary">
                3 Alternative Architectures
              </p>
              <p className="text-[10px] text-text-muted">
                Select an architecture to apply to canvas
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSuggestAlternatives}
              className="h-7 text-xs border-border-subtle"
            >
              Re-generate
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
              {alternativesReport.alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="rounded-2xl border border-border-subtle bg-bg-elevated p-3.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-md bg-accent-ai/15 px-2 py-0.5 text-[9px] font-bold uppercase text-accent-ai-text">
                        {alt.paradigm}
                      </span>
                      <h4 className="mt-1 font-semibold text-text-primary">
                        {alt.title}
                      </h4>
                    </div>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">
                    {alt.description}
                  </p>

                  {/* Tradeoffs Grid */}
                  <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-bg-subtle p-2 text-center text-[9px]">
                    <div>
                      <span className="text-text-faint">Cost</span>
                      <p
                        className={cn(
                          "font-bold uppercase",
                          alt.tradeoffs.cost === "low"
                            ? "text-emerald-400"
                            : alt.tradeoffs.cost === "high"
                            ? "text-rose-400"
                            : "text-amber-400"
                        )}
                      >
                        {alt.tradeoffs.cost}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-faint">Complexity</span>
                      <p
                        className={cn(
                          "font-bold uppercase",
                          alt.tradeoffs.complexity === "low"
                            ? "text-emerald-400"
                            : alt.tradeoffs.complexity === "high"
                            ? "text-rose-400"
                            : "text-amber-400"
                        )}
                      >
                        {alt.tradeoffs.complexity}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-faint">Latency</span>
                      <p
                        className={cn(
                          "font-bold uppercase",
                          alt.tradeoffs.latency === "low"
                            ? "text-emerald-400"
                            : alt.tradeoffs.latency === "high"
                            ? "text-rose-400"
                            : "text-amber-400"
                        )}
                      >
                        {alt.tradeoffs.latency}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-faint">Scale</span>
                      <p
                        className={cn(
                          "font-bold uppercase",
                          alt.tradeoffs.scalability === "high"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        )}
                      >
                        {alt.tradeoffs.scalability}
                      </p>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="mt-2.5 space-y-1 text-[10px]">
                    {alt.pros.slice(0, 2).map((p, idx) => (
                      <div key={idx} className="flex items-start gap-1 text-text-secondary">
                        <span className="text-emerald-400 font-bold">+</span>
                        <span>{p}</span>
                      </div>
                    ))}
                    {alt.cons.slice(0, 2).map((c, idx) => (
                      <div key={idx} className="flex items-start gap-1 text-text-muted">
                        <span className="text-rose-400 font-bold">-</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleApplyAlternative(alt)}
                    disabled={appliedAlternativeId === alt.id}
                    className="mt-3 w-full h-7 gap-1.5 rounded-lg bg-accent-ai text-xs text-white hover:bg-accent-ai/80"
                  >
                    {appliedAlternativeId === alt.id ? (
                      <>
                        <Check className="h-3 w-3 text-state-success" />
                        Applied to Canvas!
                      </>
                    ) : (
                      <>
                        <GitFork className="h-3 w-3" />
                        Apply to Canvas ({alt.nodes.length} nodes)
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/15">
            <GitFork className="h-6 w-6 text-accent-ai-text" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Architecture Alternatives & Diff
            </p>
            <p className="mt-1 max-w-[240px] text-xs text-text-muted">
              Generate 3 distinct architectural paradigms with tradeoff matrices and 1-click live canvas reconfiguration.
            </p>
          </div>

          <Button
            onClick={handleSuggestAlternatives}
            className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/80"
          >
            <GitFork className="mr-1.5 h-3.5 w-3.5" />
            Suggest 3 Alternatives
          </Button>
        </div>
      )}
    </div>
  )
}
