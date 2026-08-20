"use client"

import { useState, useCallback } from "react"
import {
  X,
  Plus,
  Trash2,
  Server,
  Network,
  Cpu,
  Key,
  Shield,
  Users,
  Check,
} from "lucide-react"
import type { NodeMetadata, NodeEnvVar } from "@/types/canvas"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface NodeMetadataDrawerProps {
  open: boolean
  onClose: () => void
  nodeId: string | null
  nodeLabel: string
  metadata?: NodeMetadata
  onSave: (metadata: NodeMetadata) => void
}

const ROLES = [
  "API Gateway",
  "Microservice",
  "Database",
  "Cache / In-Memory",
  "Message Queue",
  "Background Worker",
  "Ingress / CDN",
  "Authentication / IAM",
  "Storage / Object Store",
] as const

const PROTOCOLS = ["HTTP/REST", "gRPC", "WebSocket", "GraphQL", "TCP", "UDP"] as const

export function NodeMetadataDrawer({
  open,
  onClose,
  nodeId,
  nodeLabel,
  metadata,
  onSave,
}: NodeMetadataDrawerProps) {
  if (!open || !nodeId) return null

  return (
    <NodeMetadataDrawerContent
      key={nodeId}
      onClose={onClose}
      nodeLabel={nodeLabel}
      metadata={metadata}
      onSave={onSave}
    />
  )
}

