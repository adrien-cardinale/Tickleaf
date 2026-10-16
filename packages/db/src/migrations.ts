import { sql } from "drizzle-orm"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import type { Db } from "./client"
import { GENERATED_MIGRATIONS } from "./migrations.generated"

export type Migration = { tag: string; when: number; sql: string }

export const MIGRATIONS: readonly Migration[] = GENERATED_MIGRATIONS

const FOREIGN_KEYS_OFF = /PRAGMA foreign_keys\s*=\s*OFF/i
const STATEMENT_BREAKPOINT = "--> statement-breakpoint"

const appliedMigrations = sqliteTable("__tickleaf_migrations", {
  tag: text("tag").primaryKey(),
  appliedAt: text("applied_at"),
})

export function migrationStatements(migration: Migration): string[] {
  return migration.sql
    .split(STATEMENT_BREAKPOINT)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
}

async function recordApplied(db: Db, tags: string[]): Promise<void> {
  if (tags.length === 0) return
  const appliedAt = new Date().toISOString()
  await db.insert(appliedMigrations).values(tags.map((tag) => ({ tag, appliedAt })))
}

async function loadAppliedTags(db: Db): Promise<Set<string>> {
  await db.run(sql`create table if not exists ${appliedMigrations} (tag text primary key not null, applied_at text)`)
  const rows = await db.select({ tag: appliedMigrations.tag }).from(appliedMigrations)
  return new Set(rows.map((row) => row.tag))
}

// SQLite ignores PRAGMA foreign_keys inside a transaction: table rebuilds must switch it off beforehand.
async function applyMigration(db: Db, migration: Migration): Promise<void> {
  if (FOREIGN_KEYS_OFF.test(migration.sql)) await db.run(sql`PRAGMA foreign_keys=OFF`)
  await db.transaction(async (tx) => {
    for (const statement of migrationStatements(migration)) await tx.run(sql.raw(statement))
    await recordApplied(tx, [migration.tag])
  })
}

export async function runMigrations(db: Db, migrations: readonly Migration[] = MIGRATIONS): Promise<void> {
  const applied = await loadAppliedTags(db)
  for (const migration of migrations) {
    if (!applied.has(migration.tag)) await applyMigration(db, migration)
  }
}
