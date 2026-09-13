"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Bot,
  Send,
  Loader2,
  Mic,
} from "lucide-react"
import {
  useEventListener,
  useUpdateMyPresence,
  useFeedMessages,
  useCreateFeedMessage,
  useSelf,
} from "@liveblocks/react"
import { AiStatusFeedMessageSchema, ChatFeedMessageSchema } from "@/types/tasks"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FEED_ID, CHAT_FEED_ID, STARTER_CHIPS } from "./types"
import { RunTracker } from "./run-tracker"
import { useVoiceDictation } from "@/hooks/use-voice-dictation"

interface AiArchitectTabProps {
  roomId: string
  projectId: string
  onLoadingChange?: (loading: boolean) => void
}

export function AiArchitectTab({
  roomId,
  projectId,
  onLoadingChange,
}: AiArchitectTabProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string>("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const architectEndRef = useRef<HTMLDivElement>(null)
  const basePromptRef = useRef<string>("")

  const handleVoiceTranscript = useCallback((sessionTranscript: string) => {
    const prefix = basePromptRef.current ? `${basePromptRef.current} ` : ""
    const updated = (prefix + sessionTranscript).trimStart()
    setInput(updated)
    if (textareaRef.current) {
      textareaRef.current.style.height = "72px"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [])

  const { isSupported, isListening, toggleListening, error: speechError } = useVoiceDictation({
    onTranscript: handleVoiceTranscript,
  })

  const handleToggleVoice = useCallback(() => {
    if (!isListening) {
      basePromptRef.current = input.trim()
    }
    toggleListening()
  }, [input, isListening, toggleListening])

  const self = useSelf()
  const updateMyPresence = useUpdateMyPresence()
  const createFeedMessage = useCreateFeedMessage()
  const { messages: feedMessages } = useFeedMessages(FEED_ID)
  const { messages: chatFeedMessages } = useFeedMessages(CHAT_FEED_ID)

  const updateLoadingState = useCallback(
    (loading: boolean) => {
      setIsLoading(loading)
      onLoadingChange?.(loading)
    },
    [onLoadingChange]
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

      updateLoadingState(false)
      setStatusText("")
      setRunId(null)
      setPublicToken(null)
      updateMyPresence({ thinking: false })
    },
    [createFeedMessage, updateMyPresence, updateLoadingState]
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

  // Receive broadcast status events for real-time strip text
  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return
    setStatusText(event.message)
  })

  // Scroll to bottom when messages update
  useEffect(() => {
    architectEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
    updateLoadingState(true)
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
        body: JSON.stringify({ prompt: text, roomId, projectId, direct: true }),
      })

      if (!designRes.ok) throw new Error("Design request failed")

      const data = (await designRes.json()) as {
        success?: boolean
        summary?: string
        runId?: string
      }

      if (data.success) {
        const content = data.summary ?? "Design applied to canvas."
        createFeedMessage(CHAT_FEED_ID, {
          sender: "Ghost AI",
          role: "assistant",
          content,
          timestamp: new Date().toISOString(),
        }).catch(() => {})

        createFeedMessage(FEED_ID, {
          text: content,
          status: "complete",
        }).catch(() => {})

        updateLoadingState(false)
        setStatusText("")
        updateMyPresence({ thinking: false })
        return
      }

      if (data.runId) {
        const tokenRes = await fetch("/api/ai/design/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: data.runId }),
        })

        if (!tokenRes.ok) throw new Error("Token request failed")

        const { token } = (await tokenRes.json()) as { token: string }

        setRunId(data.runId)
        setPublicToken(token)
      } else {
        updateLoadingState(false)
        setStatusText("")
        updateMyPresence({ thinking: false })
      }
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

      updateLoadingState(false)
      setStatusText("")
      updateMyPresence({ thinking: false })
    }
  }, [input, isLoading, roomId, projectId, updateMyPresence, createFeedMessage, self, updateLoadingState])

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

  const activeStatusText = statusText || (isLoading ? latestFeedMessage?.text ?? "" : "")

  return (
    <div className="flex h-full flex-col">
      {runId && publicToken && (
        <RunTracker
          runId={runId}
          publicToken={publicToken}
          onTerminal={handleRunTerminal}
        />
      )}

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
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={isLoading || !isSupported}
                title={
                  !isSupported
                    ? "Voice dictation not supported in this browser"
                    : isListening
                    ? "Stop voice dictation"
                    : "Dictate architecture via voice"
                }
                className={cn(
                  "relative flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all",
                  isListening
                    ? "bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/20 shadow-xs"
                    : "bg-bg-subtle text-text-muted hover:text-text-primary hover:bg-border-default border border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {isListening ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <Mic className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[11px] font-medium text-red-500">Dictating…</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    <span className="text-[11px]">Dictate</span>
                  </>
                )}
              </button>

              <span className="hidden sm:inline text-[10px] text-text-faint">
                {speechError
                  ? `Mic: ${speechError}`
                  : isListening
                  ? "Speak into your mic to graph live…"
                  : "Shift+Enter for newline"}
              </span>
            </div>

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
  )
}
