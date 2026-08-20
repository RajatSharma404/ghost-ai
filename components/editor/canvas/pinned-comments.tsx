"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useStorage } from "@liveblocks/react"
import { LiveObject, LiveMap } from "@liveblocks/client"
import { useReactFlow } from "@xyflow/react"
import {
  MessageSquare,
  Check,
  Trash2,
  Send,
  X,
  CornerDownRight,
} from "lucide-react"
import type { CommentThread, CommentMessage } from "@/types/canvas"
import { getUserColor } from "@/lib/liveblocks"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PinnedCommentsProps {
  isPlacingComment: boolean
  onCommentPlaced: () => void
  showResolved?: boolean
}

type LiveThreadObject = LiveObject<CommentThread>

export function PinnedComments({
  isPlacingComment,
  onCommentPlaced,
  showResolved = true,
}: PinnedCommentsProps) {
  const { user } = useUser()
  const { flowToScreenPosition, screenToFlowPosition } = useReactFlow()

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [newCommentText, setNewCommentText] = useState("")
  const [newThreadCoords, setNewThreadCoords] = useState<{ x: number; y: number } | null>(null)

  // Read threads from Liveblocks storage
  const threads = useStorage((root) => {
    const rawThreads = (root as unknown as { threads?: Record<string, CommentThread> }).threads
    if (!rawThreads) return []
    return Object.values(rawThreads)
  }) ?? []

  // Mutation to create a new thread
  const createThreadMutation = useMutation(
    ({ storage }, thread: CommentThread) => {
      let threadsMap = (storage as unknown as { get: (k: string) => LiveMap<string, LiveThreadObject> | undefined }).get("threads")
      if (!threadsMap) {
        const newMap = new LiveMap<string, LiveThreadObject>()
        ;(storage as unknown as { set: (k: string, v: unknown) => void }).set("threads", newMap)
        threadsMap = newMap
      }

      threadsMap.set(thread.id, new LiveObject(thread))
    },
    []
  )

  // Mutation to add reply
  const addReplyMutation = useMutation(
    ({ storage }, threadId: string, message: CommentMessage) => {
      const threadsMap = (storage as unknown as { get: (k: string) => LiveMap<string, LiveThreadObject> | undefined }).get("threads")
      if (!threadsMap) return
      const thread = threadsMap.get(threadId)
      if (!thread) return
      const currentMessages = thread.get("messages") || []
      thread.set("messages", [...currentMessages, message])
    },
    []
  )

  // Mutation to toggle resolve
  const toggleResolveMutation = useMutation(
    ({ storage }, threadId: string, currentResolved: boolean) => {
      const threadsMap = (storage as unknown as { get: (k: string) => LiveMap<string, LiveThreadObject> | undefined }).get("threads")
      if (!threadsMap) return
      const thread = threadsMap.get(threadId)
      if (!thread) return
      thread.set("resolved", !currentResolved)
    },
    []
  )

  // Mutation to delete thread
  const deleteThreadMutation = useMutation(
    ({ storage }, threadId: string) => {
      const threadsMap = (storage as unknown as { get: (k: string) => LiveMap<string, LiveThreadObject> | undefined }).get("threads")
      if (!threadsMap) return
      threadsMap.delete(threadId)
    },
    []
  )

  // Handle canvas click when in comment placement mode
  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      if (!isPlacingComment) return
      const target = e.target as HTMLElement
      if (target.closest(".nodrag") || target.closest(".nopan") || target.closest("button") || target.closest("input")) {
        return
      }

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setNewThreadCoords(flowPos)
      setActiveThreadId(null)
      onCommentPlaced()
    },
    [isPlacingComment, screenToFlowPosition, onCommentPlaced]
  )

  useEffect(() => {
    if (!isPlacingComment) return
    window.addEventListener("click", handleCanvasClick, { capture: true })
    return () => window.removeEventListener("click", handleCanvasClick, { capture: true })
  }, [isPlacingComment, handleCanvasClick])

  const handleCreateNewThread = useCallback(() => {
    if (!newThreadCoords || !newCommentText.trim() || !user) return

    const threadId = `thread-${Date.now()}`
    const authorColor = getUserColor(user.id)
    const authorName = user.fullName || user.primaryEmailAddress?.emailAddress || "Anonymous"

    const newThread: CommentThread = {
      id: threadId,
      x: Math.round(newThreadCoords.x),
      y: Math.round(newThreadCoords.y),
      resolved: false,
      createdAt: Date.now(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          authorId: user.id,
          authorName,
          authorAvatar: user.imageUrl,
          authorColor,
          content: newCommentText.trim(),
          createdAt: Date.now(),
        },
      ],
    }

    createThreadMutation(newThread)
    setNewThreadCoords(null)
    setNewCommentText("")
    setActiveThreadId(threadId)
  }, [newThreadCoords, newCommentText, user, createThreadMutation])

  const filteredThreads = showResolved ? threads : threads.filter((t) => !t.resolved)

  return (
    <>
      {/* Active Pinned Thread Markers */}
      {filteredThreads.map((thread) => {
        const screenPos = flowToScreenPosition({ x: thread.x, y: thread.y })
        const isSelected = activeThreadId === thread.id
        const firstMsg = thread.messages?.[0]
        const authorColor = firstMsg?.authorColor || "#00c8d4"
        const replyCount = (thread.messages?.length || 1) - 1

        return (
          <div
            key={thread.id}
            style={{
              position: "fixed",
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              transform: "translate(-50%, -50%)",
              zIndex: isSelected ? 45 : 30,
            }}
            className="pointer-events-auto"
          >
            {/* Pin Marker Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveThreadId((prev) => (prev === thread.id ? null : thread.id))
                setNewThreadCoords(null)
              }}
              style={{
                borderColor: thread.resolved ? "rgba(255,255,255,0.2)" : authorColor,
                backgroundColor: thread.resolved ? "#18181c" : `${authorColor}22`,
              }}
              className={cn(
                "group relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-bg-surface shadow-xl backdrop-blur-md transition-transform hover:scale-110",
                isSelected && "scale-125 ring-2 ring-white/50"
              )}
            >
              {thread.resolved ? (
                <Check className="h-3.5 w-3.5 text-state-success" />
              ) : firstMsg?.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstMsg.authorAvatar}
                  alt={firstMsg.authorName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" style={{ color: authorColor }} />
              )}

              {replyCount > 0 && !thread.resolved && (
                <span
                  style={{ backgroundColor: authorColor }}
                  className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-black shadow-xs"
                >
                  +{replyCount}
                </span>
              )}
            </button>

            {/* Thread Popover */}
            {isSelected && (
              <ThreadPopover
                thread={thread}
                onClose={() => setActiveThreadId(null)}
                onReply={(msg) => addReplyMutation(thread.id, msg)}
                onToggleResolve={() => toggleResolveMutation(thread.id, thread.resolved)}
                onDelete={() => {
                  deleteThreadMutation(thread.id)
                  setActiveThreadId(null)
                }}
              />
            )}
          </div>
        )
      })}

      {/* New Thread Composer at clicked position */}
      {newThreadCoords && (
        <div
          style={{
            position: "fixed",
            left: `${flowToScreenPosition(newThreadCoords).x}px`,
            top: `${flowToScreenPosition(newThreadCoords).y}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 50,
          }}
          className="pointer-events-auto"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent-ai bg-accent-ai/20 shadow-xl animate-pulse">
            <MessageSquare className="h-4 w-4 text-accent-ai-text" />
          </div>

          <div
            className="absolute left-10 top-0 w-80 rounded-2xl border border-border-default bg-bg-surface/98 p-3 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-semibold text-text-primary">Add Canvas Comment</span>
              <button
                type="button"
                onClick={() => setNewThreadCoords(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <textarea
              autoFocus
              rows={3}
              placeholder="Leave feedback, ask questions, or note architectural constraints..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleCreateNewThread()
                }
              }}
              className="mt-2.5 w-full rounded-xl border border-border-subtle bg-bg-elevated p-2.5 text-xs text-text-primary outline-none focus:border-accent-ai placeholder:text-text-faint"
            />

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Ctrl + Enter to send</span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewThreadCoords(null)}
                  className="h-7 text-xs border-border-subtle"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateNewThread}
                  disabled={!newCommentText.trim()}
                  className="h-7 gap-1 bg-accent-ai text-xs text-white hover:bg-accent-ai/80"
                >
                  <Send className="h-3 w-3" />
                  <span>Post</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ThreadPopover({
  thread,
  onClose,
  onReply,
  onToggleResolve,
  onDelete,
}: {
  thread: CommentThread
  onClose: () => void
  onReply: (msg: CommentMessage) => void
  onToggleResolve: () => void
  onDelete: () => void
}) {
  const { user } = useUser()
  const [replyText, setReplyText] = useState("")

  const handleSendReply = () => {
    if (!replyText.trim() || !user) return
    const authorColor = getUserColor(user.id)
    const authorName = user.fullName || user.primaryEmailAddress?.emailAddress || "Anonymous"

    onReply({
      id: `msg-${Date.now()}`,
      authorId: user.id,
      authorName,
      authorAvatar: user.imageUrl,
      authorColor,
      content: replyText.trim(),
      createdAt: Date.now(),
    })
    setReplyText("")
  }

  return (
    <div
      className="absolute left-10 top-0 w-84 rounded-2xl border border-border-default bg-bg-surface/98 shadow-2xl backdrop-blur-xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3.5 py-2.5 bg-bg-elevated/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleResolve}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
              thread.resolved
                ? "bg-state-success/15 text-state-success border border-state-success/30"
                : "bg-bg-subtle text-text-muted hover:text-text-primary"
            )}
          >
            <Check className="h-3 w-3" />
            <span>{thread.resolved ? "Resolved" : "Resolve"}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDelete}
            title="Delete thread"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="max-h-60 overflow-y-auto p-3 space-y-3">
        {thread.messages?.map((msg, idx) => (
          <div key={msg.id || idx} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {msg.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.authorAvatar}
                    alt={msg.authorName}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <div
                    style={{ backgroundColor: msg.authorColor || "#00c8d4" }}
                    className="h-4 w-4 rounded-full"
                  />
                )}
                <span className="text-[11px] font-medium text-text-primary">
                  {msg.authorName}
                </span>
              </div>
              <span className="text-[9px] text-text-muted">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-text-secondary pl-5 whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </div>

      {/* Reply Input */}
      {!thread.resolved && (
        <div className="border-t border-border-subtle p-2.5 bg-bg-elevated/30">
          <div className="flex items-center gap-1.5">
            <CornerDownRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Reply to thread..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendReply()
              }}
              className="h-7 flex-1 rounded-xl border border-border-subtle bg-bg-surface px-2.5 text-xs text-text-primary outline-none focus:border-accent-ai placeholder:text-text-faint"
            />
            <Button
              size="sm"
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="h-7 w-7 p-0 bg-accent-ai text-white hover:bg-accent-ai/80 shrink-0"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
