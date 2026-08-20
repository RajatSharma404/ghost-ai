import type { CanvasNode, CanvasEdge } from "@/types/canvas"

export type LayoutDirection = "LR" | "TB"

interface LayoutOptions {
  direction?: LayoutDirection
  layerSpacing?: number
  nodeSpacing?: number
  startX?: number
  startY?: number
}

/**
 * High-performance hierarchical DAG layout algorithm for architecture diagrams.
 * Arranges nodes into layered ranks based on directed dependency flow.
 */
export function computeAutoLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  options: LayoutOptions = {}
): CanvasNode[] {
  if (!nodes || nodes.length === 0) return []

  const direction = options.direction ?? "LR"
  const isHorizontal = direction === "LR"

  const layerSpacing = options.layerSpacing ?? (isHorizontal ? 260 : 180)
  const nodeSpacing = options.nodeSpacing ?? (isHorizontal ? 140 : 200)
  const startX = options.startX ?? 80
  const startY = options.startY ?? 80

  const regularNodes = nodes.filter((n) => n.type !== "groupNode")
  const groupNodes = nodes.filter((n) => n.type === "groupNode")

  if (regularNodes.length === 0) return nodes

  const nodeMap = new Map<string, CanvasNode>()
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  for (const node of regularNodes) {
    nodeMap.set(node.id, node)
    inDegree.set(node.id, 0)
    adj.set(node.id, [])
  }

  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      adj.get(edge.source)!.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    }
  }

  // Assign layers using BFS / Longest path from roots
  const layers = new Map<string, number>()
  const queue: string[] = []

  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id)
      layers.set(id, 0)
    }
  }

  // If graph is entirely cyclic, pick the first node as root
  if (queue.length === 0 && regularNodes.length > 0) {
    const firstId = regularNodes[0].id
    queue.push(firstId)
    layers.set(firstId, 0)
  }

  const visited = new Set<string>()

  while (queue.length > 0) {
    const curr = queue.shift()!
    if (visited.has(curr)) continue
    visited.add(curr)

    const currLayer = layers.get(curr) ?? 0
    const neighbors = adj.get(curr) ?? []

    for (const next of neighbors) {
      const existingLayer = layers.get(next) ?? 0
      layers.set(next, Math.max(existingLayer, currLayer + 1))
      queue.push(next)
    }
  }

  // Assign unvisited nodes to layer 0
  for (const node of regularNodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0)
    }
  }

  // Group nodes by layer
  const layerGroups = new Map<number, CanvasNode[]>()
  for (const node of regularNodes) {
    const l = layers.get(node.id) ?? 0
    if (!layerGroups.has(l)) layerGroups.set(l, [])
    layerGroups.get(l)!.push(node)
  }

  const sortedLayerKeys = Array.from(layerGroups.keys()).sort((a, b) => a - b)

  // Calculate coordinates for regular nodes
  const updatedNodesMap = new Map<string, CanvasNode>()

  sortedLayerKeys.forEach((layerIdx) => {
    const group = layerGroups.get(layerIdx)!
    const totalHeight = (group.length - 1) * nodeSpacing
    const totalWidth = (group.length - 1) * nodeSpacing

    group.forEach((node, idx) => {
      let x = 0
      let y = 0

      if (isHorizontal) {
        // Left-to-Right
        x = startX + layerIdx * layerSpacing
        y = startY + idx * nodeSpacing - totalHeight / 2 + 200
      } else {
        // Top-to-Bottom
        x = startX + idx * nodeSpacing - totalWidth / 2 + 300
        y = startY + layerIdx * layerSpacing
      }

      updatedNodesMap.set(node.id, {
        ...node,
        position: { x: Math.round(x), y: Math.round(y) },
      })
    })
  })

  // Position container group nodes cleanly around the graph
  const updatedGroupNodes = groupNodes.map((gNode, gIdx) => {
    return {
      ...gNode,
      position: {
        x: isHorizontal ? startX - 40 : startX + gIdx * 400 - 40,
        y: isHorizontal ? startY + gIdx * 300 - 40 : startY - 40,
      },
    }
  })

  return [
    ...Array.from(updatedNodesMap.values()),
    ...updatedGroupNodes,
  ]
}
