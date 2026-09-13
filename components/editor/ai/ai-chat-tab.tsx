"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { MessageSquare, Send } from "lucide-react"
import {
  useFeedMessages,
  useCreateFeedMessage,
  useSelf,
} from "@liveblocks/react"
import { ChatFeedMessageSchema } from "@/types/tasks"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { CHAT_FEED_ID, formatTime } from "./types"

export function AiChatTab() {
  const [chatInput, setChatInput] = useState("")
  const [chatError, setChatError] = useState<string | null>(null)
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const self = useSelf()
  const createFeedMessage = useCreateFeedMessage()
  const { messages: chatFeedMessages } = useFeedMessages(CHAT_FEED_ID)

  const validatedChatMessages = (chatFeedMessages ?? [])
    .map((msg) => {
      const parsed = ChatFeedMessageSchema.safeParse(msg.data)
      if (!parsed.success) return null
      return { id: msg.id, createdAt: msg.createdAt, ...parsed.data }
    })
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
    .sort((a, b) => a.createdAt - b.createdAt)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [validatedChatMessages.length])

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

  return (
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
  )
}
