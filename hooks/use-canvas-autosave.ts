"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

const AUTOSAVE_DEBOUNCE_MS = 8000

export function useCanvasAutosave(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): { status: SaveStatus; save: () => void } {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasMountedRef = useRef(false)
  const lastSavedSnapshotRef = useRef<string>("")

  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const projectIdRef = useRef(projectId)

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
    projectIdRef.current = projectId
  })

  // Reset to idle after showing saved/error so the button returns to "Save".
  useEffect(() => {
    if (status !== "saved" && status !== "error") return
    resetTimerRef.current = setTimeout(() => setStatus("idle"), 2500)
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [status])

  const doSave = useCallback(async () => {
    const currentSnapshot = JSON.stringify({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    })

    // Avoid redundant network calls if content is unchanged
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return
    }

    setStatus("saving")
    try {
      const res = await fetch(`/api/projects/${projectIdRef.current}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: currentSnapshot,
      })
      if (res.ok) {
        lastSavedSnapshotRef.current = currentSnapshot
        setStatus("saved")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    // Record initial snapshot on first mount so we don't save unchanged initial storage
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      lastSavedSnapshotRef.current = JSON.stringify({ nodes, edges })
      return
    }

    const currentSnapshot = JSON.stringify({ nodes, edges })
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(doSave, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nodes, edges, doSave])

  // Flush pending changes on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        const currentSnapshot = JSON.stringify({
          nodes: nodesRef.current,
          edges: edgesRef.current,
        })
        if (currentSnapshot !== lastSavedSnapshotRef.current) {
          fetch(`/api/projects/${projectIdRef.current}/canvas`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: currentSnapshot,
            keepalive: true,
          }).catch(() => {})
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const save = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    doSave()
  }, [doSave])

  return { status, save }
}