function NodeMetadataDrawerContent({
  onClose,
  nodeLabel,
  metadata,
  onSave,
}: {
  onClose: () => void
  nodeLabel: string
  metadata?: NodeMetadata
  onSave: (metadata: NodeMetadata) => void
}) {
  const [description, setDescription] = useState(metadata?.description ?? "")
  const [role, setRole] = useState(metadata?.role ?? "Microservice")
  const [port, setPort] = useState(metadata?.port ?? "")
  const [protocol, setProtocol] = useState(metadata?.protocol ?? "HTTP/REST")
  const [healthCheckPath, setHealthCheckPath] = useState(metadata?.healthCheckPath ?? "")
  const [language, setLanguage] = useState(metadata?.language ?? "")
  const [techStack, setTechStack] = useState(metadata?.techStack ?? "")
  const [envVars, setEnvVars] = useState<NodeEnvVar[]>(metadata?.envVars ?? [])
  const [slaLatency, setSlaLatency] = useState(metadata?.slaLatency ?? "")
  const [maxThroughput, setMaxThroughput] = useState(metadata?.maxThroughput ?? "")
  const [replicas, setReplicas] = useState(metadata?.replicas ?? "")
  const [ownerTeam, setOwnerTeam] = useState(metadata?.ownerTeam ?? "")
  const [maintainer, setMaintainer] = useState(metadata?.maintainer ?? "")
  const [repoUrl, setRepoUrl] = useState(metadata?.repoUrl ?? "")
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleAddEnvVar = useCallback(() => {
    setEnvVars((prev) => [...prev, { key: "", value: "" }])
  }, [])

  const handleUpdateEnvVar = useCallback(
    (index: number, field: "key" | "value", val: string) => {
      setEnvVars((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: val }
        return next
      })
    },
    []
  )

  const handleRemoveEnvVar = useCallback((index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = useCallback(() => {
    const newMeta: NodeMetadata = {
      description: description.trim() || undefined,
      role: role || undefined,
      port: port.trim() || undefined,
      protocol: protocol || undefined,
      healthCheckPath: healthCheckPath.trim() || undefined,
      language: language.trim() || undefined,
      techStack: techStack.trim() || undefined,
      envVars: envVars.filter((ev) => ev.key.trim() !== ""),
      slaLatency: slaLatency.trim() || undefined,
      maxThroughput: maxThroughput.trim() || undefined,
      replicas: replicas.trim() || undefined,
      ownerTeam: ownerTeam.trim() || undefined,
      maintainer: maintainer.trim() || undefined,
      repoUrl: repoUrl.trim() || undefined,
    }
    onSave(newMeta)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
  }, [
    description,
    role,
    port,
    protocol,
    healthCheckPath,
    language,
    techStack,
    envVars,
    slaLatency,
    maxThroughput,
    replicas,
    ownerTeam,
    maintainer,
    repoUrl,
    onSave,
  ])

  return (
    <aside
      className={cn(
        "fixed inset-y-3 right-3 top-15 z-40 flex w-96 flex-col rounded-3xl border border-border-subtle bg-bg-surface/95 shadow-2xl backdrop-blur-xl transition-all duration-200"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-default px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-ai/15 text-accent-ai-text">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {nodeLabel || "Component Config"}
            </h3>
            <p className="text-[10px] text-text-muted">Node Metadata & Specs</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <ScrollArea className="flex-1 p-5">
        <div className="space-y-6 text-xs pr-2">
          {/* Section 1: Overview & Role */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Cpu className="h-3.5 w-3.5 text-accent-ai-text" />
              <span>Role & Description</span>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-text-muted">Role / Tier</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 text-xs text-text-primary outline-none focus:border-accent-ai"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-text-muted">Description</label>
              <textarea
                rows={2}
                placeholder="Core responsibilities, domain boundaries, and dependencies..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border-subtle bg-bg-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent-ai placeholder:text-text-faint"
              />
            </div>
          </div>

          {/* Section 2: Networking & Ports */}
          <div className="space-y-3 border-t border-border-default pt-4">
            <div className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Network className="h-3.5 w-3.5 text-accent-primary" />
              <span>Networking & Ports</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">Port</label>
                <input
                  type="text"
                  placeholder="e.g. 8080, 5432"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 text-xs font-mono text-text-primary outline-none focus:border-accent-ai placeholder:text-text-faint"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">Protocol</label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-2.5 text-xs text-text-primary outline-none focus:border-accent-ai"
                >
                  {PROTOCOLS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-text-muted">Health Check Path</label>
              <input
                type="text"
                placeholder="/api/health or /ready"
                value={healthCheckPath}
                onChange={(e) => setHealthCheckPath(e.target.value)}
                className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 text-xs font-mono text-text-primary outline-none focus:border-accent-ai placeholder:text-text-faint"
              />
            </div>
          </div>

          {/* Section 3: Tech Stack */}
          <div className="space-y-3 border-t border-border-default pt-4">
            <div className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Server className="h-3.5 w-3.5 text-state-warning" />
              <span>Tech Stack & Runtimes</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">Language</label>
                <input
                  type="text"
                  placeholder="TypeScript, Python, Go"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 text-xs text-text-primary outline-none focus:border-accent-ai placeholder:text-text-faint"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">Framework</label>
                <input
                  type="text"
                  placeholder="Next.js, FastAPI, Express"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 text-xs text-text-primary outline-none focus:border-accent-ai placeholder:text-text-faint"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Environment Variables */}
          <div className="space-y-3 border-t border-border-default pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                <Key className="h-3.5 w-3.5 text-emerald-400" />
                <span>Environment Variables ({envVars.length})</span>
              </div>
              <button
                type="button"
                onClick={handleAddEnvVar}
                className="flex items-center gap-1 text-[11px] font-medium text-accent-ai-text hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>Add Var</span>
              </button>
            </div>

            {envVars.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">No environment variables configured.</p>
            ) : (
              <div className="space-y-2">
                {envVars.map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="KEY (e.g. DB_URL)"
                      value={ev.key}
                      onChange={(e) => handleUpdateEnvVar(idx, "key", e.target.value)}
                      className="h-7 flex-1 rounded-lg border border-border-subtle bg-bg-elevated px-2 font-mono text-[10px] text-text-primary outline-none focus:border-accent-ai"
                    />
                    <input
                      type="text"
                      placeholder="VALUE"
                      value={ev.value}
                      onChange={(e) => handleUpdateEnvVar(idx, "value", e.target.value)}
                      className="h-7 flex-1 rounded-lg border border-border-subtle bg-bg-elevated px-2 font-mono text-[10px] text-text-secondary outline-none focus:border-accent-ai"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveEnvVar(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: SLA & Scaling */}
          <div className="space-y-3 border-t border-border-default pt-4">
            <div className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Shield className="h-3.5 w-3.5 text-rose-400" />
              <span>SLA & Capacity</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">P99 SLA</label>
                <input
                  type="text"
                  placeholder="< 25ms"
                  value={slaLatency}
                  onChange={(e) => setSlaLatency(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-2.5 text-xs text-text-primary outline-none focus:border-accent-ai"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">Max RPS</label>
                <input
                  type="text"
                  placeholder="5k rps"
                  value={maxThroughput}
                  onChange={(e) => setMaxThroughput(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-2.5 text-xs text-text-primary outline-none focus:border-accent-ai"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">Replicas</label>
                <input
                  type="text"
                  placeholder="3x"
                  value={replicas}
                  onChange={(e) => setReplicas(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-2.5 text-xs text-text-primary outline-none focus:border-accent-ai"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Ownership & Team */}
          <div className="space-y-3 border-t border-border-default pt-4">
            <div className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Users className="h-3.5 w-3.5 text-accent-ai-text" />
              <span>Team & Repository</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">Owner Team</label>
                <input
                  type="text"
                  placeholder="#core-platform"
                  value={ownerTeam}
                  onChange={(e) => setOwnerTeam(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 text-xs text-text-primary outline-none focus:border-accent-ai"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-text-muted">Maintainer</label>
                <input
                  type="text"
                  placeholder="alex@company.com"
                  value={maintainer}
                  onChange={(e) => setMaintainer(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 text-xs text-text-primary outline-none focus:border-accent-ai"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-text-muted">GitHub Repository</label>
              <input
                type="text"
                placeholder="https://github.com/org/service"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 text-xs text-text-primary outline-none focus:border-accent-ai"
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border-default bg-bg-subtle/50 px-5 py-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          className="h-8 border-border-subtle text-xs"
        >
          Close
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="h-8 gap-1.5 bg-accent-ai px-4 text-xs text-white hover:bg-accent-ai/80"
        >
          {savedSuccess ? <Check className="h-3.5 w-3.5 text-state-success" /> : null}
          <span>{savedSuccess ? "Saved!" : "Save Changes"}</span>
        </Button>
      </div>
    </aside>
  )
}
