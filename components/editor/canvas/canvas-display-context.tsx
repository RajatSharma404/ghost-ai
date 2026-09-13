"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface CanvasDisplayContextValue {
  showCostBadges: boolean
  setShowCostBadges: React.Dispatch<React.SetStateAction<boolean>>
  toggleCostBadges: () => void
}

const CanvasDisplayContext = createContext<CanvasDisplayContextValue>({
  showCostBadges: true,
  setShowCostBadges: () => {},
  toggleCostBadges: () => {},
})

export function CanvasDisplayProvider({ children }: { children: React.ReactNode }) {
  const [showCostBadges, setShowCostBadges] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    try {
      const stored = localStorage.getItem("ghost_ai_show_cost_badges")
      return stored !== null ? stored === "true" : true
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("ghost_ai_show_cost_badges", String(showCostBadges))
    } catch {}
  }, [showCostBadges])

  const toggleCostBadges = () => setShowCostBadges((prev) => !prev)

  return (
    <CanvasDisplayContext.Provider
      value={{
        showCostBadges,
        setShowCostBadges,
        toggleCostBadges,
      }}
    >
      {children}
    </CanvasDisplayContext.Provider>
  )
}

export function useCanvasDisplay() {
  return useContext(CanvasDisplayContext)
}
