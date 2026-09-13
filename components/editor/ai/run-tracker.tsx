"use client"

import { useEffect, useRef } from "react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { TERMINAL_STATUSES } from "./types"

export interface RunTrackerProps {
  runId: string
  publicToken: string
  onTerminal: (status: string, output: unknown) => void
}

export function RunTracker({ runId, publicToken, onTerminal }: RunTrackerProps) {
  const { run } = useRealtimeRun(runId, { accessToken: publicToken })
  const firedRef = useRef(false)

  useEffect(() => {
    if (!run || firedRef.current) return
    if (!(TERMINAL_STATUSES as readonly string[]).includes(run.status)) return
    firedRef.current = true
    onTerminal(run.status, run.output)
  }, [run, onTerminal])

  return null
}
