"use client"

import { Minus, Maximize, Plus, Undo2, Redo2, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface CanvasControlsProps {
  onZoomOut: () => void
  onFitView: () => void
  onZoomIn: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  isSimulating?: boolean
  onToggleSimulate?: () => void
  simulationSpeed?: number
  onCycleSpeed?: () => void
}

export function CanvasControls({
  onZoomOut,
  onFitView,
  onZoomIn,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isSimulating = false,
  onToggleSimulate,
  simulationSpeed = 1,
  onCycleSpeed,
}: CanvasControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-0.5 rounded-full border border-border-default bg-bg-surface/95 px-2 py-1.5 shadow-xl backdrop-blur-xl">
      <ControlButton onClick={onZoomOut} title="Zoom out">
        <Minus className="h-3.5 w-3.5" />
      </ControlButton>
      <ControlButton onClick={onFitView} title="Fit view">
        <Maximize className="h-3.5 w-3.5" />
      </ControlButton>
      <ControlButton onClick={onZoomIn} title="Zoom in">
        <Plus className="h-3.5 w-3.5" />
      </ControlButton>

      <div className="mx-1 h-4 w-px bg-border-default" />

      <ControlButton onClick={onUndo} title="Undo" disabled={!canUndo}>
        <Undo2 className="h-3.5 w-3.5" />
      </ControlButton>
      <ControlButton onClick={onRedo} title="Redo" disabled={!canRedo}>
        <Redo2 className="h-3.5 w-3.5" />
      </ControlButton>

      {onToggleSimulate && (
        <>
          <div className="mx-1 h-4 w-px bg-border-default" />

          {/* Simulate Flow Toggle */}
          <button
            type="button"
            onClick={onToggleSimulate}
            title={isSimulating ? "Stop Traffic Simulation" : "Simulate Live Traffic Flow"}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-all",
              isSimulating
                ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/40 shadow-xs shadow-accent-primary/20"
                : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
            )}
          >
            <Activity
              className={cn(
                "h-3.5 w-3.5",
                isSimulating && "animate-pulse text-accent-primary"
              )}
            />
            <span>{isSimulating ? "Simulating" : "Simulate"}</span>
          </button>

          {/* Speed cycle button when simulating */}
          {isSimulating && onCycleSpeed && (
            <button
              type="button"
              onClick={onCycleSpeed}
              title={`Simulation speed: ${simulationSpeed}x (Click to change)`}
              className="flex h-7 px-1.5 items-center justify-center rounded-full text-[10px] font-mono font-bold text-accent-primary hover:bg-accent-primary/10 transition-colors"
            >
              {simulationSpeed}x
            </button>
          )}
        </>
      )}
    </div>
  )
}

interface ControlButtonProps {
  onClick: () => void
  title: string
  disabled?: boolean
  children: React.ReactNode
}

function ControlButton({ onClick, title, disabled, children }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
