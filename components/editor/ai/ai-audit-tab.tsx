"use client"

import { useState, useCallback, useEffect } from "react"
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react"
import type { AuditReport } from "@/trigger/audit-architecture"
import { useFeedMessages, useStorage } from "@liveblocks/react"
import { ChatFeedMessageSchema } from "@/types/tasks"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CHAT_FEED_ID } from "./types"
import { RunTracker } from "./run-tracker"

interface AiAuditTabProps {
  roomId: string
  projectId: string
}

export function AiAuditTab({ roomId, projectId }: AiAuditTabProps) {
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditRunId, setAuditRunId] = useState<string | null>(null)
  const [auditPublicToken, setAuditPublicToken] = useState<string | null>(null)
  const [auditReport, setAuditReport] = useState<AuditReport | null>(() => {
    if (typeof window === "undefined" || !projectId) return null
    try {
      const raw = localStorage.getItem(`ghost_ai_audit_${projectId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [auditCategory, setAuditCategory] = useState<
    "all" | "security" | "reliability" | "scalability" | "compliance"
  >("all")

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

  // Persist Audit report when updated
  useEffect(() => {
    if (!projectId || typeof window === "undefined" || !auditReport) return
    try {
      localStorage.setItem(`ghost_ai_audit_${projectId}`, JSON.stringify(auditReport))
    } catch {}
  }, [auditReport, projectId])

  const handleAuditRunTerminal = useCallback(
    (status: string, output: unknown) => {
      setIsAuditing(false)
      setAuditRunId(null)
      setAuditPublicToken(null)
      if (status === "COMPLETED" && output) {
        setAuditReport(output as AuditReport)
      }
    },
    []
  )

  const handleRunAudit = useCallback(async () => {
    if (isAuditing) return
    setIsAuditing(true)

    const nodes = nodesArray ?? []
    const edges = edgesArray ?? []
    const chatHistory = validatedChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    try {
      const res = await fetch("/api/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory, nodes, edges, direct: true }),
      })
      if (!res.ok) throw new Error("Audit request failed")
      const data = (await res.json()) as { report?: AuditReport; runId?: string }

      if (data.report) {
        setAuditReport(data.report)
        setIsAuditing(false)
        return
      }

      if (data.runId) {
        const tokenRes = await fetch("/api/ai/audit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: data.runId }),
        })
        if (!tokenRes.ok) throw new Error("Token request failed")
        const { token } = (await tokenRes.json()) as { token: string }

        setAuditRunId(data.runId)
        setAuditPublicToken(token)
      } else {
        setIsAuditing(false)
      }
    } catch {
      setIsAuditing(false)
    }
  }, [isAuditing, roomId, nodesArray, edgesArray, validatedChatMessages])

  const handleDownloadAuditReport = useCallback(() => {
    if (!auditReport?.markdownReport) return
    const blob = new Blob([auditReport.markdownReport], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `architecture-audit-score-${auditReport.healthScore}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [auditReport])

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {auditRunId && auditPublicToken && (
        <RunTracker
          runId={auditRunId}
          publicToken={auditPublicToken}
          onTerminal={handleAuditRunTerminal}
        />
      )}

      {isAuditing ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-ai/15">
            <ShieldCheck className="h-7 w-7 text-accent-ai-text animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-accent-ai-text/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Auditing Architecture…
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Evaluating STRIDE threats, SPoFs, bottlenecks & compliance
            </p>
          </div>
        </div>
      ) : auditReport ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {/* Health Score Card */}
          <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                  Health Score
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold text-text-primary">
                    {auditReport.healthScore}
                  </span>
                  <span className="text-xs text-text-muted">/100</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                    auditReport.riskLevel === "LOW"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : auditReport.riskLevel === "MEDIUM"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  )}
                >
                  {auditReport.riskLevel} RISK
                </span>
                <span className="text-[10px] text-text-faint">
                  {auditReport.findings.length} findings
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-text-secondary border-t border-border-subtle/50 pt-2">
              {auditReport.summary}
            </p>

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunAudit}
                className="flex-1 h-7 text-xs border-border-subtle"
              >
                Re-audit
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadAuditReport}
                className="h-7 gap-1.5 bg-accent-ai px-3 text-xs text-white hover:bg-accent-ai/80"
              >
                <Download className="h-3 w-3" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
            {(["all", "security", "reliability", "scalability", "compliance"] as const).map(
              (cat) => {
                const count =
                  cat === "all"
                    ? auditReport.findings.length
                    : auditReport.findings.filter((f) => f.category === cat).length

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAuditCategory(cat)}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 font-medium capitalize transition-colors",
                      auditCategory === cat
                        ? "bg-accent-ai text-white"
                        : "bg-bg-subtle text-text-muted hover:text-text-primary"
                    )}
                  >
                    {cat} ({count})
                  </button>
                )
              }
            )}
          </div>

          {/* Findings List */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
              {auditReport.findings
                .filter(
                  (f) => auditCategory === "all" || f.category === auditCategory
                )
                .map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {finding.severity === "critical" || finding.severity === "high" ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        )}
                        <p className="font-semibold text-text-primary">
                          {finding.title}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 border",
                          finding.severity === "critical"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : finding.severity === "high"
                            ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                            : finding.severity === "medium"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        )}
                      >
                        {finding.severity}
                      </span>
                    </div>

                    <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">
                      {finding.description}
                    </p>

                    {finding.affectedNodes.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-text-faint">Affected:</span>
                        {finding.affectedNodes.map((nodeId) => (
                          <span
                            key={nodeId}
                            className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[9px] text-accent-ai-text"
                          >
                            {nodeId}
                          </span>
                        ))}
                      </div>
                    )}

                    {finding.recommendation && (
                      <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-accent-ai/20 bg-accent-ai/5 p-2 text-[11px] text-accent-ai-text">
                        <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent-ai" />
                        <p className="leading-snug">{finding.recommendation}</p>
                      </div>
                    )}
                  </div>
                ))}

              {/* Well-Architected Strengths */}
              {auditReport.strengths.length > 0 && (
                <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">
                      Well-Architected Highlights
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[11px] text-text-secondary">
                    {auditReport.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/15">
            <ShieldAlert className="h-6 w-6 text-accent-ai-text" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Security & Reliability Audit
            </p>
            <p className="mt-1 max-w-[240px] text-xs text-text-muted">
              Scan your canvas for STRIDE threats, SPoFs, bottlenecks, and compliance vulnerabilities.
            </p>
          </div>

          <div className="w-full space-y-1.5 rounded-xl border border-border-subtle bg-bg-elevated/50 p-3 text-left text-[11px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="text-accent-ai-text">🛡️</span>
              <span>Threat Modeling & OWASP Top 10</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent-ai-text">⚡</span>
              <span>Single Points of Failure & Redundancy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-accent-ai-text">📈</span>
              <span>Bottlenecks & Caching Optimization</span>
            </div>
          </div>

          <Button
            onClick={handleRunAudit}
            className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/80"
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Run Architecture Audit
          </Button>
        </div>
      )}
    </div>
  )
}
