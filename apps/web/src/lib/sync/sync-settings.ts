import { type Db, syncState } from "@tickleaf/db"
import { inArray } from "@tickleaf/db/orm"

const SYNC_STATE_KEYS = {
  cursor: "cursor",
  lastAt: "last_at",
} as const

type SyncStateName = keyof typeof SYNC_STATE_KEYS

export type SyncSettings = { cursor: number; lastAt: string | null }

export async function readSyncSettings(db: Db): Promise<SyncSettings> {
  const rows = await db
    .select()
    .from(syncState)
    .where(inArray(syncState.key, Object.values(SYNC_STATE_KEYS)))
  const values = new Map(rows.map((row) => [row.key, row.value]))
  return {
    cursor: Number(values.get(SYNC_STATE_KEYS.cursor) ?? 0) || 0,
    lastAt: values.get(SYNC_STATE_KEYS.lastAt) ?? null,
  }
}

export async function writeSyncSetting(db: Db, name: SyncStateName, value: string | number): Promise<void> {
  const text = String(value)
  await db
    .insert(syncState)
    .values({ key: SYNC_STATE_KEYS[name], value: text })
    .onConflictDoUpdate({ target: syncState.key, set: { value: text } })
}
