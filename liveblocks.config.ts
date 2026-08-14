// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { LiveMap, LiveObject } from "@liveblocks/client"
import type { LiveblocksNode, LiveblocksEdge } from "@liveblocks/react-flow"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor?: { x: number; y: number } | null
      name?: string
      avatar?: string
      color?: string
      thinking?: boolean
    }

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      flow: LiveObject<{
        nodes: LiveMap<string, LiveblocksNode<CanvasNode>>
        edges: LiveMap<string, LiveblocksEdge<CanvasEdge>>
      }>
    }

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string
      info: {
        name: string
        avatar?: string
        color?: string
      }
    }

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {
      type: string
      message: string
      status?: string
    }

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      [key: string]: string | number | boolean | undefined
    }

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      title?: string
      url?: string
    }
  }
}

export {}
