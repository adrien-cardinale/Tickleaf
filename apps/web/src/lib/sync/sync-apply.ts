import { type Db, projects, tasks } from "@tickleaf/db"
import { eq, sql } from "@tickleaf/db/orm"
import type { ProjectRowPayload, SyncPayload, TaskRowPayload } from "./sync-schemas"
import type { SyncTableEntry } from "./sync-tables"

export type LocalVersion = { updatedAt: string; syncVersion: number | null }
export type StampedRow = { id: string; updatedAt: string }

export function keepsLocal(local: LocalVersion, incoming: { updatedAt: string }, seq: number): boolean {
  if (local.syncVersion === seq) return true
  return Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)
}

async function applyProject(db: Db, row: ProjectRowPayload, seq: number): Promise<boolean> {
  const [local] = await db.select().from(projects).where(eq(projects.id, row.id))
  if (local && keepsLocal(local, row, seq)) return false
  const values = { ...row, syncVersion: seq }
  await db.insert(projects).values(values).onConflictDoUpdate({ target: projects.id, set: values })
  return true
}

async function applyTask(db: Db, row: TaskRowPayload, seq: number): Promise<boolean> {
  const [local] = await db.select().from(tasks).where(eq(tasks.id, row.id))
  if (local && keepsLocal(local, row, seq)) return false
  const values = { ...row, syncVersion: seq }
  await db.insert(tasks).values(values).onConflictDoUpdate({ target: tasks.id, set: values })
  return true
}

export async function applyPayload(db: Db, payload: SyncPayload, seq: number): Promise<number> {
  let applied = 0
  for (const row of payload.projects) if (await applyProject(db, row, seq)) applied += 1
  for (const row of payload.tasks) if (await applyTask(db, row, seq)) applied += 1
  return applied
}

export async function stampAcceptedRow(db: Db, entry: SyncTableEntry, row: StampedRow, seq: number): Promise<void> {
  await db.run(
    sql`update ${entry.table} set sync_version = ${seq}
        where id = ${row.id} and updated_at = ${row.updatedAt} and sync_version is null`,
  )
}
