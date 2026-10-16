import { Cloud, CloudAlert, CloudOff, RefreshCw } from "lucide-react"
import type { SyncStatus } from "@/lib/sync/sync-store"

export function SyncStatusIcon({ status }: { status: SyncStatus }) {
  if (status === "syncing") return <RefreshCw className="animate-spin" />
  if (status === "error") return <CloudAlert className="text-destructive" />
  if (status === "offline" || status === "local") return <CloudOff />
  return <Cloud />
}
