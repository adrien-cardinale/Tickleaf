import { createFileRoute } from "@tanstack/react-router"
import { AccountsCard } from "@/components/settings/accounts-card"
import { DeviceCard } from "@/components/settings/device-card"
import { ExportCard } from "@/components/settings/export-card"
import { RecoveryKeyCard } from "@/components/settings/recovery-key-card"
import { ShortcutsCard } from "@/components/settings/shortcuts-card"
import { SyncCard } from "@/components/settings/sync-card"
import { UpdateCard } from "@/components/settings/update-card"
import { ViewPage } from "@/components/view-page"
import { labels } from "@/lib/labels"
import { isSyncConfigured, useSyncState } from "@/lib/sync/sync-store"

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const state = useSyncState()

  return (
    <ViewPage title={labels.settings.title} documentTitle={labels.settings.title}>
      <div className="space-y-4">
        <SyncCard state={state} />
        <RecoveryKeyCard serverUrl={state.serverUrl} />
        <AccountsCard />
        <ExportCard />
        <ShortcutsCard />
        <UpdateCard />
        <DeviceCard pendingCount={state.pendingCount} syncConfigured={isSyncConfigured(state)} />
      </div>
    </ViewPage>
  )
}
