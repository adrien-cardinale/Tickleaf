import { type IsoDate, todayIso } from "@tickleaf/core"
import { useSyncExternalStore } from "react"

const REFRESH_MS = 60_000

function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, REFRESH_MS)
  document.addEventListener("visibilitychange", onChange)
  return () => {
    window.clearInterval(timer)
    document.removeEventListener("visibilitychange", onChange)
  }
}

export function useToday(): IsoDate {
  return useSyncExternalStore(subscribe, () => todayIso())
}
