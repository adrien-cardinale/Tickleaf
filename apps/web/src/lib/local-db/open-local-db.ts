import { createProxyDb, type Db, runMigrations } from "@tickleaf/db"
import type { Database } from "sql.js"
import type { Vault } from "@/lib/crypto/envelope"
import { labels } from "@/lib/labels"
import { createAutoSaver, createPersistence, databaseEntry, withEncryption } from "./persistence"
import { createSerialQueue } from "./serial-queue"
import { openSqlJsDatabase } from "./sqljs-db"
import { applyConnectionPragmas, createSqlJsExecutor, isWriteStatement } from "./sqljs-executor"

const SAVE_DELAY_MS = 500

export type LocalDatabase = {
  isNew: boolean
  run<Result>(task: (db: Db) => Promise<Result>): Promise<Result>
  flush(): Promise<void>
  erase(): Promise<void>
}

function exportSnapshot(database: Database): Uint8Array {
  const bytes = database.export()
  applyConnectionPragmas(database)
  return bytes
}

function flushWhenHidden(flush: () => Promise<void>): void {
  const flushQuietly = () => void flush().catch(() => undefined)
  window.addEventListener("pagehide", flushQuietly)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushQuietly()
  })
}

export async function openLocalDb(accountId: string, vault: Vault): Promise<LocalDatabase> {
  if (typeof indexedDB === "undefined") throw new Error(labels.boot.noIndexedDb)
  const persistence = withEncryption(createPersistence(databaseEntry(accountId)), vault)
  const initialBytes = await persistence.load()
  const database = await openSqlJsDatabase(initialBytes)
  const queue = createSerialQueue()
  const saver = createAutoSaver({
    persistence,
    delayMs: SAVE_DELAY_MS,
    exportBytes: () => queue(async () => exportSnapshot(database)),
    onError: (error) => console.error("Sauvegarde de la base locale impossible", error),
  })
  const db = createProxyDb(
    createSqlJsExecutor(database, (sql) => {
      if (isWriteStatement(sql)) saver.schedule()
    }),
  )
  await runMigrations(db)
  await saver.flush()
  flushWhenHidden(() => saver.flush())
  return {
    isNew: initialBytes === null,
    run: (task) => queue(() => task(db)),
    flush: () => saver.flush(),
    erase: async () => {
      await saver.stop()
      await persistence.remove()
    },
  }
}
