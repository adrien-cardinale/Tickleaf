import { Link } from "@tanstack/react-router"
import { RefreshCw } from "lucide-react"
import { SidebarMenuAction, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import { labels } from "@/lib/labels"
import { describeSyncState, describeSyncStatus } from "@/lib/sync/sync-labels"
import { isSyncConfigured, syncNow, useSyncState } from "@/lib/sync/sync-store"
import { SyncStatusIcon } from "./sync-status-icon"

export function SyncIndicator() {
  const state = useSyncState()
  const { isMobile, setOpenMobile } = useSidebar()
  const description = describeSyncState(state)

  return (
    <>
      <SidebarMenuButton asChild tooltip={description}>
        <Link to="/settings" replace={isMobile} onClick={() => setOpenMobile(false)} aria-label={description}>
          <SyncStatusIcon status={state.status} />
          <span className="truncate">{describeSyncStatus(state)}</span>
        </Link>
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
    </>
  )
}
