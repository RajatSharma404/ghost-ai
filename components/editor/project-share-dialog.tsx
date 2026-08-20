"use client"

import { useState, useEffect, useCallback } from "react"
import { Mail, Link2, Shield, Trash2, Globe, Code2, Check, Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useProjectShare,
  type ProjectSharePerson,
} from "@/hooks/use-project-share"
import { cn } from "@/lib/utils"

interface ProjectShareDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getInitials(person: ProjectSharePerson) {
  const source = person.displayName || person.email || "?"
  const parts = source.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("")
}

function CollaboratorAvatar({ person }: { person: ProjectSharePerson }) {
  if (person.avatarUrl) {
    return (
      <div
        role="img"
        aria-label={person.displayName}
        className="h-10 w-10 rounded-2xl border border-border-subtle bg-cover bg-center"
        style={{ backgroundImage: `url(${person.avatarUrl})` }}
      />
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle bg-bg-elevated text-xs font-medium text-text-secondary">
      {getInitials(person)}
    </div>
  )
}

function CollaboratorRow({
  person,
  canManage,
  removing,
  onRemove,
}: {
  person: ProjectSharePerson
  canManage: boolean
  removing: boolean
  onRemove?: (email: string) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-elevated/70 px-3 py-3">
      <CollaboratorAvatar person={person} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-text-primary">
            {person.displayName}
          </p>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em]",
              person.role === "owner"
                ? "border-accent-primary/30 bg-accent-primary-dim text-accent-primary"
                : "border-border-subtle bg-bg-subtle text-text-faint"
            )}
          >
            {person.role}
          </span>
        </div>
        {person.email ? (
          <p className="truncate text-xs text-text-muted">{person.email}</p>
        ) : null}
      </div>

      {canManage && person.role === "collaborator" && person.email && onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(person.email!)}
          disabled={removing}
        >
          <Trash2 className="h-4 w-4 text-state-error" />
          <span className="sr-only">Remove collaborator</span>
        </Button>
      ) : null}
    </div>
  )
}

export function ProjectShareDialog({
  projectId,
  open,
  onOpenChange,
}: ProjectShareDialogProps) {
  const {
    data,
    inviteEmail,
    loading,
    submitting,
    removingEmail,
    error,
    copied,
    setInviteEmail,
    invite,
    remove,
    copyLink,
  } = useProjectShare(projectId, open)

  const [isPublic, setIsPublic] = useState(false)
  const [togglingPublic, setTogglingPublic] = useState(false)
  const [copiedPublic, setCopiedPublic] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  const canManage = data?.canManage ?? false
  const people = data ? [data.owner, ...data.collaborators] : []

  // Load public share status
  useEffect(() => {
    if (!open) return
    let active = true
    fetch(`/api/projects/${projectId}/public-share`)
      .then((res) => res.json())
      .then((res) => {
        if (active && typeof res.isPublic === "boolean") {
          setIsPublic(res.isPublic)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [open, projectId])

  const handleTogglePublic = useCallback(async () => {
    setTogglingPublic(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/public-share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      })
      const body = await res.json()
      if (typeof body.isPublic === "boolean") {
        setIsPublic(body.isPublic)
      }
    } finally {
      setTogglingPublic(false)
    }
  }, [projectId, isPublic])

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const publicShareUrl = `${origin}/share/${projectId}`
  const embedCode = `<iframe src="${origin}/embed/${projectId}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`

  const handleCopyPublic = () => {
    navigator.clipboard.writeText(publicShareUrl)
    setCopiedPublic(true)
    setTimeout(() => setCopiedPublic(false), 2000)
  }

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-0 rounded-3xl border border-border-subtle bg-bg-surface p-0 text-text-primary sm:max-w-xl">
        <DialogHeader className="border-b border-border-default px-6 py-5">
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription className="text-text-muted">
            {canManage
              ? "Invite collaborators, generate public share links, and embed in docs."
              : "You can view who has access to this workspace."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Section 1: Public View-Only & Embed Link */}
          {canManage && (
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-primary/15 text-accent-primary">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Public View-Only Access</p>
                    <p className="text-xs text-text-muted">
                      Allow anyone with the link or embed to view the diagram
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePublic}
                  disabled={togglingPublic}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    isPublic ? "bg-accent-primary" : "bg-bg-subtle"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                      isPublic ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {isPublic && (
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={publicShareUrl}
                      className="h-8 flex-1 rounded-xl border border-border-subtle bg-bg-surface px-3 font-mono text-xs text-text-secondary outline-none"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPublic}
                      className="h-8 gap-1.5 border-border-subtle text-xs"
                    >
                      {copiedPublic ? <Check className="h-3 w-3 text-state-success" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedPublic ? "Copied!" : "Copy Link"}</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-text-muted">Embed in Notion, Confluence, or Web</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyEmbed}
                      className="h-7 gap-1.5 text-[11px] text-accent-ai-text hover:text-accent-ai-text hover:bg-accent-ai/10"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>{copiedEmbed ? "Copied Embed Code!" : "Copy <iframe> Embed"}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Workspace Direct Link */}
          {canManage ? (
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">Collaborator link</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    Direct studio link for invited team members.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={copied ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={copyLink}
                >
                  <Link2 className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Section 3: Invite Form */}
          {canManage ? (
            <form
              className="rounded-2xl border border-border-subtle bg-bg-elevated/60 p-4"
              onSubmit={(event) => {
                event.preventDefault()
                void invite()
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3">
                  <Mail className="h-4 w-4 text-text-faint" />
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="teammate@company.com"
                    className="border-0 bg-transparent px-0 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                  />
                </div>
                <Button type="submit" size="sm" disabled={!inviteEmail.trim() || submitting}>
                  {submitting ? "Inviting…" : "Invite"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated/60 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-2">
                  <Shield className="h-4 w-4 text-text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Read-only access</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    The project owner controls invitations and removals for this workspace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: People list */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">People with access</p>
              {data ? (
                <p className="text-xs text-text-faint">{people.length} total</p>
              ) : null}
            </div>

            {loading && !data ? (
              <div className="rounded-2xl border border-border-subtle bg-bg-elevated/40 px-4 py-6 text-sm text-text-muted">
                Loading access list…
              </div>
            ) : people.length > 0 ? (
              <div className="flex flex-col gap-3">
                {people.map((person) => (
                  <CollaboratorRow
                    key={`${person.role}-${person.email ?? person.displayName}`}
                    person={person}
                    canManage={canManage}
                    removing={removingEmail === person.email}
                    onRemove={remove}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border-subtle bg-bg-elevated/40 px-4 py-6 text-sm text-text-muted">
                No collaborators yet.
              </div>
            )}
          </div>

          {error ? (
            <p className="rounded-2xl border border-state-error/30 bg-state-error/10 px-4 py-3 text-sm text-state-error">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
