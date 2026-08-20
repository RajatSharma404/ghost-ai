import type { CanvasNode, CanvasEdge } from "@/types/canvas"

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_")
}

function sanitizeLabel(label: string): string {
  return label.replace(/"/g, "'").trim()
}

/**
 * Generates valid Mermaid.js flowchart markdown from canvas nodes & edges
 */
export function generateMermaid(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  options: { direction?: "LR" | "TD" } = {}
): string {
  const direction = options.direction ?? "LR"
  const lines: string[] = []

  lines.push(`graph ${direction}`)
  lines.push(`  %% Styling & Classes`)
  lines.push(`  classDef default fill:#111114,stroke:#2a2a30,stroke-width:1.5px,color:#f0f0f4;`)
  lines.push(`  classDef group fill:#18181c,stroke:#52a8ff,stroke-width:1px,stroke-dasharray: 4 4,color:#52a8ff;`)
  lines.push(`  classDef db fill:#0e2a1e,stroke:#34d399,stroke-width:1.5px,color:#34d399;`)
  lines.push(`  classDef queue fill:#2e1938,stroke:#bf7af0,stroke-width:1.5px,color:#bf7af0;`)
  lines.push(``)

  const groupNodes = nodes.filter((n) => n.type === "groupNode")
  const regularNodes = nodes.filter((n) => n.type !== "groupNode")

  // Subgraphs for group nodes
  for (const group of groupNodes) {
    const gid = sanitizeId(group.id)
    const gData = group.data as { label?: string; subtitle?: string }
    const title = sanitizeLabel(gData.label || "Boundary Group")
    const subtitle = gData.subtitle ? ` (${sanitizeLabel(gData.subtitle)})` : ""
    lines.push(`  subgraph ${gid} ["${title}${subtitle}"]`)
    lines.push(`    %% Contained nodes`)
    lines.push(`  end`)
    lines.push(`  class ${gid} group;`)
    lines.push(``)
  }

  // Regular Nodes
  for (const node of regularNodes) {
    const nid = sanitizeId(node.id)
    const data = node.data as { label?: string; shape?: string; icon?: string }
    const label = sanitizeLabel(data.label || "Node")
    const iconPrefix = data.icon ? `[${data.icon.toUpperCase()}] ` : ""
    const fullLabel = `${iconPrefix}${label}`
    const shape = data.shape ?? "rectangle"

    let nodeSyntax = `${nid}["${fullLabel}"]`
    if (shape === "cylinder" || label.toLowerCase().includes("database") || label.toLowerCase().includes("db")) {
      nodeSyntax = `${nid}[("${fullLabel}")]`
    } else if (shape === "diamond") {
      nodeSyntax = `${nid}{"${fullLabel}"}`
    } else if (shape === "circle") {
      nodeSyntax = `${nid}(("${fullLabel}"))`
    } else if (shape === "pill") {
      nodeSyntax = `${nid}(["${fullLabel}"])`
    } else if (shape === "hexagon") {
      nodeSyntax = `${nid}{{"${fullLabel}"}}`
    }

    lines.push(`  ${nodeSyntax}`)

    // Apply color class if database or queue
    if (label.toLowerCase().includes("db") || label.toLowerCase().includes("postgres") || label.toLowerCase().includes("redis") || label.toLowerCase().includes("sql")) {
      lines.push(`  class ${nid} db;`)
    } else if (label.toLowerCase().includes("kafka") || label.toLowerCase().includes("queue") || label.toLowerCase().includes("event")) {
      lines.push(`  class ${nid} queue;`)
    }
  }

  lines.push(``)
  lines.push(`  %% Connections`)

  // Edges
  for (const edge of edges) {
    const s = sanitizeId(edge.source)
    const t = sanitizeId(edge.target)
    const edgeLabel = edge.data?.label ? sanitizeLabel(edge.data.label) : ""

    if (edgeLabel) {
      lines.push(`  ${s} -->|"${edgeLabel}"| ${t}`)
    } else {
      lines.push(`  ${s} --> ${t}`)
    }
  }

  return lines.join("\n")
}

/**
 * Generates valid PlantUML architecture diagram code
 */
export function generatePlantUML(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  options: { title?: string } = {}
): string {
  const lines: string[] = []

  lines.push(`@startuml ${options.title ? sanitizeId(options.title) : "ArchitectureDiagram"}`)
  lines.push(`!theme plain`)
  lines.push(`skinparam backgroundColor #080809`)
  lines.push(`skinparam defaultFontColor #f0f0f4`)
  lines.push(`skinparam roundCorner 12`)
  lines.push(`skinparam ArrowColor #00c8d4`)
  lines.push(`skinparam ArrowFontColor #808090`)
  lines.push(`skinparam ArrowFontSize 11`)
  lines.push(`skinparam rectangle {`)
  lines.push(`  BackgroundColor #111114`)
  lines.push(`  BorderColor #2a2a30`)
  lines.push(`  FontColor #f0f0f4`)
  lines.push(`}`)
  lines.push(`skinparam database {`)
  lines.push(`  BackgroundColor #0e2a1e`)
  lines.push(`  BorderColor #34d399`)
  lines.push(`  FontColor #34d399`)
  lines.push(`}`)
  lines.push(`skinparam queue {`)
  lines.push(`  BackgroundColor #2e1938`)
  lines.push(`  BorderColor #bf7af0`)
  lines.push(`  FontColor #bf7af0`)
  lines.push(`}`)
  lines.push(``)

  const groupNodes = nodes.filter((n) => n.type === "groupNode")
  const regularNodes = nodes.filter((n) => n.type !== "groupNode")

  for (const group of groupNodes) {
    const gid = sanitizeId(group.id)
    const gData = group.data as { label?: string; subtitle?: string }
    const title = sanitizeLabel(gData.label || "Boundary Group")
    lines.push(`package "${title}" as ${gid} {`)
    lines.push(`}`)
    lines.push(``)
  }

  for (const node of regularNodes) {
    const nid = sanitizeId(node.id)
    const data = node.data as { label?: string; icon?: string; shape?: string }
    const label = sanitizeLabel(data.label || "Component")
    const l = label.toLowerCase()

    if (l.includes("db") || l.includes("postgres") || l.includes("redis") || l.includes("sql")) {
      lines.push(`database "${label}" as ${nid}`)
    } else if (l.includes("kafka") || l.includes("queue") || l.includes("event") || l.includes("sqs")) {
      lines.push(`queue "${label}" as ${nid}`)
    } else {
      lines.push(`rectangle "${label}" as ${nid}`)
    }
  }

  lines.push(``)
  for (const edge of edges) {
    const s = sanitizeId(edge.source)
    const t = sanitizeId(edge.target)
    const edgeLabel = edge.data?.label ? ` : "${sanitizeLabel(edge.data.label)}"` : ""
    lines.push(`${s} --> ${t}${edgeLabel}`)
  }

  lines.push(``)
  lines.push(`@enduml`)

  return lines.join("\n")
}

/**
 * Client-side download helper
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
