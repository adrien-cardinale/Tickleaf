import { formatDistanceToNowStrict } from "date-fns"
import { fr } from "date-fns/locale"
import { labels } from "@/lib/labels"
import type { SyncState } from "./sync-store"

export function formatLastSync(lastAt: string | null): string {
  if (lastAt === null) return labels.sync.state.never
  return labels.sync.state.syncedAgo(formatDistanceToNowStrict(new Date(lastAt), { locale: fr, addSuffix: true }))
}

export function describeSyncStatus(state: SyncState): string {
  if (state.status === "local") return labels.sync.state.local
  if (state.status === "syncing") return labels.sync.state.syncing
  if (state.status === "offline") return labels.sync.state.offline
  if (state.status === "error") return labels.sync.state.error
  if (state.pendingCount > 0) return labels.sync.state.pending(state.pendingCount)
  return state.lastAt === null ? labels.sync.state.never : labels.sync.state.upToDate
}

export function describeSyncState(state: SyncState): string {
  if (state.status === "local") return labels.sync.state.local
  return `${describeSyncStatus(state)} · ${formatLastSync(state.lastAt)}`
}
