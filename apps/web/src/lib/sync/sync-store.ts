import type { QueryClient } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"
import { changeAccount } from "@/lib/account/accounts"
import { getCurrentAccount, setCurrentAccount } from "@/lib/account/current-account"
import { getVault } from "@/lib/crypto/current-vault"
import { labels } from "@/lib/labels"
import { getLocalDatabase } from "@/lib/local-db/current-database"
import { invalidateData, onLocalWrite } from "@/lib/queries"
import { runtimeFetch } from "@/lib/runtime"
import { resolveServerUrl } from "./server-url"
import { deleteRemoteAccount, type SyncConfig, SyncError, type SyncReport, synchronize } from "./sync-client"
import { readSyncSettings, writeSyncSetting } from "./sync-settings"
import { countPendingRows, markAllRowsPending } from "./sync-tables"

const SYNC_INTERVAL_MS = 5 * 60 * 1000
const WRITE_DELAY_MS = 5 * 1000

export type SyncStatus = "idle" | "syncing" | "error" | "offline" | "local"

export type SyncState = {
  status: SyncStatus
  serverUrl: string | null
  lastAt: string | null
  lastError: string | null
  pendingCount: number
}

export type SyncOutcome = { ok: true; report: SyncReport } | { ok: false; message: string }

let state: SyncState = { status: "idle", serverUrl: null, lastAt: null, lastError: null, pendingCount: 0 }
const listeners = new Set<() => void>()
let running: Promise<SyncOutcome> | null = null
let queryClient: QueryClient | null = null
let writeTimer: ReturnType<typeof setTimeout> | null = null
let started = false
let paused = false

function setState(changes: Partial<SyncState>): void {
  state = { ...state, ...changes }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSyncState(): SyncState {
  return state
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribe, getSyncState)
}

export function isSyncConfigured(current: SyncState = state): boolean {
  return current.serverUrl !== null
}

async function refreshSyncState(): Promise<void> {
  const { settings, pendingCount } = await getLocalDatabase().run(async (db) => ({
    settings: await readSyncSettings(db),
    pendingCount: await countPendingRows(db),
  }))
  const serverUrl = resolveServerUrl()
  setState({
    serverUrl,
    lastAt: settings.lastAt,
    pendingCount,
    ...(serverUrl === null ? { status: "local" as const, lastError: null } : {}),
  })
}

function syncConfigFor(serverUrl: string): SyncConfig {
  const database = getLocalDatabase()
  return {
    serverUrl,
    vault: getVault(),
    fetch: runtimeFetch,
    access: (task) => database.run(task),
  }
}

function statusAfter(error: unknown): SyncStatus {
  return error instanceof SyncError && error.kind === "network" ? "offline" : "error"
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : labels.sync.errors.unexpected
}

async function runSynchronization(): Promise<SyncOutcome> {
  const serverUrl = resolveServerUrl()
  if (serverUrl === null) {
    await refreshSyncState()
    return { ok: false, message: labels.sync.state.local }
  }
  setState({ status: "syncing", serverUrl })
  try {
    const report = await synchronize(syncConfigFor(serverUrl))
    if (report.pulled > 0 && queryClient) await invalidateData(queryClient)
    setState({ status: "idle", lastError: null })
    return { ok: true, report }
  } catch (error) {
    const message = messageOf(error)
    setState({ status: statusAfter(error), lastError: message })
    return { ok: false, message }
  } finally {
    await refreshSyncState().catch(() => undefined)
  }
}

export function syncNow(): Promise<SyncOutcome> {
  running ??= runSynchronization().finally(() => {
    running = null
  })
  return running
}

function syncInBackground(): void {
  if (!paused && isSyncConfigured()) void syncNow()
}

function scheduleAfterWrite(): void {
  void refreshSyncState().catch(() => undefined)
  if (writeTimer !== null) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    syncInBackground()
  }, WRITE_DELAY_MS)
}

export async function changeServerUrl(serverUrl: string | null): Promise<SyncOutcome> {
  const account = getCurrentAccount()
  await changeAccount(account.id, { serverUrl })
  setCurrentAccount({ ...account, serverUrl })
  await getLocalDatabase().run(async (db) => {
    await writeSyncSetting(db, "cursor", 0)
    await markAllRowsPending(db)
  })
  setState({ lastError: null, status: "idle" })
  return syncNow()
}

let intervalTimer: ReturnType<typeof setInterval> | null = null

function startTimers(): void {
  intervalTimer ??= setInterval(syncInBackground, SYNC_INTERVAL_MS)
}

function stopTimers(): void {
  if (intervalTimer !== null) clearInterval(intervalTimer)
  if (writeTimer !== null) clearTimeout(writeTimer)
  intervalTimer = null
  writeTimer = null
}

export async function stopSync(): Promise<void> {
  paused = true
  stopTimers()
  await running?.catch(() => undefined)
}

export async function deleteServerAccount(): Promise<void> {
  const serverUrl = resolveServerUrl()
  if (serverUrl === null) throw new Error(labels.sync.state.local)
  await stopSync()
  try {
    await deleteRemoteAccount(syncConfigFor(serverUrl))
  } catch (error) {
    paused = false
    startTimers()
    throw error
  }
}

function syncWhenVisible(): void {
  if (document.visibilityState === "visible") syncInBackground()
}

export function startSyncScheduler(client: QueryClient): void {
  queryClient = client
  if (started) return
  started = true
  onLocalWrite(scheduleAfterWrite)
  startTimers()
  document.addEventListener("visibilitychange", syncWhenVisible)
  window.addEventListener("online", syncInBackground)
  void refreshSyncState()
    .then(syncInBackground)
    .catch(() => undefined)
}
