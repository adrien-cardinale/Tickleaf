import { beforeEach, describe, expect, test } from "bun:test"
import { type Db, projects, tasks } from "@tickleaf/db"
import { eq } from "@tickleaf/db/orm"
import { createMemoryDb } from "../test-support/memory-db"
import { applyPayload, keepsLocal, stampAcceptedRow } from "./sync-apply"
import type { TaskRowPayload } from "./sync-schemas"
import { SYNC_TABLES } from "./sync-tables"

const TASK_ID = "task-1"

function taskRow(changes: Partial<TaskRowPayload> = {}): TaskRowPayload {
  return {
    id: TASK_ID,
    title: "Arroser les plantes",
    description: "",
    due: null,
    reminderAt: null,
    recurrence: null,
    priority: 4,
    projectId: null,
    sectionId: null,
    parentId: null,
    position: 0,
    completedAt: null,
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: "2026-01-01T08:00:00.000Z",
    deletedAt: null,
    ...changes,
  }
}

async function readTask(db: Db, id = TASK_ID) {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id))
  return row
}

let db: Db

beforeEach(async () => {
  db = await createMemoryDb()
})

describe("keepsLocal", () => {
  test("garde la ligne locale plus récente", () => {
    const local = { updatedAt: "2026-01-02T00:00:00.000Z", syncVersion: null }
    expect(keepsLocal(local, { updatedAt: "2026-01-01T00:00:00.000Z" }, 3)).toBe(true)
  })

  test("accepte une ligne entrante plus récente ou de même date", () => {
    const local = { updatedAt: "2026-01-01T00:00:00.000Z", syncVersion: 1 }
    expect(keepsLocal(local, { updatedAt: "2026-01-02T00:00:00.000Z" }, 3)).toBe(false)
    expect(keepsLocal(local, { updatedAt: "2026-01-01T00:00:00.000Z" }, 3)).toBe(false)
  })

  test("ignore l'écho de sa propre entrée", () => {
    const local = { updatedAt: "2026-01-01T00:00:00.000Z", syncVersion: 3 }
    expect(keepsLocal(local, { updatedAt: "2026-01-01T00:00:00.000Z" }, 3)).toBe(true)
  })
})

describe("applyPayload", () => {
  test("insère une ligne inconnue avec la version du serveur", async () => {
    const applied = await applyPayload(db, { v: 1, projects: [], sections: [], tasks: [taskRow()] }, 4)
    expect(applied).toBe(1)
    expect(await readTask(db)).toMatchObject({ title: "Arroser les plantes", syncVersion: 4, deletedAt: null })
  })

  test("le dernier updatedAt gagne", async () => {
    await applyPayload(db, { v: 1, projects: [], sections: [], tasks: [taskRow()] }, 1)
    const newer = taskRow({ title: "Arroser le basilic", updatedAt: "2026-01-03T00:00:00.000Z" })
    await applyPayload(db, { v: 1, projects: [], sections: [], tasks: [newer] }, 2)
    const older = taskRow({ title: "Version périmée", updatedAt: "2026-01-02T00:00:00.000Z" })
    expect(await applyPayload(db, { v: 1, projects: [], sections: [], tasks: [older] }, 3)).toBe(0)
    expect(await readTask(db)).toMatchObject({ title: "Arroser le basilic", syncVersion: 2 })
  })

  test("ne remplace pas une modification locale plus récente en attente", async () => {
    await db.insert(tasks).values({ ...taskRow({ title: "Local", updatedAt: "2026-01-05T00:00:00.000Z" }) })
    await applyPayload(db, { v: 1, projects: [], sections: [], tasks: [taskRow({ title: "Distant" })] }, 1)
    expect(await readTask(db)).toMatchObject({ title: "Local", syncVersion: null })
  })

  test("propage une suppression logique, même pour une ligne inconnue", async () => {
    await applyPayload(db, { v: 1, projects: [], sections: [], tasks: [taskRow()] }, 1)
    const deleted = taskRow({ updatedAt: "2026-01-02T00:00:00.000Z", deletedAt: "2026-01-02T00:00:00.000Z" })
    await applyPayload(db, { v: 1, projects: [], sections: [], tasks: [deleted] }, 2)
    expect((await readTask(db))?.deletedAt).toBe("2026-01-02T00:00:00.000Z")

    const tombstone = taskRow({ id: "task-2", deletedAt: "2026-01-02T00:00:00.000Z" })
    await applyPayload(db, { v: 1, projects: [], sections: [], tasks: [tombstone] }, 3)
    expect((await readTask(db, "task-2"))?.deletedAt).toBe("2026-01-02T00:00:00.000Z")
  })

  test("applique les projets", async () => {
    const project = {
      id: "project-1",
      name: "Maison",
      position: 0,
      archivedAt: null,
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:00:00.000Z",
      deletedAt: null,
    }
    await applyPayload(db, { v: 1, projects: [project], sections: [], tasks: [taskRow({ projectId: "project-1" })] }, 1)
    const [row] = await db.select().from(projects)
    expect(row).toMatchObject({ name: "Maison", syncVersion: 1 })
    expect((await readTask(db))?.projectId).toBe("project-1")
  })
})

describe("stampAcceptedRow", () => {
  const entry = SYNC_TABLES[2]

  test("tamponne une ligne inchangée depuis l'envoi", async () => {
    await db.insert(tasks).values(taskRow())
    await stampAcceptedRow(db, entry, { id: TASK_ID, updatedAt: taskRow().updatedAt }, 7)
    expect((await readTask(db))?.syncVersion).toBe(7)
  })

  test("laisse en attente une ligne modifiée pendant l'envoi", async () => {
    await db.insert(tasks).values(taskRow({ updatedAt: "2026-01-09T00:00:00.000Z" }))
    await stampAcceptedRow(db, entry, { id: TASK_ID, updatedAt: taskRow().updatedAt }, 7)
    expect((await readTask(db))?.syncVersion).toBeNull()
  })
})
