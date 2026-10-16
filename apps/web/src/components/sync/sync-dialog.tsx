import { RefreshCw, TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { labels } from "@/lib/labels"
import { isStaticBuild } from "@/lib/runtime"
import { describeSyncStatus, formatLastSync } from "@/lib/sync/sync-labels"
import { isSyncConfigured, type SyncState, syncNow, useSyncState } from "@/lib/sync/sync-store"
import { ForgetDeviceButton } from "./forget-device-button"
import { RecoveryKeySection } from "./recovery-key-section"
import { ServerUrlForm } from "./server-url-form"

type SyncDialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

function DetailRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  )
}

function serverLabel(state: SyncState): string {
  if (state.serverUrl === null) return labels.sync.dialog.none
  return state.serverUrl === "" ? labels.sync.dialog.sameOrigin : state.serverUrl
}

function SyncDetails({ state }: { state: SyncState }) {
  return (
    <dl className="space-y-2 text-sm">
      <DetailRow term={labels.sync.dialog.status}>{describeSyncStatus(state)}</DetailRow>
      <DetailRow term={labels.sync.dialog.lastSync}>{formatLastSync(state.lastAt)}</DetailRow>
      <DetailRow term={labels.sync.dialog.pending}>{labels.sync.state.pending(state.pendingCount)}</DetailRow>
      {!isStaticBuild() && <DetailRow term={labels.sync.dialog.server}>{serverLabel(state)}</DetailRow>}
    </dl>
  )
}

function SyncError({ message }: { message: string | null }) {
  if (message === null) return null
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{labels.sync.dialog.error}</AlertTitle>
      <AlertDescription className="break-words">{message}</AlertDescription>
    </Alert>
  )
}

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  const state = useSyncState()
  const syncing = state.status === "syncing"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{labels.sync.dialog.title}</DialogTitle>
          <DialogDescription>{labels.sync.dialog.description}</DialogDescription>
        </DialogHeader>
        <SyncDetails state={state} />
        <SyncError message={state.lastError} />
        {isStaticBuild() && <ServerUrlForm current={state.serverUrl} />}
        <Button onClick={() => void syncNow()} disabled={!isSyncConfigured(state) || syncing}>
          <RefreshCw className={syncing ? "animate-spin" : undefined} />
          {labels.sync.syncNow}
        </Button>
        <Separator />
        <RecoveryKeySection />
        <ForgetDeviceButton pendingCount={state.pendingCount} />
      </DialogContent>
    </Dialog>
  )
}
