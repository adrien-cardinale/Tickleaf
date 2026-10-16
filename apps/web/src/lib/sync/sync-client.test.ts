import { beforeEach, describe, expect, test } from "bun:test"
import type { Db } from "@tickleaf/db"
import { deriveVault, type Vault } from "../crypto/envelope"
import { generateMasterKey } from "../crypto/master-key"
import { createProject, listProjects, removeProject } from "../services/projects"
import { createTask, deleteTask, listAllTasks, updateTask } from "../services/tasks"
import { createMemoryDb, directAccess } from "../test-support/memory-db"
import { type FetchLike, SyncError, synchronize } from "./sync-client"
import { countPendingRows } from "./sync-tables"

const SERVER_URL = "https://tickleaf.test"

type Relay = { fetch: FetchLike; entries: string[] }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function fakeRelay(vault: Vault): Relay {
  const entries: string[] = []
  const expected = `Bearer ${vault.credentials.userId}.${vault.credentials.secret}`
  const relayFetch: FetchLike = async (url, init) => {
    const headers = init.headers as Record<string, string>
    if (headers.Authorization !== expected) return json({ error: "Accès refusé" }, 401)
    const { pathname, searchParams } = new URL(url)
    if (pathname === "/api/log" && init.method === "GET") {
      const since = Number(searchParams.get("since"))
      const limit = Number(searchParams.get("limit"))
      const page = entries.slice(since, since + limit).map((data, index) => ({ seq: since + index + 1, data }))
      const cursor = page.at(-1)?.seq ?? since
      return json({ entries: page, cursor, hasMore: cursor < entries.length })
    }
    if (pathname === "/api/log" && init.method === "POST") {
      entries.push((JSON.parse(String(init.body)) as { data: string }).data)
      return json({ seq: entries.length }, 201)
    }
    return json({ error: "Introuvable" }, 404)
  }
  return { fetch: relayFetch, entries }
}

let vault: Vault
let relay: Relay
let deviceA: Db
let deviceB: Db

beforeEach(async () => {
  vault = await deriveVault(generateMasterKey())
  relay = fakeRelay(vault)
  deviceA = await createMemoryDb()
  deviceB = await createMemoryDb()
})

function sync(db: Db, options: { vault?: Vault; pushBatchSize?: number; pullPageSize?: number } = {}) {
  return synchronize({
    serverUrl: SERVER_URL,
    vault: options.vault ?? vault,
    fetch: relay.fetch,
    access: directAccess(db),
    pushBatchSize: options.pushBatchSize,
    pullPageSize: options.pullPageSize,
  })
}

describe("synchronize", () => {
  test("transmet projets et tâches d'un appareil à l'autre", async () => {
    const project = await createProject(deviceA, "Maison")
    await createTask(deviceA, { title: "Acheter des ampoules", due: null, projectId: project.id })
    const pushed = await sync(deviceA)
    expect(pushed.pushed).toBe(2)
    expect(await countPendingRows(deviceA)).toBe(0)

    const pulled = await sync(deviceB)
    expect(pulled.pulled).toBe(2)
    expect((await listProjects(deviceB)).map((row) => row.name)).toEqual(["Maison"])
    expect((await listAllTasks(deviceB)).map((row) => row.projectId)).toEqual([project.id])
  })

  test("le serveur ne voit que du chiffré", async () => {
    await createTask(deviceA, { title: "Secret bien gardé", due: null, projectId: null })
    await sync(deviceA)
    expect(relay.entries.join("")).not.toContain("Secret")
  })

  test("propage les modifications et les suppressions", async () => {
    const task = await createTask(deviceA, { title: "Appeler le dentiste", due: null, projectId: null })
    const project = await createProject(deviceA, "Perso")
    await sync(deviceA)
    await sync(deviceB)

    await Bun.sleep(2)
    await updateTask(deviceB, task.id, { title: "Appeler le dentiste demain" })
    await removeProject(deviceB, project.id)
    await sync(deviceB)
    await sync(deviceA)
    expect((await listAllTasks(deviceA)).map((row) => row.title)).toEqual(["Appeler le dentiste demain"])
    expect(await listProjects(deviceA)).toEqual([])

    await Bun.sleep(2)
    await deleteTask(deviceA, task.id)
    await sync(deviceA)
    await sync(deviceB)
    expect(await listAllTasks(deviceB)).toEqual([])
  })

  test("envoie par lots et pagine la lecture", async () => {
    for (let index = 0; index < 5; index += 1) {
      await createTask(deviceA, { title: `Tâche ${index}`, due: null, projectId: null })
    }
    await sync(deviceA, { pushBatchSize: 2 })
    expect(relay.entries.length).toBe(3)
    const report = await sync(deviceB, { pullPageSize: 1 })
    expect(report.pulled).toBe(5)
    expect(report.cursor).toBe(3)
  })

  test("s'arrête avec une erreur claire sur une entrée indéchiffrable", async () => {
    const stranger = await deriveVault(generateMasterKey())
    relay.entries.push(await stranger.encryptText(JSON.stringify({ v: 1, projects: [], tasks: [] })))
    const failure = await sync(deviceA).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(SyncError)
    expect((failure as SyncError).kind).toBe("unreadable")
  })

  test("refuse une clé qui ne correspond pas au compte", async () => {
    const other = await deriveVault(generateMasterKey())
    const failure = await sync(deviceA, { vault: other }).catch((error: unknown) => error)
    expect((failure as SyncError).kind).toBe("unauthorized")
  })
})
