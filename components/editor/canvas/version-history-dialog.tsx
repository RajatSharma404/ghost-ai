"use client"

import { useState, useEffect } from "react"
import {
  History,
  Plus,
  RotateCcw,
  Clock,
  Layers,
  User,
  Check,
  Loader2,
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

interface SnapshotItem {
  id: string
  name: string
  description?: string | null
  blobUrl: string
  nodeCount: number
  edgeCount: number
  createdByName?: string | null
  createdAt: string
}

interface VersionHistoryDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  currentNodes: CanvasNode[]
  currentEdges: CanvasEdge[]
  onRestoreSnapshot: (nodes: CanvasNode[], edges: CanvasEdge[]) => void
}

export function VersionHistoryDialog({
  projectId,
  open,
  onOpenChange,
  currentNodes,
  currentEdges,
  onRestoreSnapshot,
}: VersionHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-xl border-border-default bg-bg-surface p-0 overflow-hidden"
      >
        {open && (
          <VersionHistoryDialogContent
            projectId={projectId}
            currentNodes={currentNodes}
            currentEdges={currentEdges}
            onRestoreSnapshot={onRestoreSnapshot}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function VersionHistoryDialogContent({
  projectId,
  currentNodes,
  currentEdges,
  onRestoreSnapshot,
  onClose,
}: {
  projectId: string
  currentNodes: CanvasNode[]
  currentEdges: CanvasEdge[]
  onRestoreSnapshot: (nodes: CanvasNode[], edges: CanvasEdge[]) => void
  onClose: () => void
}) {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [snapshotName, setSnapshotName] = useState("")
  const [snapshotDesc, setSnapshotDesc] = useState("")
  const [restoredSuccess, setRestoredSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/projects/${projectId}/snapshots`)
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.snapshots)) {
          setSnapshots(data.snapshots)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [projectId])

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!snapshotName.trim()) return

    setCreating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: snapshotName.trim(),
          description: snapshotDesc.trim() || undefined,
          nodes: currentNodes,
          edges: currentEdges,
        }),
      })
      const data = await res.json()
      if (data.snapshot) {
        setSnapshots((prev) => [data.snapshot, ...prev])
        setSnapshotName("")
        setSnapshotDesc("")
        setShowCreateForm(false)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (snapshot: SnapshotItem) => {
    setRestoringId(snapshot.id)
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots/${snapshot.id}/restore`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.canvas && Array.isArray(data.canvas.nodes) && Array.isArray(data.canvas.edges)) {
        onRestoreSnapshot(data.canvas.nodes, data.canvas.edges)
        setRestoredSuccess(snapshot.id)
        setTimeout(() => {
          setRestoredSuccess(null)
          onClose()
        }, 1200)
      }
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <>
      <DialogHeader className="p-4 pb-3 border-b border-border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-ai/15 text-accent-ai-text">
              <History className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-text-primary">
                Version History & Milestones
              </DialogTitle>
              <p className="text-xs text-text-muted">
                Save named diagram versions and time-travel restore previous architectures
              </p>
            </div>
          </div>

          {!showCreateForm && (
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="h-7 gap-1 bg-accent-ai text-xs text-white hover:bg-accent-ai/80"
            >
              <Plus className="h-3 w-3" />
              <span>Save Milestone</span>
            </Button>
          )}
        </div>
      </DialogHeader>

      {/* Create Milestone Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateSnapshot} className="p-4 border-b border-border-subtle bg-bg-elevated/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">New Milestone Snapshot</span>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-text-muted">Milestone Name</label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. v1.0 Production Architecture"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-xs text-text-primary outline-none focus:border-accent-ai"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-text-muted">Notes / Changes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Added Redis cache and decoupled payment microservice"
              value={snapshotDesc}
              onChange={(e) => setSnapshotDesc(e.target.value)}
              className="mt-1 h-8 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-xs text-text-primary outline-none focus:border-accent-ai"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-text-muted">
              Captures {currentNodes.length} nodes & {currentEdges.length} connections
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!snapshotName.trim() || creating}
              className="h-7 gap-1.5 bg-accent-ai text-xs text-white hover:bg-accent-ai/80"
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              <span>{creating ? "Saving…" : "Save Snapshot"}</span>
            </Button>
          </div>
        </form>
      )}

      {/* Snapshots Timeline */}
      <ScrollArea className="max-h-[55vh] p-4">
        {loading && snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-accent-ai-text mb-2" />
            <p className="text-xs">Loading version history…</p>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
            <History className="h-8 w-8 text-text-faint mb-2" />
            <p className="text-xs font-medium text-text-secondary">No milestone snapshots yet</p>
            <p className="text-[11px] text-text-muted mt-1">
              Click &quot;Save Milestone&quot; to bookmark the current state of your diagram.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {snapshots.map((s) => {
              const isRestoring = restoringId === s.id
              const isRestored = restoredSuccess === s.id

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-elevated/70 p-3.5 transition-colors hover:border-border-default"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {s.name}
                      </span>
                      <span className="flex items-center gap-1 rounded-full border border-border-subtle bg-bg-surface px-2 py-0.5 text-[10px] text-text-muted">
                        <Layers className="h-2.5 w-2.5" />
                        {s.nodeCount} nodes • {s.edgeCount} edges
                      </span>
                    </div>

                    {s.description && (
                      <p className="text-xs text-text-muted truncate">{s.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-text-faint pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {s.createdByName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {s.createdByName}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(s)}
                    disabled={isRestoring || Boolean(restoredSuccess)}
                    className="h-8 gap-1.5 border-border-subtle text-xs hover:border-accent-ai/50 hover:bg-accent-ai/10 hover:text-accent-ai-text shrink-0"
                  >
                    {isRestored ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-state-success" />
                        <span className="text-state-success font-medium">Restored!</span>
                      </>
                    ) : isRestoring ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Restoring…</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </>
  )
}
