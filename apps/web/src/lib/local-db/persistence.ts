import { isSealed, type Vault } from "@/lib/crypto/envelope"
import { idbDelete, idbGet, idbSet } from "./idb"

const DATABASE_ENTRY = "database"
const SQLITE_HEADER = "SQLite format 3\0"
const UNKNOWN_FORMAT = "Base locale illisible : format inconnu"

export type Persistence = {
  load(): Promise<Uint8Array | null>
  save(bytes: Uint8Array): Promise<void>
  remove(): Promise<void>
}

export function createPersistence(entry: string = DATABASE_ENTRY): Persistence {
  return {
    load: () => idbGet(entry),
    save: (bytes) => idbSet(entry, bytes),
    remove: () => idbDelete(entry),
  }
}

function isPlainSqlite(bytes: Uint8Array): boolean {
  return new TextDecoder().decode(bytes.subarray(0, SQLITE_HEADER.length)) === SQLITE_HEADER
}

export function withEncryption(inner: Persistence, vault: Vault): Persistence {
  return {
    load: async () => {
      const bytes = await inner.load()
      if (bytes === null) return null
      if (isSealed(bytes)) return vault.decrypt(bytes)
      if (isPlainSqlite(bytes)) return bytes
      throw new Error(UNKNOWN_FORMAT)
    },
    save: async (bytes) => inner.save(await vault.encrypt(bytes)),
    remove: () => inner.remove(),
  }
}

export type AutoSaverOptions = {
  exportBytes: () => Promise<Uint8Array>
  persistence: Persistence
  delayMs: number
  onError?: (error: unknown) => void
}

export type AutoSaver = {
  schedule(): void
  flush(): Promise<void>
  stop(): Promise<void>
}

export function createAutoSaver({ exportBytes, persistence, delayMs, onError }: AutoSaverOptions): AutoSaver {
  let timer: ReturnType<typeof setTimeout> | null = null
  let dirty = false
  let writing: Promise<void> = Promise.resolve()
  let stopped = false

  const write = async () => {
    if (stopped || !dirty) return
    dirty = false
    await persistence.save(await exportBytes())
  }

  const flush = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
    writing = writing.then(write).catch((error: unknown) => {
      dirty = true
      onError?.(error)
      throw error
    })
    const current = writing
    writing = writing.catch(() => undefined)
    return current
  }

  return {
    schedule: () => {
      if (stopped) return
      dirty = true
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => void flush().catch(() => undefined), delayMs)
    },
    flush,
    stop: async () => {
      stopped = true
      if (timer !== null) clearTimeout(timer)
      timer = null
      await writing
    },
  }
}
