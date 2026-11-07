import { nextArmingTime, type Task } from "@tickleaf/core"
import { useEffect, useSyncExternalStore } from "react"
import { currentArmingTime, refreshArmingClock, subscribeArmingClock } from "@/lib/places/arming-clock"

const MAX_ARMING_DELAY_MS = 24 * 60 * 60 * 1000

function refreshWhenVisible(): void {
  if (document.visibilityState === "visible") refreshArmingClock()
}

function armingDelay(next: Date): number {
  return Math.min(Math.max(next.getTime() - Date.now(), 0), MAX_ARMING_DELAY_MS)
}

function useArmingTimer(tasks: readonly Task[], now: Date): void {
  useEffect(() => {
    const next = nextArmingTime(tasks, now)
    const timer = window.setTimeout(refreshArmingClock, next === null ? MAX_ARMING_DELAY_MS : armingDelay(next))
    return () => window.clearTimeout(timer)
  }, [tasks, now])
}

export function useArmingClock(tasks: readonly Task[]): Date {
  const now = useSyncExternalStore(subscribeArmingClock, currentArmingTime)
  useArmingTimer(tasks, now)

  useEffect(() => {
    refreshArmingClock()
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => document.removeEventListener("visibilitychange", refreshWhenVisible)
  }, [])

  return now
}
