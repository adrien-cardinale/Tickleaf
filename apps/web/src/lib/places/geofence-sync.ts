import type { Task } from "@tickleaf/core"
import { ensureNotificationPermission } from "@/lib/reminders/reminder-notifications"
import { isAndroid } from "@/lib/runtime"
import {
  checkPermissions,
  clearGeofences,
  type GeofencePermissions,
  requestPermissions,
  syncGeofences,
} from "./geofence-plugin"
import { type GeofenceTarget, geofenceTargets } from "./place-plan"

export type GeofenceSyncStatus = "synced" | "denied" | "empty" | "unsupported"

export type GeofenceSyncState = { status: GeofenceSyncStatus | "pending" | "failed"; registered: number }

let current: GeofenceSyncState = { status: "pending", registered: 0 }
let syncedSignature: string | null = null
let backgroundAsked = false
let running: Promise<unknown> = Promise.resolve()
const listeners = new Set<(state: GeofenceSyncState) => void>()

export function currentGeofenceSync(): GeofenceSyncState {
  return current
}

export function subscribeGeofenceSync(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function onNextGeofenceSync(listener: (state: GeofenceSyncState) => void): void {
  const once = (state: GeofenceSyncState) => {
    listeners.delete(once)
    listener(state)
  }
  listeners.add(once)
}

function publish(state: GeofenceSyncState): void {
  current = state
  for (const listener of [...listeners]) listener(state)
}

function settle(status: GeofenceSyncStatus, registered = 0): GeofenceSyncStatus {
  publish({ status, registered })
  return status
}

function targetSignature(target: GeofenceTarget): string {
  return `${target.id}|${target.latitude}|${target.longitude}|${target.radius}|${target.title}|${target.body}`
}

function targetsSignature(targets: readonly GeofenceTarget[]): string {
  return targets.map(targetSignature).join("\n")
}

function canAsk(permissions: GeofencePermissions): boolean {
  return permissions.location !== "denied" && permissions.backgroundLocation !== "denied"
}

async function hasBackgroundPermission(): Promise<boolean> {
  const permissions = await checkPermissions()
  if (permissions.backgroundLocation === "granted") return true
  if (backgroundAsked || !canAsk(permissions)) return false
  backgroundAsked = true
  return (await requestPermissions()).backgroundLocation === "granted"
}

async function register(targets: readonly GeofenceTarget[], signature: string): Promise<GeofenceSyncStatus> {
  if (!(await hasBackgroundPermission())) {
    syncedSignature = null
    return settle("denied")
  }
  await ensureNotificationPermission()
  const registered = await syncGeofences(targets)
  syncedSignature = signature
  return settle("synced", registered)
}

async function clear(signature: string): Promise<GeofenceSyncStatus> {
  await clearGeofences()
  syncedSignature = signature
  return settle("empty")
}

async function sync(tasks: readonly Task[], force: boolean): Promise<GeofenceSyncStatus> {
  if (!isAndroid()) return settle("unsupported")
  const targets = geofenceTargets(tasks)
  const signature = targetsSignature(targets)
  if (!force && signature === syncedSignature) return current.status === "synced" ? "synced" : "empty"
  try {
    return await (targets.length === 0 ? clear(signature) : register(targets, signature))
  } catch (error) {
    syncedSignature = null
    publish({ status: "failed", registered: 0 })
    throw error
  }
}

function serialized<T>(run: () => Promise<T>): Promise<T> {
  const next = running.then(run, run)
  running = next.catch(() => undefined)
  return next
}

export function syncBackgroundGeofences(tasks: readonly Task[]): Promise<GeofenceSyncStatus> {
  return serialized(() => sync(tasks, false))
}

export function refreshBackgroundGeofences(tasks: readonly Task[]): Promise<GeofenceSyncStatus> {
  return serialized(() => sync(tasks, true))
}

export function requestBackgroundGeofences(tasks: readonly Task[]): Promise<GeofenceSyncStatus> {
  return serialized(async () => {
    backgroundAsked = true
    await requestPermissions()
    return sync(tasks, true)
  })
}
