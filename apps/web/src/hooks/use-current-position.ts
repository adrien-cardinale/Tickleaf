import { useEffect, useSyncExternalStore } from "react"
import { canReadPosition } from "@/lib/places/position"
import { currentPosition, type PositionState, refreshPosition, subscribePosition } from "@/lib/places/position-store"

function refreshWhenVisible(): void {
  if (document.visibilityState === "visible") void refreshPosition()
}

export function useCurrentPosition(enabled: boolean): PositionState {
  const active = enabled && canReadPosition()

  useEffect(() => {
    if (!active) return
    void refreshPosition()
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => document.removeEventListener("visibilitychange", refreshWhenVisible)
  }, [active])

  return useSyncExternalStore(subscribePosition, currentPosition)
}
