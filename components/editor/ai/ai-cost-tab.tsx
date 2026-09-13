"use client"

import { useState, useCallback, useEffect } from "react"
import {
  DollarSign,
  TrendingDown,
  Server,
  Database,
  HardDrive,
  Globe,
  Cpu,
  Download,
  Loader2,
} from "lucide-react"
import type { CostReport } from "@/trigger/estimate-cost"
import { useFeedMessages, useStorage } from "@liveblocks/react"
import { ChatFeedMessageSchema } from "@/types/tasks"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CHAT_FEED_ID } from "./types"
import { RunTracker } from "./run-tracker"

interface AiCostTabProps {
  roomId: string
  projectId: string
}

export function AiCostTab({ roomId, projectId }: AiCostTabProps) {
  const [costProvider, setCostProvider] = useState<"aws" | "gcp" | "azure">("aws")
  const [costTier, setCostTier] = useState<"starter" | "growth" | "scale" | "enterprise">("growth")
  const [isCostEstimating, setIsCostEstimating] = useState(false)
  const [costRunId, setCostRunId] = useState<string | null>(null)
  const [costPublicToken, setCostPublicToken] = useState<string | null>(null)
  const [costReport, setCostReport] = useState<CostReport | null>(() => {
    if (typeof window === "undefined" || !projectId) return null
    try {
      const raw = localStorage.getItem(`ghost_ai_cost_${projectId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

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

  // Persist Cost report when updated
  useEffect(() => {
    if (!projectId || typeof window === "undefined" || !costReport) return
    try {
      localStorage.setItem(`ghost_ai_cost_${projectId}`, JSON.stringify(costReport))
    } catch {}
  }, [costReport, projectId])

  const handleCostRunTerminal = useCallback(
    (status: string, output: unknown) => {
      setIsCostEstimating(false)
      setCostRunId(null)
      setCostPublicToken(null)
      if (status === "COMPLETED" && output) {
        setCostReport(output as CostReport)
      }
    },
    []
  )

  const handleEstimateCost = useCallback(async () => {
    if (isCostEstimating) return
    setIsCostEstimating(true)

    const nodes = nodesArray ?? []
    const edges = edgesArray ?? []
    const chatHistory = validatedChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    try {
      const res = await fetch("/api/ai/cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          cloudProvider: costProvider,
          trafficTier: costTier,
          chatHistory,
          nodes,
          edges,
          direct: true,
        }),
      })
      if (!res.ok) throw new Error("Cost estimation failed")
      const data = (await res.json()) as { report?: CostReport; runId?: string }

      if (data.report) {
        setCostReport(data.report)
        setIsCostEstimating(false)
        return
      }

      if (data.runId) {
        const tokenRes = await fetch("/api/ai/cost/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: data.runId }),
        })
        if (!tokenRes.ok) throw new Error("Token request failed")
        const { token } = (await tokenRes.json()) as { token: string }

        setCostRunId(data.runId)
        setCostPublicToken(token)
      } else {
        setIsCostEstimating(false)
      }
    } catch {
      setIsCostEstimating(false)
    }
  }, [isCostEstimating, roomId, costProvider, costTier, nodesArray, edgesArray, validatedChatMessages])

  const handleDownloadCostReport = useCallback(() => {
    if (!costReport?.markdownReport) return
    const blob = new Blob([costReport.markdownReport], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cloud-cost-estimate-${costReport.cloudProvider}-${costReport.trafficTier}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [costReport])

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {costRunId && costPublicToken && (
        <RunTracker
          runId={costRunId}
          publicToken={costPublicToken}
          onTerminal={handleCostRunTerminal}
        />
      )}

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-text-primary">Cloud Provider</p>
          <div className="flex gap-1 rounded-lg bg-bg-subtle p-0.5">
            {(["aws", "gcp", "azure"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCostProvider(p)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase transition-all",
                  costProvider === p
                    ? "bg-bg-elevated text-text-primary shadow-xs"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-text-primary">Scale Tier</p>
          <div className="flex gap-1 rounded-lg bg-bg-subtle p-0.5">
            {(["starter", "growth", "scale", "enterprise"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCostTier(t)}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[9px] font-medium capitalize transition-all",
                  costTier === t
                    ? "bg-accent-ai text-white shadow-xs"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isCostEstimating ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-ai/15">
            <DollarSign className="h-7 w-7 text-accent-ai-text animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-accent-ai-text/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Estimating {costProvider.toUpperCase()} Cloud Costs…
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Calibrating compute, databases, bandwidth & storage
            </p>
          </div>
        </div>
      ) : costReport ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {/* Total Monthly Spend Card */}
          <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                  Monthly Estimate
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold text-text-primary">
                    ${costReport.totalMonthlyEstimate}
                  </span>
                  <span className="text-xs text-text-muted">/ month</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-accent-ai/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent-ai-text border border-accent-ai/30 uppercase">
                  {costReport.cloudProvider} • {costReport.trafficTier}
                </span>
                <span className="text-[10px] text-text-faint">
                  ~${costReport.totalMonthlyEstimate * 12}/yr run rate
                </span>
              </div>
            </div>

            {/* Category Pills */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-border-subtle/50 pt-2.5 text-[10px]">
              <div className="flex items-center gap-1 text-text-secondary">
                <Server className="h-3 w-3 text-accent-ai-text" />
                <span>Compute: ${costReport.categoryTotals.compute}</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <Database className="h-3 w-3 text-accent-ai-text" />
                <span>DB: ${costReport.categoryTotals.database}</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <HardDrive className="h-3 w-3 text-accent-ai-text" />
                <span>Storage: ${costReport.categoryTotals.storage}</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <Globe className="h-3 w-3 text-accent-ai-text" />
                <span>Network: ${costReport.categoryTotals.network}</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <Cpu className="h-3 w-3 text-accent-ai-text" />
                <span>AI/API: ${costReport.categoryTotals.ai}</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <DollarSign className="h-3 w-3 text-accent-ai-text" />
                <span>Other: ${costReport.categoryTotals.other}</span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              {costReport.summary}
            </p>

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEstimateCost}
                className="flex-1 h-7 text-xs border-border-subtle"
              >
                Re-calculate
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadCostReport}
                className="h-7 gap-1.5 bg-accent-ai px-3 text-xs text-white hover:bg-accent-ai/80"
              >
                <Download className="h-3 w-3" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Itemized Services Breakdown */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-text-primary px-0.5">
                Itemized Infrastructure Costs
              </p>
              {costReport.breakdown.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border-subtle bg-bg-elevated p-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary truncate">
                        {item.serviceName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-secondary leading-snug">
                        {item.details}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-text-primary">
                        ${item.monthlyCost}
                      </span>
                      <span className="text-[10px] text-text-muted">/mo</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* FinOps Savings Tips */}
              {costReport.costSavingTips.length > 0 && (
                <div className="mt-2 rounded-xl border border-accent-ai/20 bg-accent-ai/5 p-3">
                  <div className="flex items-center gap-1.5 text-accent-ai-text">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">
                      FinOps Optimization Opportunities
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {costReport.costSavingTips.map((tip, idx) => (
                      <div key={idx} className="text-[11px]">
                        <div className="flex items-center justify-between text-text-primary font-medium">
                          <span>{tip.title}</span>
                          <span className="text-emerald-400 font-semibold text-[10px]">
                            {tip.potentialSavings}
                          </span>
                        </div>
                        <p className="mt-0.5 text-text-secondary leading-snug">
                          {tip.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/15">
            <DollarSign className="h-6 w-6 text-accent-ai-text" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Cloud Cost & Capacity Estimator
            </p>
            <p className="mt-1 max-w-[240px] text-xs text-text-muted">
              Estimate monthly cloud bills across AWS, GCP, and Azure calibrated to your traffic scale.
            </p>
          </div>

          <div className="w-full space-y-1.5 rounded-xl border border-border-subtle bg-bg-elevated/50 p-3 text-left text-[11px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="text-accent-ai-text">☁️</span>
              <span>Multi-Cloud: AWS, GCP & Azure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent-ai-text">📈</span>
              <span>Scale Tiers (10k to 100M+ req/mo)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent-ai-text">💡</span>
              <span>Automated FinOps Cost-Saving Tips</span>
            </div>
          </div>

          <Button
            onClick={handleEstimateCost}
            className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/80"
          >
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Calculate Cost Estimate
          </Button>
        </div>
      )}
    </div>
  )
}
