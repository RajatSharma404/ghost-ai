"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import {
  Bot,
  X,
  Send,
  FileText,
  Download,
  Loader2,
  MessageSquare,
  Code2,
  Copy,
  Check,
  Terminal,
  Box,
  Layers,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Server,
  Database,
  HardDrive,
  Globe,
  Cpu,
  GitFork,
  FileCode,
} from "lucide-react"
import type { AuditReport } from "@/trigger/audit-architecture"
import type { CostReport } from "@/trigger/estimate-cost"
import type {
  AlternativesReport,
  AlternativeArchitecture,
} from "@/trigger/suggest-alternatives"
import type { ApiScaffoldResult } from "@/trigger/generate-api-scaffold"
import { LiveObject } from "@liveblocks/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useEventListener,
  useUpdateMyPresence,
  useFeedMessages,
  useCreateFeed,
  useCreateFeedMessage,
  useSelf,
  useStorage,
  useMutation,
} from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { AiStatusFeedMessageSchema, ChatFeedMessageSchema } from "@/types/tasks"
import { cn } from "@/lib/utils"

type IaCFormat = "docker-compose" | "terraform" | "kubernetes"

interface IaCResult {
  code: string
  format: IaCFormat
  filename: string
}

const FEED_ID = "ai-status-feed"
const CHAT_FEED_ID = "ai-chat"

const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CRASHED",
  "TIMED_OUT",
  "INTERRUPTED",
  "SYSTEM_ERROR",
  "INVALID_PAYLOAD",
  "EXPIRED",
  "ABORTED",
] as const

interface SpecItem {
  id: string
  filePath: string
  createdAt: string
}

function getFilename(filePath: string): string {
  const clean = filePath.split("?")[0]
  return clean.split("/").at(-1) ?? "spec.md"
}

function formatSpecDate(date: string): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface RunTrackerProps {
  runId: string
  publicToken: string
  onTerminal: (status: string, output: unknown) => void
}

function RunTracker({ runId, publicToken, onTerminal }: RunTrackerProps) {
  const { run } = useRealtimeRun(runId, { accessToken: publicToken })
  const firedRef = useRef(false)

  useEffect(() => {
    if (!run || firedRef.current) return
    if (!(TERMINAL_STATUSES as readonly string[]).includes(run.status)) return
    firedRef.current = true
    onTerminal(run.status, run.output)
  }, [run, onTerminal])

  return null
}

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  projectId: string
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

function formatTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function AiSidebar({ isOpen, onClose, roomId, projectId }: AiSidebarProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string>("")
  const [chatInput, setChatInput] = useState("")
  const [chatError, setChatError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null)
  const architectEndRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Spec state
  const [specs, setSpecs] = useState<SpecItem[]>([])
  const [specsLoading, setSpecsLoading] = useState(false)
  const [selectedSpec, setSelectedSpec] = useState<SpecItem | null>(null)
  const [specContent, setSpecContent] = useState<string | null>(null)
  const [specContentLoading, setSpecContentLoading] = useState(false)
  const [specModalOpen, setSpecModalOpen] = useState(false)
  const [isSpecGenerating, setIsSpecGenerating] = useState(false)
  const [specRunId, setSpecRunId] = useState<string | null>(null)
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null)

  // IaC state
  const [selectedIacFormats, setSelectedIacFormats] = useState<IaCFormat[]>([
    "docker-compose",
    "terraform",
    "kubernetes",
  ])
  const [isIacGenerating, setIsIacGenerating] = useState(false)
  const [iacRunId, setIacRunId] = useState<string | null>(null)
  const [iacPublicToken, setIacPublicToken] = useState<string | null>(null)
  const [iacResults, setIacResults] = useState<Partial<Record<IaCFormat, IaCResult>>>({})
  const [activeIacTab, setActiveIacTab] = useState<IaCFormat>("docker-compose")
  const [iacModalOpen, setIacModalOpen] = useState(false)
  const [iacCopied, setIacCopied] = useState(false)

  // Audit state
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditRunId, setAuditRunId] = useState<string | null>(null)
  const [auditPublicToken, setAuditPublicToken] = useState<string | null>(null)
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null)
  const [auditCategory, setAuditCategory] = useState<
    "all" | "security" | "reliability" | "scalability" | "compliance"
  >("all")

  // Cost state
  const [costProvider, setCostProvider] = useState<"aws" | "gcp" | "azure">("aws")
  const [costTier, setCostTier] = useState<"starter" | "growth" | "scale" | "enterprise">("growth")
  const [isCostEstimating, setIsCostEstimating] = useState(false)
  const [costRunId, setCostRunId] = useState<string | null>(null)
  const [costPublicToken, setCostPublicToken] = useState<string | null>(null)
  const [costReport, setCostReport] = useState<CostReport | null>(null)

  // Alternatives state
  const [isAlternativesGenerating, setIsAlternativesGenerating] = useState(false)
  const [alternativesRunId, setAlternativesRunId] = useState<string | null>(null)
  const [alternativesPublicToken, setAlternativesPublicToken] = useState<string | null>(null)
  const [alternativesReport, setAlternativesReport] = useState<AlternativesReport | null>(null)
  const [appliedAlternativeId, setAppliedAlternativeId] = useState<string | null>(null)

  // API Scaffold state
  const [apiFramework, setApiFramework] = useState<"nextjs" | "fastapi" | "express">("nextjs")
  const [isScaffoldGenerating, setIsScaffoldGenerating] = useState(false)
  const [scaffoldRunId, setScaffoldRunId] = useState<string | null>(null)
  const [scaffoldPublicToken, setScaffoldPublicToken] = useState<string | null>(null)
  const [scaffoldResult, setScaffoldResult] = useState<ApiScaffoldResult | null>(null)
  const [scaffoldModalOpen, setScaffoldModalOpen] = useState(false)
  const [scaffoldModalTab, setScaffoldModalTab] = useState<"openapi" | "routes">("openapi")
  const [scaffoldCopied, setScaffoldCopied] = useState(false)

  // Canvas storage for spec generation context
  // useStorage immutably serializes LiveMap as a plain readonly object, so use Object.values
  const nodesArray = useStorage((root) => {
    const m = root.flow?.nodes
    return m ? Object.values(m) : []
  })
  const edgesArray = useStorage((root) => {
    const m = root.flow?.edges
    return m ? Object.values(m) : []
  })

  const self = useSelf()
  const updateMyPresence = useUpdateMyPresence()
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const { messages: feedMessages } = useFeedMessages(FEED_ID)
  const { messages: chatFeedMessages } = useFeedMessages(CHAT_FEED_ID)

  // Ensure both feeds exist on mount
  useEffect(() => {
    createFeed(FEED_ID).catch(() => {})
    createFeed(CHAT_FEED_ID).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSpecs = useCallback(async () => {
    setSpecsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`)
      const data = res.ok ? ((await res.json()) as SpecItem[]) : []
      setSpecs(Array.isArray(data) ? data : [])
    } catch {
      setSpecs([])
    } finally {
      setSpecsLoading(false)
    }
  }, [projectId])

  // Fetch specs when sidebar opens
  useEffect(() => {
    if (!isOpen) return
    let isCancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/specs`)
        const data = res.ok ? ((await res.json()) as SpecItem[]) : []
        if (!isCancelled) {
          setSpecs(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!isCancelled) setSpecs([])
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [isOpen, projectId])

  const handleSpecRunTerminal = useCallback(
    (status: string) => {
      setIsSpecGenerating(false)
      setSpecRunId(null)
      setSpecPublicToken(null)
      if (status === "COMPLETED") fetchSpecs()
    },
    [fetchSpecs]
  )

  const handleRunTerminal = useCallback(
    (status: string, output: unknown) => {
      const isSuccess = status === "COMPLETED"
      const typedOutput = output as { summary?: string } | undefined
      const content = isSuccess
        ? (typedOutput?.summary ?? "Design applied to canvas.")
        : "Ghost AI encountered an error. Please try again."

      createFeedMessage(CHAT_FEED_ID, {
        sender: "Ghost AI",
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      }).catch(() => {})

      createFeedMessage(FEED_ID, {
        text: content,
        status: isSuccess ? "complete" : "error",
      }).catch(() => {})

      setIsLoading(false)
      setStatusText("")
      setRunId(null)
      setPublicToken(null)
      updateMyPresence({ thinking: false })
    },
    [createFeedMessage, updateMyPresence]
  )

  // Latest validated feed message for the status strip fallback
  const latestFeedMessage = (() => {
    if (!feedMessages?.length) return null
    const sorted = [...feedMessages].sort((a, b) => b.createdAt - a.createdAt)
    const parsed = AiStatusFeedMessageSchema.safeParse(sorted[0].data)
    return parsed.success ? parsed.data : null
  })()

  // Validated chat messages from the ai-chat feed, in chronological order
  const validatedChatMessages = (chatFeedMessages ?? [])
    .map((msg) => {
      const parsed = ChatFeedMessageSchema.safeParse(msg.data)
      if (!parsed.success) return null
      return { id: msg.id, createdAt: msg.createdAt, ...parsed.data }
    })
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
    .sort((a, b) => a.createdAt - b.createdAt)

  const handleGenerateSpec = useCallback(async () => {
    if (isSpecGenerating) return
    setIsSpecGenerating(true)

    const nodes = nodesArray ?? []
    const edges = edgesArray ?? []
    const chatHistory = validatedChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory, nodes, edges }),
      })
      if (!res.ok) throw new Error("Spec generation failed")
      const { runId: newSpecRunId } = (await res.json()) as { runId: string }

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newSpecRunId }),
      })
      if (!tokenRes.ok) throw new Error("Token request failed")
      const { token } = (await tokenRes.json()) as { token: string }

      setSpecRunId(newSpecRunId)
      setSpecPublicToken(token)
    } catch {
      setIsSpecGenerating(false)
    }
  }, [isSpecGenerating, roomId, nodesArray, edgesArray, validatedChatMessages])

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

  // Alternatives Handlers
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

  // API Scaffold Handlers
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
        }),
      })
      if (!res.ok) throw new Error("Scaffold request failed")
      const { runId: newScaffoldRunId } = (await res.json()) as { runId: string }

      const tokenRes = await fetch("/api/ai/scaffold/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newScaffoldRunId }),
      })
      if (!tokenRes.ok) throw new Error("Token request failed")
      const { token } = (await tokenRes.json()) as { token: string }

      setScaffoldRunId(newScaffoldRunId)
      setScaffoldPublicToken(token)
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

  // Receive broadcast status events for real-time strip text
  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return
    setStatusText(event.message)
  })

  // Scroll both tabs to bottom when messages update
  useEffect(() => {
    architectEndRef.current?.scrollIntoView({ behavior: "smooth" })
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [validatedChatMessages.length])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = "72px"
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput("")
    setIsLoading(true)
    updateMyPresence({ thinking: true })

    if (textareaRef.current) {
      textareaRef.current.style.height = "72px"
    }

    // Push user message to shared ai-chat feed
    createFeedMessage(CHAT_FEED_ID, {
      sender: self?.info?.name ?? "Unknown",
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }).catch(() => {})

    // Write initial status to ai-status-feed
    createFeedMessage(FEED_ID, {
      text: "Ghost AI is analyzing your request…",
      status: "start",
    }).catch(() => {})

    setStatusText("Ghost AI is analyzing your request…")

    try {
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId, projectId }),
      })

      if (!designRes.ok) throw new Error("Design request failed")

      const { runId: newRunId } = (await designRes.json()) as { runId: string }

      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      })

      if (!tokenRes.ok) throw new Error("Token request failed")

      const { token } = (await tokenRes.json()) as { token: string }

      setRunId(newRunId)
      setPublicToken(token)
    } catch {
      createFeedMessage(CHAT_FEED_ID, {
        sender: "Ghost AI",
        role: "assistant",
        content: "Failed to reach Ghost AI. Please try again.",
        timestamp: new Date().toISOString(),
      }).catch(() => {})

      createFeedMessage(FEED_ID, {
        text: "Ghost AI encountered an error.",
        status: "error",
      }).catch(() => {})

      setIsLoading(false)
      setStatusText("")
      updateMyPresence({ thinking: false })
    }
  }, [input, isLoading, roomId, projectId, updateMyPresence, createFeedMessage, self])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleChip = useCallback((chip: string) => {
    setInput(chip)
    if (textareaRef.current) {
      textareaRef.current.style.height = "72px"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
      textareaRef.current.focus()
    }
  }, [])

  const handleChatInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value)
    const ta = e.target
    ta.style.height = "72px"
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [])

  const handleChatSend = useCallback(async () => {
    const text = chatInput.trim()
    if (!text) return

    setChatError(null)

    try {
      await createFeedMessage(CHAT_FEED_ID, {
        sender: self?.info?.name ?? "Unknown",
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      })
      setChatInput("")
      if (chatTextareaRef.current) {
        chatTextareaRef.current.style.height = "72px"
      }
    } catch {
      setChatError("Failed to send message. Please try again.")
    }
  }, [chatInput, createFeedMessage, self])

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleChatSend()
      }
    },
    [handleChatSend]
  )

  const handleSpecClick = useCallback(
    async (spec: SpecItem) => {
      setSelectedSpec(spec)
      setSpecContent(null)
      setSpecContentLoading(true)
      setSpecModalOpen(true)

      try {
        const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}`)
        if (!res.ok) throw new Error("Failed to fetch spec")
        const text = await res.text()
        setSpecContent(text)
      } catch {
        setSpecContent(null)
      } finally {
        setSpecContentLoading(false)
      }
    },
    [projectId]
  )

  const handleSpecDownload = useCallback(
    (specId: string) => {
      const a = document.createElement("a")
      a.href = `/api/projects/${projectId}/specs/${specId}/download`
      a.download = `spec-${specId}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    [projectId]
  )

  const handleModalClose = useCallback(() => {
    setSpecModalOpen(false)
    setSelectedSpec(null)
    setSpecContent(null)
  }, [])

  const activeStatusText = statusText || (isLoading ? latestFeedMessage?.text ?? "" : "")

  return (
    <>
      {runId && publicToken && (
        <RunTracker
          runId={runId}
          publicToken={publicToken}
          onTerminal={handleRunTerminal}
        />
      )}
      {specRunId && specPublicToken && (
        <RunTracker
          runId={specRunId}
          publicToken={specPublicToken}
          onTerminal={handleSpecRunTerminal}
        />
      )}
      {iacRunId && iacPublicToken && (
        <RunTracker
          runId={iacRunId}
          publicToken={iacPublicToken}
          onTerminal={handleIacRunTerminal}
        />
      )}
      {auditRunId && auditPublicToken && (
        <RunTracker
          runId={auditRunId}
          publicToken={auditPublicToken}
          onTerminal={handleAuditRunTerminal}
        />
      )}
      {costRunId && costPublicToken && (
        <RunTracker
          runId={costRunId}
          publicToken={costPublicToken}
          onTerminal={handleCostRunTerminal}
        />
      )}
      {alternativesRunId && alternativesPublicToken && (
        <RunTracker
          runId={alternativesRunId}
          publicToken={alternativesPublicToken}
          onTerminal={handleAlternativesRunTerminal}
        />
      )}
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

      {/* IaC preview modal */}
      <Dialog open={iacModalOpen} onOpenChange={(open) => { if (!open) setIacModalOpen(false) }}>
        <DialogContent
          showCloseButton
          className="sm:max-w-4xl max-w-4xl border-border-default bg-bg-surface p-6"
        >
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-accent-ai-text" />
                <DialogTitle className="text-sm font-medium text-text-primary">
                  Infrastructure as Code
                </DialogTitle>
                <span className="rounded-full bg-accent-ai/15 px-2 py-0.5 text-[10px] font-medium text-accent-ai-text uppercase">
                  {Object.keys(iacResults).length} generated
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Format Tabs Switcher */}
          <div className="flex gap-2 border-b border-border-subtle pb-2 text-xs">
            {(["docker-compose", "terraform", "kubernetes"] as const).map((fmt) => {
              const res = iacResults[fmt]
              if (!res) return null
              const label =
                fmt === "docker-compose"
                  ? "docker-compose.yml"
                  : fmt === "terraform"
                  ? "main.tf"
                  : "k8s.yaml"
              const icon =
                fmt === "docker-compose" ? "🐳" : fmt === "terraform" ? "🌐" : "☸️"

              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setActiveIacTab(fmt)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
                    activeIacTab === fmt
                      ? "bg-accent-ai text-white shadow-xs"
                      : "bg-bg-subtle text-text-muted hover:text-text-primary"
                  )}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className="rounded px-1 text-[9px] uppercase opacity-80">
                    {fmt === "docker-compose" ? "Compose" : fmt === "terraform" ? "AWS" : "K8s"}
                  </span>
                </button>
              )
            })}
          </div>

          <ScrollArea className="max-h-[60vh] rounded-xl border border-border-subtle bg-bg-elevated font-mono text-xs">
            <pre className="p-4 text-text-primary overflow-x-auto leading-relaxed whitespace-pre font-mono">
              <code>{activeIacResult?.code || "No code available."}</code>
            </pre>
          </ScrollArea>

          <div className="flex items-center justify-between border-t border-border-default pt-3">
            <span className="text-xs text-text-muted">
              Viewing <code className="font-mono text-accent-ai-text">{activeIacResult?.filename}</code>
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyIac()}
                className="h-7 gap-1.5 rounded-lg border-border-subtle px-3 text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
              >
                {iacCopied ? <Check className="h-3 w-3 text-state-success" /> : <Copy className="h-3 w-3" />}
                {iacCopied ? "Copied!" : `Copy ${activeIacResult?.filename ?? "Code"}`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadIac()}
                className="h-7 gap-1.5 rounded-lg border-border-subtle px-3 text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
              >
                <Download className="h-3 w-3" />
                Download {activeIacResult?.filename ?? "File"}
              </Button>
              {Object.keys(iacResults).length > 1 && (
                <Button
                  size="sm"
                  onClick={handleDownloadAllIac}
                  className="h-7 gap-1.5 rounded-lg bg-accent-ai px-3 text-xs text-white hover:bg-accent-ai/80"
                >
                  <Download className="h-3 w-3" />
                  Download All ({Object.keys(iacResults).length} files)
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spec preview modal */}
      <Dialog open={specModalOpen} onOpenChange={(open) => { if (!open) handleModalClose() }}>
        <DialogContent
          showCloseButton
          className="sm:max-w-3xl max-w-3xl border-border-default bg-bg-surface p-6"
        >
          <DialogHeader>
            <DialogTitle className="pr-6 text-sm font-medium text-text-primary">
              {selectedSpec ? getFilename(selectedSpec.filePath) : "Spec Preview"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] rounded-xl border border-border-subtle bg-bg-elevated">
            <div className="p-4">
              {specContentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : specContent ? (
                <div
                  className={cn(
                    "text-sm text-text-secondary leading-relaxed",
                    "[&_h1]:text-base [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mb-3 [&_h1]:mt-0",
                    "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mb-2 [&_h2]:mt-4",
                    "[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-text-secondary [&_h3]:mb-1.5 [&_h3]:mt-3",
                    "[&_p]:mb-2 [&_p]:leading-relaxed",
                    "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2",
                    "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2",
                    "[&_li]:mb-1",
                    "[&_code]:font-mono [&_code]:text-xs [&_code]:bg-bg-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent-ai-text",
                    "[&_pre]:bg-bg-subtle [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:mb-2 [&_pre]:overflow-x-auto",
                    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                    "[&_strong]:font-semibold [&_strong]:text-text-primary",
                    "[&_blockquote]:border-l-2 [&_blockquote]:border-border-subtle [&_blockquote]:pl-3 [&_blockquote]:text-text-muted [&_blockquote]:italic"
                  )}
                >
                  <ReactMarkdown>{specContent}</ReactMarkdown>
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-text-muted">
                  Failed to load spec content.
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end border-t border-border-default pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedSpec && handleSpecDownload(selectedSpec.id)}
              className="h-7 gap-1.5 rounded-lg border-border-subtle px-3 text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    <aside
      className={cn(
        "fixed inset-y-3 right-3 top-15 z-40 hidden w-96 md:w-[440px] flex-col rounded-3xl border border-border-subtle bg-bg-surface/95 backdrop-blur-xl transition-transform duration-200 md:flex shadow-2xl",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border-default px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15">
          <Bot className="h-4 w-4 text-accent-ai-text" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">AI Workspace</p>
          <p className="text-xs text-text-muted">Collaborate with Ghost AI</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1 rounded-full bg-accent-ai/15 px-2 py-0.5 text-[10px] text-accent-ai-text">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            <span>Working</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative mx-4 mt-3 shrink-0">
          <TabsList
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY * 0.8
              }
            }}
            className="flex h-auto w-full shrink-0 overflow-x-auto rounded-xl bg-bg-subtle p-1 scroll-smooth gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabsTrigger
              value="architect"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
            >
              <Bot className="h-3.5 w-3.5 mr-1 text-accent-ai-text group-data-active:text-white" />
              <span>Architect</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              <span>Specs</span>
            </TabsTrigger>
            <TabsTrigger
              value="iac"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
            >
              <Code2 className="h-3.5 w-3.5 mr-1" />
              <span>IaC</span>
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
            >
              <ShieldAlert className="h-3.5 w-3.5 mr-1" />
              <span>Audit</span>
            </TabsTrigger>
            <TabsTrigger
              value="cost"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
            >
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              <span>Cost</span>
            </TabsTrigger>
            <TabsTrigger
              value="alternatives"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
            >
              <GitFork className="h-3.5 w-3.5 mr-1" />
              <span>Diff</span>
            </TabsTrigger>
            <TabsTrigger
              value="api"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
            >
              <Terminal className="h-3.5 w-3.5 mr-1" />
              <span>API</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
              <div className="px-4 pt-3 pb-2">
                {validatedChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center gap-5 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/15">
                      <Bot className="h-6 w-6 text-accent-ai-text" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Ghost AI Architect
                      </p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        Describe your system and I&apos;ll design the architecture on the canvas.
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2">
                      {STARTER_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleChip(chip)}
                          className="w-full rounded-full bg-bg-subtle px-4 py-2 text-left text-xs text-accent-ai-text transition-colors hover:bg-border-default"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-2">
                    {validatedChatMessages.map((msg) =>
                      msg.role === "assistant" ? (
                        <div key={msg.id} className="flex justify-start gap-2">
                          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-ai/15">
                            <Bot className="h-3 w-3 text-accent-ai-text" />
                          </div>
                          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm text-accent-ai-text">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div key={msg.id} className="flex justify-end">
                          <div
                            className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium text-white"
                            style={{ backgroundColor: "#62C073" }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      )
                    )}
                    <div ref={architectEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Status strip — only visible while a run is active */}
            {isLoading && activeStatusText && (
              <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-accent-ai/20 bg-accent-ai/10 px-3 py-2 text-xs text-accent-ai-text">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                <span className="truncate">{activeStatusText}</span>
              </div>
            )}

            {/* Input area */}
            <div className="shrink-0 border-t border-border-default p-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-3">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your system…"
                  disabled={isLoading}
                  style={{ height: "72px", maxHeight: "160px" }}
                  className="resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm text-text-primary shadow-none placeholder:text-text-faint focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-faint">Shift+Enter for newline</span>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="h-7 gap-1.5 rounded-lg px-3 text-xs text-white hover:opacity-90 disabled:opacity-40"
                    style={
                      !isLoading && input.trim()
                        ? { backgroundColor: "#62C073" }
                        : undefined
                    }
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    {isLoading ? "Thinking…" : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
              <div className="px-4 pt-3 pb-2">
                {validatedChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-subtle">
                      <MessageSquare className="h-5 w-5 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Room Chat</p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-2">
                    {validatedChatMessages.map((msg) => {
                      const isMe =
                        msg.role === "user" && msg.sender === self?.info?.name
                      const isAI = msg.role === "assistant"
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col gap-0.5",
                            isMe ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1.5 text-[10px] text-text-faint",
                              isMe && "flex-row-reverse"
                            )}
                          >
                            <span className="font-medium text-text-muted">
                              {isAI ? "Ghost AI" : msg.sender}
                            </span>
                            <span>{formatTime(msg.createdAt)}</span>
                          </div>
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-xs text-text-primary",
                              isMe
                                ? "rounded-br-sm font-medium text-white"
                                : isAI
                                  ? "rounded-bl-sm border border-border-subtle bg-bg-elevated text-accent-ai-text"
                                  : "rounded-bl-sm border border-border-subtle bg-bg-elevated"
                            )}
                            style={isMe ? { backgroundColor: "#62C073" } : undefined}
                          >
                            {msg.content}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Error state */}
            {chatError && (
              <div className="mx-3 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {chatError}
              </div>
            )}

            {/* Input area */}
            <div className="shrink-0 border-t border-border-default p-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-3">
                <Textarea
                  ref={chatTextareaRef}
                  value={chatInput}
                  onChange={handleChatInputChange}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Send a message…"
                  style={{ height: "72px", maxHeight: "160px" }}
                  className="resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm text-text-primary shadow-none placeholder:text-text-faint focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-faint">Shift+Enter for newline</span>
                  <Button
                    size="sm"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                    className="h-7 gap-1.5 rounded-lg bg-accent-ai px-3 text-xs text-white hover:bg-accent-ai/80 disabled:opacity-40"
                  >
                    <Send className="h-3 w-3" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-3 p-4">
            <Button
              onClick={handleGenerateSpec}
              disabled={isSpecGenerating}
              className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/80 disabled:opacity-60"
            >
              {isSpecGenerating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate Spec"
              )}
            </Button>

            {specsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : specs.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <FileText className="h-8 w-8 text-text-faint" />
                <p className="text-xs text-text-muted">No specs yet. Generate one above.</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 pr-1">
                  {specs.map((spec) => (
                    <div
                      key={spec.id}
                      className="group flex cursor-pointer items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 transition-colors hover:border-border-default"
                      onClick={() => handleSpecClick(spec)}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-subtle">
                        <FileText className="h-3.5 w-3.5 text-text-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-text-primary">
                          {getFilename(spec.filePath)}
                        </p>
                        <p className="text-[10px] text-text-faint">
                          {formatSpecDate(spec.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSpecDownload(spec.id)
                        }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-text-faint opacity-0 transition-opacity hover:bg-bg-subtle hover:text-text-primary group-hover:opacity-100"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        {/* IaC Tab */}
        <TabsContent value="iac" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-3 p-4 overflow-y-auto">
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
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-3 p-4">
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
        </TabsContent>

        {/* Cost Tab */}
        <TabsContent value="cost" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-3 p-4">
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
        </TabsContent>

        {/* Alternatives (Diff) Tab */}
        <TabsContent value="alternatives" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-3 p-4">
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
        </TabsContent>

        {/* API Scaffold Tab */}
        <TabsContent value="api" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-3 p-4">
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
        </TabsContent>
      </Tabs>
    </aside>
    </>
  )
}
