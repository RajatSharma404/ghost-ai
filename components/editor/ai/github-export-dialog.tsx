"use client"

import { useState, useCallback, useMemo } from "react"
import {
  GitBranch,
  GitCommit,
  ExternalLink,
  Key,
  Check,
  Loader2,
  AlertCircle,
  FileCode,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface ExportableFile {
  path: string
  content: string
  label?: string
}

interface GitHubExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: ExportableFile[]
}

const STORAGE_TOKEN_KEY = "ghost_ai_github_pat"
const STORAGE_REPO_KEY = "ghost_ai_github_repo"

export function GitHubExportDialog({
  open,
  onOpenChange,
  files,
}: GitHubExportDialogProps) {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return ""
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY) || ""
    } catch {
      return ""
    }
  })
  const [rememberToken, setRememberToken] = useState(true)
  const [repo, setRepo] = useState(() => {
    if (typeof window === "undefined") return ""
    try {
      return localStorage.getItem(STORAGE_REPO_KEY) || ""
    } catch {
      return ""
    }
  })
  const [branch, setBranch] = useState("main")
  const [commitMessage, setCommitMessage] = useState(
    "feat(infra): add architecture IaC manifests from Ghost AI"
  )
  const [deselectedPaths, setDeselectedPaths] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    commitUrl: string
    branchUrl: string
    commitSha: string
    filesCommitted: number
  } | null>(null)

  const filesToCommit = useMemo(
    () => files.filter((f) => !deselectedPaths.includes(f.path)),
    [files, deselectedPaths]
  )

  const toggleFile = useCallback((path: string) => {
    setDeselectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    )
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setError(null)
      setResult(null)
      setDeselectedPaths([])
    }
    onOpenChange(nextOpen)
  }

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      setError("Please provide a GitHub Personal Access Token.")
      return
    }

    if (!repo.trim() || !repo.includes("/")) {
      setError("Please enter a valid repository in the format owner/repo (e.g. acme/infrastructure).")
      return
    }

    if (filesToCommit.length === 0) {
      setError("Select at least one file to commit.")
      return
    }

    setError(null)
    setIsSubmitting(true)

    const [owner, repoName] = repo.trim().split("/")

    try {
      // Save credentials if remembered
      if (rememberToken) {
        localStorage.setItem(STORAGE_TOKEN_KEY, token.trim())
        localStorage.setItem(STORAGE_REPO_KEY, repo.trim())
      } else {
        localStorage.removeItem(STORAGE_TOKEN_KEY)
      }

      const res = await fetch("/api/export/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          owner,
          repo: repoName,
          branch: branch.trim() || "main",
          commitMessage: commitMessage.trim(),
          files: filesToCommit.map((f) => ({ path: f.path, content: f.content })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "GitHub commit failed.")
      }

      setResult({
        commitUrl: data.commitUrl,
        branchUrl: data.branchUrl,
        commitSha: data.commitSha,
        filesCommitted: data.filesCommitted,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "GitHub export failed."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-xl max-w-xl border-border-default bg-bg-surface p-6 shadow-2xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-ai/15 text-accent-ai-text">
              <GitCommit className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-text-primary">
                One-Click GitHub Export
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted mt-0.5">
                Commit generated infrastructure manifests directly to your repository
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4 py-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="h-5 w-5" />
              </div>
              <h4 className="mt-2 text-sm font-semibold text-text-primary">
                Successfully Committed to GitHub!
              </h4>
              <p className="mt-1 text-xs text-text-muted">
                {result.filesCommitted} file{result.filesCommitted > 1 ? "s" : ""} pushed to{" "}
                <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-accent-ai-text">
                  {branch}
                </code>
              </p>
              <p className="mt-1 font-mono text-[10px] text-text-faint">
                SHA: {result.commitSha.substring(0, 7)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 border-border-subtle text-xs"
                onClick={() => window.open(result.branchUrl, "_blank")}
              >
                <GitBranch className="h-3.5 w-3.5" />
                Open Branch
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-accent-ai text-xs text-white hover:bg-accent-ai/80"
                onClick={() => window.open(result.commitUrl, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Commit on GitHub ↗
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleExport} className="flex flex-col gap-4 pt-1">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Target Repository */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">
                GitHub Repository
              </label>
              <Input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="owner/repo (e.g. acme/infrastructure)"
                className="h-8 text-xs font-mono bg-bg-elevated border-border-subtle focus-visible:ring-accent-ai"
                required
              />
            </div>

            {/* Target Branch */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">
                Target Branch
              </label>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main or feature branch"
                className="h-8 text-xs font-mono bg-bg-elevated border-border-subtle focus-visible:ring-accent-ai"
                required
              />
            </div>

            {/* Personal Access Token */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-primary flex items-center gap-1">
                  <Key className="h-3 w-3 text-accent-ai-text" />
                  GitHub Personal Access Token (PAT)
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-accent-ai-text hover:underline"
                >
                  Generate Token ↗
                </a>
              </div>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="h-8 text-xs font-mono bg-bg-elevated border-border-subtle focus-visible:ring-accent-ai"
                required
              />
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="remember-token"
                  checked={rememberToken}
                  onChange={(e) => setRememberToken(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border-default bg-bg-elevated text-accent-ai focus:ring-accent-ai"
                />
                <label htmlFor="remember-token" className="text-[11px] text-text-muted cursor-pointer">
                  Remember token in local browser storage
                </label>
              </div>
            </div>

            {/* Commit Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">
                Commit Message
              </label>
              <Input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
                className="h-8 text-xs bg-bg-elevated border-border-subtle focus-visible:ring-accent-ai"
                required
              />
            </div>

            {/* Files to Include Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">
                Files to Include ({filesToCommit.length} of {files.length})
              </label>
              <div className="flex flex-col gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated p-2">
                {files.map((file) => {
                  const isChecked = !deselectedPaths.includes(file.path)
                  return (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => toggleFile(file.path)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors border",
                        isChecked
                          ? "bg-bg-subtle text-text-primary border-accent-ai/30 font-medium"
                          : "bg-transparent text-text-muted border-transparent hover:bg-bg-subtle/50 hover:text-text-secondary"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className="h-3.5 w-3.5 text-accent-ai-text shrink-0" />
                        <span className="font-mono text-[11px] truncate">{file.path}</span>
                      </div>
                      {isChecked && <Check className="h-3.5 w-3.5 text-accent-ai-text shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-border-default pt-3 mt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs border-border-subtle"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || filesToCommit.length === 0}
                className="h-8 gap-1.5 bg-accent-ai text-xs text-white hover:bg-accent-ai/80 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Committing…
                  </>
                ) : (
                  <>
                    <GitCommit className="h-3.5 w-3.5" />
                    Commit to GitHub
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
