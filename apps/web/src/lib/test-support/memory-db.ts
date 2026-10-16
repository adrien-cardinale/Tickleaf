import { createProxyDb, type Db, runMigrations } from "@tickleaf/db"
import initSqlJs from "sql.js"
import { applyConnectionPragmas, createSqlJsExecutor } from "../local-db/sqljs-executor"
import type { DbAccess } from "../sync/sync-client"

export async function createMemoryDb(): Promise<Db> {
  const SQL = await initSqlJs()
  const database = new SQL.Database()
  applyConnectionPragmas(database)
  const db = createProxyDb(createSqlJsExecutor(database))
  await runMigrations(db)
  return db
}

export function directAccess(db: Db): DbAccess {
  return (task) => task(db)
}
