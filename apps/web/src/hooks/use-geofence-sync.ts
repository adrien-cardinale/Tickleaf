import { useSyncExternalStore } from "react"
import { currentGeofenceSync, type GeofenceSyncState, subscribeGeofenceSync } from "@/lib/places/geofence-sync"

export function useGeofenceSync(): GeofenceSyncState {
  return useSyncExternalStore(subscribeGeofenceSync, currentGeofenceSync)
}
