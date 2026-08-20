import type { Node, Edge } from "@xyflow/react"

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export type NodeShape = (typeof NODE_SHAPES)[number]

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const

export const SHAPE_DEFAULTS: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 160, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 72 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 140, height: 120 },
}

export const BOUNDARY_TYPES = [
  "vpc",
  "subnet-public",
  "subnet-private",
  "k8s-cluster",
  "security-zone",
  "custom",
] as const

export type GroupBoundaryType = (typeof BOUNDARY_TYPES)[number]

export interface BoundaryPreset {
  type: GroupBoundaryType
  label: string
  subtitle: string
  borderColor: string
  fillColor: string
  textColor: string
  isDashed: boolean
}

export const BOUNDARY_PRESETS: Record<GroupBoundaryType, BoundaryPreset> = {
  vpc: {
    type: "vpc",
    label: "AWS VPC",
    subtitle: "10.0.0.0/16",
    borderColor: "rgba(255, 153, 10, 0.45)",
    fillColor: "rgba(51, 27, 0, 0.25)",
    textColor: "#FF990A",
    isDashed: false,
  },
  "subnet-public": {
    type: "subnet-public",
    label: "Public Subnet",
    subtitle: "10.0.1.0/24 (IGW)",
    borderColor: "rgba(98, 192, 115, 0.45)",
    fillColor: "rgba(15, 46, 24, 0.25)",
    textColor: "#62C073",
    isDashed: true,
  },
  "subnet-private": {
    type: "subnet-private",
    label: "Private Subnet",
    subtitle: "10.0.2.0/24 (NAT)",
    borderColor: "rgba(82, 168, 255, 0.45)",
    fillColor: "rgba(16, 35, 61, 0.25)",
    textColor: "#52A8FF",
    isDashed: true,
  },
  "k8s-cluster": {
    type: "k8s-cluster",
    label: "Kubernetes Cluster",
    subtitle: "Namespace: default",
    borderColor: "rgba(191, 122, 240, 0.45)",
    fillColor: "rgba(46, 25, 56, 0.25)",
    textColor: "#BF7AF0",
    isDashed: false,
  },
  "security-zone": {
    type: "security-zone",
    label: "Security / DMZ Zone",
    subtitle: "Strict Ingress Filtering",
    borderColor: "rgba(255, 97, 102, 0.45)",
    fillColor: "rgba(60, 22, 24, 0.25)",
    textColor: "#FF6166",
    isDashed: true,
  },
  custom: {
    type: "custom",
    label: "Boundary Group",
    subtitle: "Logical Cluster",
    borderColor: "rgba(255, 255, 255, 0.25)",
    fillColor: "rgba(255, 255, 255, 0.03)",
    textColor: "#EDEDED",
    isDashed: true,
  },
}

export interface NodeEnvVar {
  key: string
  value: string
}

export interface NodeMetadata {
  description?: string
  role?: string
  techStack?: string
  language?: string
  port?: string
  protocol?: string
  healthCheckPath?: string
  envVars?: NodeEnvVar[]
  slaLatency?: string
  maxThroughput?: string
  replicas?: string
  ownerTeam?: string
  maintainer?: string
  repoUrl?: string
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color?: string
  textColor?: string
  shape?: NodeShape
  icon?: string
  metadata?: NodeMetadata
}

export interface GroupNodeData extends Record<string, unknown> {
  label: string
  subtitle?: string
  boundaryType?: GroupBoundaryType
  borderColor?: string
  fillColor?: string
  textColor?: string
  isDashed?: boolean
}

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string
  isSimulating?: boolean
  trafficType?: "http" | "grpc" | "kafka" | "db" | "default"
  speed?: number
}

export type CanvasRegularNode = Node<CanvasNodeData, "canvasNode">
export type CanvasGroupNode = Node<GroupNodeData, "groupNode">
export type CanvasNode = CanvasRegularNode | CanvasGroupNode
export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">

export interface CommentMessage {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  authorColor?: string
  content: string
  createdAt: number
  [key: string]: string | number | boolean | undefined
}

export interface CommentThread {
  id: string
  x: number
  y: number
  nodeId?: string
  resolved: boolean
  createdAt: number
  messages: CommentMessage[]
  [key: string]: string | number | boolean | CommentMessage[] | undefined
}
