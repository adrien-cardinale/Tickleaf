import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { SidebarMenuAction, SidebarMenuButton } from "@/components/ui/sidebar"
import { labels } from "@/lib/labels"
import { describeSyncState, describeSyncStatus } from "@/lib/sync/sync-labels"
import { isSyncConfigured, syncNow, useSyncState } from "@/lib/sync/sync-store"
import { SyncDialog } from "./sync-dialog"
import { SyncStatusIcon } from "./sync-status-icon"

export function SyncIndicator() {
  const state = useSyncState()
  const [open, setOpen] = useState(false)
  const description = describeSyncState(state)

  return (
    <>
      <SidebarMenuButton tooltip={description} onClick={() => setOpen(true)} aria-label={description}>
        <SyncStatusIcon status={state.status} />
        <span className="truncate">{describeSyncStatus(state)}</span>
      </SidebarMenuButton>
      {isSyncConfigured(state) && (
        <SidebarMenuAction
          title={labels.sync.syncNow}
          aria-label={labels.sync.syncNow}
          disabled={state.status === "syncing"}
          onClick={() => void syncNow()}
        >
          <RefreshCw />
        </SidebarMenuAction>
      )}
      <SyncDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
