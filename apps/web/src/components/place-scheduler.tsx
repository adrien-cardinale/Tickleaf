import type { Task } from "@tickleaf/core"
import { useEffect, useMemo } from "react"
import { useCurrentPosition } from "@/hooks/use-current-position"
import { useGeofenceSync } from "@/hooks/use-geofence-sync"
import { refreshBackgroundGeofences, syncBackgroundGeofences } from "@/lib/places/geofence-sync"
import { notifyArrivals } from "@/lib/places/place-notifications"
import { geofenceTargets } from "@/lib/places/place-plan"
import { useTasks } from "@/lib/queries"

const SYNC_DELAY_MS = 1_000

function logSyncFailure(error: unknown): void {
  console.error("Enregistrement des zones impossible", error)
}

function useBackgroundGeofences(tasks: readonly Task[] | undefined): void {
  useEffect(() => {
    if (!tasks) return
    const debounce = setTimeout(() => syncBackgroundGeofences(tasks).catch(logSyncFailure), SYNC_DELAY_MS)
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshBackgroundGeofences(tasks).catch(logSyncFailure)
    }
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => {
      clearTimeout(debounce)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [tasks])
}

export function PlaceScheduler() {
  const { data: tasks } = useTasks()
  const targets = useMemo(() => geofenceTargets(tasks ?? []), [tasks])
  const reading = useCurrentPosition(targets.length > 0)
  const { status } = useGeofenceSync()
  useBackgroundGeofences(tasks)

  useEffect(() => {
    if (reading.status !== "located" || status === "synced" || status === "pending") return
    notifyArrivals(targets, reading.position).catch((error) =>
      console.error("Notification d’arrivée impossible", error),
    )
  }, [targets, reading, status])

  return null
}
