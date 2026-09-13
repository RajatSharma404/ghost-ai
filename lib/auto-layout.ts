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
 * Arranges nodes into layered ranks based on directed dependency flow,
 * and re-encloses container group nodes around their member services.
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

  // 1. Identify which regular nodes were originally enclosed inside each group
  const originalGroupMembers = new Map<string, string[]>()
  for (const g of groupNodes) {
    const gx = g.position.x
    const gy = g.position.y
    const gw = g.width ?? 320
    const gh = g.height ?? 220
    const members: string[] = []

    for (const r of regularNodes) {
      if (
        r.position.x >= gx &&
        r.position.x <= gx + gw &&
        r.position.y >= gy &&
        r.position.y <= gy + gh
      ) {
        members.push(r.id)
      }
    }
    originalGroupMembers.set(g.id, members)
  }

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

  // 2. Re-encompass member nodes with appropriate boundary padding
  const updatedGroupNodes = groupNodes.map((gNode, gIdx) => {
    const memberIds = originalGroupMembers.get(gNode.id) ?? []
    const members = memberIds
      .map((id) => updatedNodesMap.get(id))
      .filter((n): n is CanvasNode => Boolean(n))

    if (members.length > 0) {
      const padX = 40
      const padTop = 55
      const padBottom = 40

      const minX = Math.min(...members.map((m) => m.position.x))
      const maxX = Math.max(...members.map((m) => m.position.x + (m.width ?? 160)))
      const minY = Math.min(...members.map((m) => m.position.y))
      const maxY = Math.max(...members.map((m) => m.position.y + (m.height ?? 80)))

      return {
        ...gNode,
        position: {
          x: Math.round(minX - padX),
          y: Math.round(minY - padTop),
        },
        width: Math.max(260, Math.round(maxX - minX + padX * 2)),
        height: Math.max(160, Math.round(maxY - minY + padTop + padBottom)),
      }
    }

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
