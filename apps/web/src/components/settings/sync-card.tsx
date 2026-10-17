import { RefreshCw, TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { ServerUrlForm } from "@/components/sync/server-url-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { labels } from "@/lib/labels"
import { asksForServerUrl } from "@/lib/runtime"
import { describeSyncStatus, formatLastSync } from "@/lib/sync/sync-labels"
import { isSyncConfigured, type SyncState, syncNow } from "@/lib/sync/sync-store"

const text = labels.settings.sync

function DetailRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_1fr]">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="text-sm break-all">{children}</dd>
    </div>
  )
}

function serverLabel(state: SyncState): string {
  if (state.serverUrl === null) return text.none
  return state.serverUrl === "" ? text.sameOrigin : state.serverUrl
}

function SyncDetails({ state }: { state: SyncState }) {
  return (
    <dl className="space-y-2">
      <DetailRow term={text.status}>{describeSyncStatus(state)}</DetailRow>
      <DetailRow term={text.lastSync}>{formatLastSync(state.lastAt)}</DetailRow>
      <DetailRow term={text.pending}>{labels.sync.state.pending(state.pendingCount)}</DetailRow>
      {!asksForServerUrl() && <DetailRow term={text.server}>{serverLabel(state)}</DetailRow>}
    </dl>
  )
}

function SyncError({ message }: { message: string | null }) {
  if (message === null) return null
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{text.error}</AlertTitle>
      <AlertDescription className="break-words">{message}</AlertDescription>
    </Alert>
  )
}

async function synchronizeNow(): Promise<void> {
  const outcome = await syncNow()
  if (outcome.ok) toast.success(labels.sync.report(outcome.report.pulled, outcome.report.pushed))
  else toast.error(outcome.message)
}

export function SyncCard({ state }: { state: SyncState }) {
  const configured = isSyncConfigured(state)
  const syncing = state.status === "syncing"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{configured ? text.configuredDescription : text.unconfiguredDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SyncDetails state={state} />
        <SyncError message={state.lastError} />
        {asksForServerUrl() && <ServerUrlForm current={state.serverUrl} />}
        <Button onClick={() => void synchronizeNow()} disabled={!configured || syncing}>
          <RefreshCw className={syncing ? "animate-spin" : undefined} />
          {labels.sync.syncNow}
        </Button>
      </CardContent>
    </Card>
  )
}
