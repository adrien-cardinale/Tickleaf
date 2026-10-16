import { useRegisterSW } from "virtual:pwa-register/react"
import { useEffect } from "react"
import { toast } from "sonner"
import { labels } from "@/lib/labels"
import { getLocalDatabase } from "@/lib/local-db/current-database"

const UPDATE_TOAST_ID = "pwa-update"

async function reloadAfterSaving(): Promise<void> {
  await getLocalDatabase()
    .flush()
    .catch(() => undefined)
  window.location.reload()
}

function announceUpdate(): void {
  toast(labels.pwa.updateReady, {
    id: UPDATE_TOAST_ID,
    duration: Number.POSITIVE_INFINITY,
    action: { label: labels.pwa.reload, onClick: () => void reloadAfterSaving() },
  })
}

export function PwaUpdater() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
  } = useRegisterSW({ onNeedReload: announceUpdate })

  useEffect(() => {
    if (needRefresh) announceUpdate()
  }, [needRefresh])

  useEffect(() => {
    if (offlineReady) toast.success(labels.pwa.offlineReady)
  }, [offlineReady])

  return null
}
