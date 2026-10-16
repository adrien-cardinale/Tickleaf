import { type Db, projects, tasks } from "@tickleaf/db"
import { count, isNull, sql } from "@tickleaf/db/orm"

export const SYNC_TABLES = [
  { name: "projects", table: projects },
  { name: "tasks", table: tasks },
] as const

export type SyncTableEntry = (typeof SYNC_TABLES)[number]
export type SyncTableName = SyncTableEntry["name"]

export async function countPendingRows(db: Db): Promise<number> {
  let total = 0
  for (const { table } of SYNC_TABLES) {
    const [row] = await db.select({ pending: count() }).from(table).where(isNull(table.syncVersion))
    total += row?.pending ?? 0
  }
  return total
}

export async function markAllRowsPending(db: Db): Promise<void> {
  for (const { table } of SYNC_TABLES) await db.run(sql`update ${table} set sync_version = null`)
}
