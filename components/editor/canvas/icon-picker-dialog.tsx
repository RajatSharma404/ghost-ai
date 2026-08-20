"use client"

import { useState, useMemo } from "react"
import { Search, X, Trash2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { TECH_ICON_CATALOG, TechIcon } from "@/components/editor/canvas/tech-icons"
import { cn } from "@/lib/utils"

interface IconPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentIcon?: string | null
  onSelectIcon: (iconId: string | null) => void
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "cloud", label: "Cloud" },
  { id: "compute", label: "Compute" },
  { id: "database", label: "Databases" },
  { id: "messaging", label: "Messaging" },
  { id: "storage", label: "Storage" },
  { id: "security", label: "Security" },
] as const

export function IconPickerDialog({
  open,
  onOpenChange,
  currentIcon,
  onSelectIcon,
}: IconPickerDialogProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("all")

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase()
    return TECH_ICON_CATALOG.filter((item) => {
      const matchesCategory = category === "all" || item.category === category
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [search, category])

  function handleSelect(id: string | null) {
    onSelectIcon(id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-xl border-border-default bg-bg-surface p-0 overflow-hidden"
      >
        <DialogHeader className="p-4 pb-2 border-b border-border-default">
          <DialogTitle className="text-sm font-semibold text-text-primary">
            Choose Tech & Cloud Brand Icon
          </DialogTitle>
          <p className="text-xs text-text-muted">
            Select an official SVG icon for your architecture component
          </p>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search icons (e.g., redis, lambda, kafka, postgres)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-xl border border-border-subtle bg-bg-elevated pl-8 pr-8 text-xs text-text-primary outline-none focus:border-accent-ai transition-colors placeholder:text-text-faint"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pt-2 pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                  category === cat.id
                    ? "bg-accent-ai text-white"
                    : "text-text-muted hover:bg-bg-subtle hover:text-text-primary"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Icon Grid */}
        <ScrollArea className="max-h-[50vh] p-4">
          {filteredIcons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
              <p className="text-xs">No icons found matching &quot;{search}&quot;</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
              {filteredIcons.map((item) => {
                const isSelected = currentIcon === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-3 text-center transition-all hover:border-accent-ai/50 hover:bg-bg-subtle",
                      isSelected && "border-accent-ai bg-accent-ai/10 ring-1 ring-accent-ai"
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-surface/80 p-1.5 shadow-xs transition-transform group-hover:scale-110">
                      <TechIcon iconId={item.id} size={24} />
                    </div>
                    <span className="truncate w-full text-[11px] font-medium text-text-secondary group-hover:text-text-primary">
                      {item.name}
                    </span>

                    {isSelected && (
                      <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-ai text-white">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-border-default bg-bg-subtle/50 px-4 py-2.5">
          {currentIcon ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSelect(null)}
              className="h-7 gap-1.5 border-border-subtle text-xs text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-3 w-3" />
              Remove Icon
            </Button>
          ) : (
            <div />
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-7 border-border-subtle text-xs"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
