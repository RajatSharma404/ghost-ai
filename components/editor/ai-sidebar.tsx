"use client"

import { useState, useEffect } from "react"
import { Bot, X, Loader2 } from "lucide-react"
import { useCreateFeed } from "@liveblocks/react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { FEED_ID, CHAT_FEED_ID } from "./ai/types"
import { AiArchitectTab } from "./ai/ai-architect-tab"
import { AiChatTab } from "./ai/ai-chat-tab"
import { AiSpecsTab } from "./ai/ai-specs-tab"
import { AiIacTab } from "./ai/ai-iac-tab"
import { AiAuditTab } from "./ai/ai-audit-tab"
import { AiCostTab } from "./ai/ai-cost-tab"
import { AiDiffTab } from "./ai/ai-diff-tab"
import { AiScaffoldTab } from "./ai/ai-scaffold-tab"

export interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  projectId: string
}

export function AiSidebar({ isOpen, onClose, roomId, projectId }: AiSidebarProps) {
  const [isArchitectLoading, setIsArchitectLoading] = useState(false)
  const createFeed = useCreateFeed()

  // Ensure both Liveblocks feeds exist on mount
  useEffect(() => {
    createFeed(FEED_ID).catch(() => {})
    createFeed(CHAT_FEED_ID).catch(() => {})
  }, [createFeed])

  return (
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
        {isArchitectLoading && (
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
            className="flex h-9 w-full justify-start gap-1 overflow-x-auto rounded-xl bg-bg-subtle p-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabsTrigger
              value="architect"
              className="shrink-0 rounded-lg px-2.5 text-xs text-text-muted data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-xs"
            >
              Architect
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="shrink-0 rounded-lg px-2.5 text-xs text-text-muted data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-xs"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="shrink-0 rounded-lg px-2.5 text-xs text-text-muted data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-xs"
            >
              Specs
            </TabsTrigger>
            <TabsTrigger
              value="iac"
              className="shrink-0 rounded-lg px-2.5 text-xs text-text-muted data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-xs"
            >
              IaC
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="shrink-0 rounded-lg px-2.5 text-xs text-text-muted data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-xs"
            >
              Audit
            </TabsTrigger>
            <TabsTrigger
              value="cost"
              className="shrink-0 rounded-lg px-2.5 text-xs text-text-muted data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-xs"
            >
              Cost
            </TabsTrigger>
            <TabsTrigger
              value="alternatives"
              className="shrink-0 rounded-lg px-2.5 text-xs text-text-muted data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-xs"
            >
              Diff
            </TabsTrigger>
            <TabsTrigger
              value="api"
              className="shrink-0 rounded-lg px-2.5 text-xs text-text-muted data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-xs"
            >
              API
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Panels */}
        <TabsContent value="architect" className="min-h-0 flex-1 overflow-hidden">
          <AiArchitectTab
            roomId={roomId}
            projectId={projectId}
            onLoadingChange={setIsArchitectLoading}
          />
        </TabsContent>

        <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden">
          <AiChatTab />
        </TabsContent>

        <TabsContent value="specs" className="min-h-0 flex-1 overflow-hidden">
          <AiSpecsTab
            roomId={roomId}
            projectId={projectId}
            isOpen={isOpen}
          />
        </TabsContent>

        <TabsContent value="iac" className="min-h-0 flex-1 overflow-hidden">
          <AiIacTab
            roomId={roomId}
            projectId={projectId}
          />
        </TabsContent>

        <TabsContent value="audit" className="min-h-0 flex-1 overflow-hidden">
          <AiAuditTab
            roomId={roomId}
            projectId={projectId}
          />
        </TabsContent>

        <TabsContent value="cost" className="min-h-0 flex-1 overflow-hidden">
          <AiCostTab
            roomId={roomId}
            projectId={projectId}
          />
        </TabsContent>

        <TabsContent value="alternatives" className="min-h-0 flex-1 overflow-hidden">
          <AiDiffTab
            roomId={roomId}
            projectId={projectId}
          />
        </TabsContent>

        <TabsContent value="api" className="min-h-0 flex-1 overflow-hidden">
          <AiScaffoldTab
            roomId={roomId}
            projectId={projectId}
          />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
