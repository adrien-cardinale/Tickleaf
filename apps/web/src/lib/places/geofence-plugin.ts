import { invoke } from "@tauri-apps/api/core"
import type { GeofenceTarget } from "./place-plan"

export type PermissionState = "granted" | "denied" | "prompt" | "prompt-with-rationale"

export type GeofencePermissions = { location: PermissionState; backgroundLocation: PermissionState }

export function checkPermissions(): Promise<GeofencePermissions> {
  return invoke("plugin:geofence|check_permissions")
}

export function requestPermissions(): Promise<GeofencePermissions> {
  return invoke("plugin:geofence|request_permissions")
}

export async function syncGeofences(targets: readonly GeofenceTarget[]): Promise<number> {
  const { registered } = await invoke<{ registered: number }>("plugin:geofence|sync_geofences", { targets })
  return registered
}

export function clearGeofences(): Promise<void> {
  return invoke("plugin:geofence|clear_geofences")
}
