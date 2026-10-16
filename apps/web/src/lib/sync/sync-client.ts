import type { Db } from "@tickleaf/db"
import { and, asc, gt, isNull } from "@tickleaf/db/orm"
import { z } from "zod"
import type { Vault } from "@/lib/crypto/envelope"
import { labels } from "@/lib/labels"
import { applyPayload, stampAcceptedRow } from "./sync-apply"
import { PAYLOAD_VERSION, payloadHeaderSchema, payloadSchema, type SyncPayload } from "./sync-schemas"
import { readSyncSettings, writeSyncSetting } from "./sync-settings"
import { SYNC_TABLES, type SyncTableEntry, type SyncTableName } from "./sync-tables"

export const PUSH_BATCH_SIZE = 200
export const PULL_PAGE_SIZE = 100
const REQUEST_TIMEOUT_MS = 15_000

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>
export type DbAccess = <Result>(task: (db: Db) => Promise<Result>) => Promise<Result>

export type SyncConfig = {
  serverUrl: string
  vault: Vault
  fetch: FetchLike
  access: DbAccess
  pushBatchSize?: number
  pullPageSize?: number
}

export type SyncReport = { pulled: number; pushed: number; cursor: number }

export type SyncErrorKind = "network" | "unauthorized" | "server" | "unreadable"

export class SyncError extends Error {
  constructor(
    message: string,
    readonly kind: SyncErrorKind,
  ) {
    super(message)
  }
}

const pullResponseSchema = z.object({
  cursor: z.number().int().min(0),
  hasMore: z.boolean(),
  entries: z.array(z.object({ seq: z.number().int().min(1), data: z.string() })),
})

const pushResponseSchema = z.object({ seq: z.number().int().min(1) })

type PushedRow = { id: string; updatedAt: string; syncVersion?: number | null }
type PushBatch = { rows: Map<SyncTableEntry, PushedRow[]>; rowCount: number }
type PushCursor = { exhausted: Set<SyncTableName>; lastIds: Map<SyncTableName, string> }
type DecodedEntry = { seq: number; payload: SyncPayload }

const STATUS_MESSAGES: Record<number, string> = {
  403: labels.sync.errors.registrationClosed,
  413: labels.sync.errors.quota,
}

async function serverMessageOf(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") return body.error
  } catch {}
  return labels.sync.errors.serverStatus(response.status)
}

async function ensureOk(response: Response): Promise<void> {
  if (response.ok) return
  if (response.status === 401) throw new SyncError(labels.sync.errors.unauthorized, "unauthorized")
  throw new SyncError(STATUS_MESSAGES[response.status] ?? (await serverMessageOf(response)), "server")
}

function authorizationOf(vault: Vault): string {
  const { userId, secret } = vault.credentials
  return `Bearer ${userId}.${secret}`
}

