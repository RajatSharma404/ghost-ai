"use client"

import { useState, useEffect } from "react"
import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Share2,
  Sparkles,
  Download,
  History,
  Sun,
  Moon,
  Zap,
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"
import { cn } from "@/lib/utils"

export type AppTheme = "dark" | "light" | "oled"

interface EditorNavbarProps {
  isOpen: boolean
  onToggle: () => void
  projectName?: string
  isAiSidebarOpen?: boolean
  onToggleAiSidebar?: () => void
  onOpenShareDialog?: () => void
  onOpenTemplates?: () => void
  onOpenExportDialog?: () => void
  onOpenHistoryDialog?: () => void
  saveStatus?: SaveStatus
  onSave?: () => void
}

export function EditorNavbar({
  isOpen,
  onToggle,
  projectName,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onOpenShareDialog,
  onOpenTemplates,
  onOpenExportDialog,
  onOpenHistoryDialog,
  saveStatus,
  onSave,
}: EditorNavbarProps) {
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ghost-theme") as AppTheme | null
      if (saved && (saved === "dark" || saved === "light" || saved === "oled")) {
        return saved
      }
    }
    return "dark"
  })
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme)
  }, [currentTheme])

  const handleSelectTheme = (theme: AppTheme) => {
    setCurrentTheme(theme)
    localStorage.setItem("ghost-theme", theme)
    document.documentElement.setAttribute("data-theme", theme)
    setThemeMenuOpen(false)
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-default bg-bg-surface px-3">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {projectName ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{projectName}</p>
            <p className="text-xs text-text-faint">Workspace</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {onToggleAiSidebar ? (
          <>
            {onSave ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onSave}
                disabled={saveStatus === "saving"}
              >
                <Save className="h-4 w-4" />
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Saved"
                  : saveStatus === "error"
                  ? "Error"
                  : "Save"}
              </Button>
            ) : null}
            {onOpenTemplates ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onOpenTemplates}
              >
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </Button>
            ) : null}
            {onOpenHistoryDialog ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onOpenHistoryDialog}
              >
                <History className="h-4 w-4" />
                History
              </Button>
            ) : null}
            {onOpenShareDialog ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onOpenShareDialog}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            ) : null}
            {onOpenExportDialog ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onOpenExportDialog}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            ) : null}

            {/* Theme Dropdown Switcher */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 px-2.5"
                onClick={() => setThemeMenuOpen((prev) => !prev)}
                title="Switch Color Theme"
              >
                {currentTheme === "light" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : currentTheme === "oled" ? (
                  <Zap className="h-4 w-4 text-accent-ai-text" />
                ) : (
                  <Moon className="h-4 w-4 text-accent-primary" />
                )}
                <span className="text-xs capitalize">{currentTheme}</span>
              </Button>

              {themeMenuOpen && (
                <div
                  className="absolute right-0 top-10 z-50 flex flex-col gap-1 rounded-2xl border border-border-default bg-bg-surface p-1.5 shadow-2xl backdrop-blur-xl"
                  style={{ minWidth: 150 }}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold text-text-muted">
                    Canvas Theme
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("dark")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors text-left",
                      currentTheme === "dark"
                        ? "bg-accent-primary/15 text-accent-primary font-medium"
                        : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                    )}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark Obsidian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("light")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors text-left",
                      currentTheme === "light"
                        ? "bg-accent-primary/15 text-accent-primary font-medium"
                        : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                    )}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Light (Docs/PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("oled")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors text-left",
                      currentTheme === "oled"
                        ? "bg-accent-primary/15 text-accent-primary font-medium"
                        : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                    )}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Midnight OLED</span>
                  </button>
                </div>
              )}
            </div>

            <Button
              variant={isAiSidebarOpen ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={onToggleAiSidebar}
            >
              <Sparkles className="h-4 w-4" />
              AI
            </Button>
          </>
        ) : null}

        {!onToggleAiSidebar ? <UserButton /> : null}
      </div>
    </header>
  )
}