async function send(config: SyncConfig, path: string, init: RequestInit): Promise<Response> {
  try {
    return await config.fetch(`${config.serverUrl}${path}`, {
      ...init,
      headers: { Authorization: authorizationOf(config.vault), "Content-Type": "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new SyncError(labels.sync.errors.network, "network")
  }
}

async function requestJson<Schema extends z.ZodType>(
  config: SyncConfig,
  path: string,
  init: RequestInit,
  schema: Schema,
): Promise<z.output<Schema>> {
  const response = await send(config, path, init)
  await ensureOk(response)
  const parsed = schema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) throw new SyncError(labels.sync.errors.invalidResponse, "server")
  return parsed.data
}

async function decryptEntry(vault: Vault, data: string): Promise<unknown> {
  try {
    return JSON.parse(await vault.decryptText(data))
  } catch {
    return undefined
  }
}

export async function decodeEntry(vault: Vault, entry: { seq: number; data: string }): Promise<DecodedEntry> {
  const plain = await decryptEntry(vault, entry.data)
  if (plain === undefined) throw new SyncError(labels.sync.errors.unreadable(entry.seq), "unreadable")
  const header = payloadHeaderSchema.safeParse(plain)
  if (header.success && header.data.v > PAYLOAD_VERSION) {
    throw new SyncError(labels.sync.errors.newerVersion(entry.seq), "unreadable")
  }
  const payload = payloadSchema.safeParse(plain)
  if (!payload.success) throw new SyncError(labels.sync.errors.invalidEntry(entry.seq), "unreadable")
  return { seq: entry.seq, payload: payload.data }
}

async function pullPage(config: SyncConfig, since: number) {
  const path = `/api/log?since=${since}&limit=${config.pullPageSize ?? PULL_PAGE_SIZE}`
  const page = await requestJson(config, path, { method: "GET" }, pullResponseSchema)
  const decoded: DecodedEntry[] = []
  for (const entry of page.entries) decoded.push(await decodeEntry(config.vault, entry))
  const applied = await config.access((db) =>
    db.transaction(async (tx) => {
      let count = 0
      for (const entry of decoded) count += await applyPayload(tx, entry.payload, entry.seq)
      await writeSyncSetting(tx, "cursor", page.cursor)
      return count
    }),
  )
  return { cursor: page.cursor, hasMore: page.hasMore, applied }
}

async function pullAll(config: SyncConfig, since: number): Promise<{ cursor: number; pulled: number }> {
  let cursor = since
  let pulled = 0
  for (;;) {
    const page = await pullPage(config, cursor)
    pulled += page.applied
    if (page.hasMore && page.cursor <= cursor) throw new SyncError(labels.sync.errors.invalidResponse, "server")
    cursor = page.cursor
    if (!page.hasMore) return { cursor, pulled }
  }
}

async function readPendingRows(db: Db, entry: SyncTableEntry, afterId: string, limit: number): Promise<PushedRow[]> {
  const { table } = entry
  return db
    .select()
    .from(table)
    .where(and(isNull(table.syncVersion), gt(table.id, afterId)))
    .orderBy(asc(table.id))
    .limit(limit)
}

async function readPushBatch(db: Db, cursor: PushCursor, size: number): Promise<PushBatch | null> {
  const batch: PushBatch = { rows: new Map(), rowCount: 0 }
  for (const entry of SYNC_TABLES) {
    const room = size - batch.rowCount
    if (room <= 0) break
    if (cursor.exhausted.has(entry.name)) continue
    const rows = await readPendingRows(db, entry, cursor.lastIds.get(entry.name) ?? "", room)
    if (rows.length < room) cursor.exhausted.add(entry.name)
    const last = rows.at(-1)
    if (!last) continue
    cursor.lastIds.set(entry.name, last.id)
    batch.rows.set(entry, rows)
    batch.rowCount += rows.length
  }
  return batch.rowCount > 0 ? batch : null
}

function withoutSyncVersion({ syncVersion: _, ...row }: PushedRow) {
  return row
}

function serializeBatch(batch: PushBatch): string {
  const payload: Record<string, unknown> = { v: PAYLOAD_VERSION }
  for (const [entry, rows] of batch.rows) payload[entry.name] = rows.map(withoutSyncVersion)
  return JSON.stringify(payload)
}

type PushSummary = { cursor: number; pushed: number; missedChanges: boolean }

async function stampBatch(db: Db, batch: PushBatch, seq: number): Promise<void> {
  for (const [entry, rows] of batch.rows) {
    for (const row of rows) await stampAcceptedRow(db, entry, row, seq)
  }
}

async function pushBatch(config: SyncConfig, batch: PushBatch, summary: PushSummary): Promise<void> {
  const body = JSON.stringify({ data: await config.vault.encryptText(serializeBatch(batch)) })
  const { seq } = await requestJson(config, "/api/log", { method: "POST", body }, pushResponseSchema)
  const contiguous = !summary.missedChanges && seq === summary.cursor + 1
  await config.access((db) =>
    db.transaction(async (tx) => {
      await stampBatch(tx, batch, seq)
      if (contiguous) await writeSyncSetting(tx, "cursor", seq)
    }),
  )
  summary.pushed += batch.rowCount
  if (contiguous) summary.cursor = seq
  else summary.missedChanges = true
}

async function pushAll(config: SyncConfig, cursor: number): Promise<PushSummary> {
  const summary: PushSummary = { cursor, pushed: 0, missedChanges: false }
  const pushCursor: PushCursor = { exhausted: new Set(), lastIds: new Map() }
  const size = config.pushBatchSize ?? PUSH_BATCH_SIZE
  for (;;) {
    const batch = await config.access((db) => readPushBatch(db, pushCursor, size))
    if (!batch) return summary
    await pushBatch(config, batch, summary)
  }
}

export async function synchronize(config: SyncConfig): Promise<SyncReport> {
  const { cursor: storedCursor } = await config.access(readSyncSettings)
  const pulled = await pullAll(config, storedCursor)
  const pushed = await pushAll(config, pulled.cursor)
  const report = { pulled: pulled.pulled, pushed: pushed.pushed, cursor: pushed.cursor }
  if (pushed.missedChanges) {
    const caughtUp = await pullAll(config, pushed.cursor)
    report.pulled += caughtUp.pulled
    report.cursor = caughtUp.cursor
  }
  await config.access((db) => writeSyncSetting(db, "lastAt", new Date().toISOString()))
  return report
}
