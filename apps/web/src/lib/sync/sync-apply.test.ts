import { beforeEach, describe, expect, test } from "bun:test"
import { type Db, favoritePlaces, projects, tasks } from "@tickleaf/db"
import { eq } from "@tickleaf/db/orm"
import { createMemoryDb } from "../test-support/memory-db"
import { applyPayload, keepsLocal, stampAcceptedRow } from "./sync-apply"
import { payloadSchema, type TaskRowPayload } from "./sync-schemas"
import { SYNC_TABLES } from "./sync-tables"

const TASK_ID = "task-1"

function taskRow(changes: Partial<TaskRowPayload> = {}): TaskRowPayload {
  return {
    id: TASK_ID,
    title: "Arroser les plantes",
    description: "",
    due: null,
    dueTime: null,
    dueTimeZone: null,
    reminderAt: null,
    recurrence: null,
    place: null,
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
    const applied = await applyPayload(
      db,
      { v: 1, projects: [], sections: [], favoritePlaces: [], tasks: [taskRow()] },
      4,
    )
    expect(applied).toBe(1)
    expect(await readTask(db)).toMatchObject({ title: "Arroser les plantes", syncVersion: 4, deletedAt: null })
  })

  test("le dernier updatedAt gagne", async () => {
    await applyPayload(db, { v: 1, projects: [], sections: [], favoritePlaces: [], tasks: [taskRow()] }, 1)
    const newer = taskRow({ title: "Arroser le basilic", updatedAt: "2026-01-03T00:00:00.000Z" })
    await applyPayload(db, { v: 1, projects: [], sections: [], favoritePlaces: [], tasks: [newer] }, 2)
    const older = taskRow({ title: "Version périmée", updatedAt: "2026-01-02T00:00:00.000Z" })
    expect(await applyPayload(db, { v: 1, projects: [], sections: [], favoritePlaces: [], tasks: [older] }, 3)).toBe(0)
    expect(await readTask(db)).toMatchObject({ title: "Arroser le basilic", syncVersion: 2 })
  })

  test("ne remplace pas une modification locale plus récente en attente", async () => {
    await db.insert(tasks).values({ ...taskRow({ title: "Local", updatedAt: "2026-01-05T00:00:00.000Z" }) })
    await applyPayload(
      db,
      { v: 1, projects: [], sections: [], favoritePlaces: [], tasks: [taskRow({ title: "Distant" })] },
      1,
    )
    expect(await readTask(db)).toMatchObject({ title: "Local", syncVersion: null })
  })

  test("propage une suppression logique, même pour une ligne inconnue", async () => {
    await applyPayload(db, { v: 1, projects: [], sections: [], favoritePlaces: [], tasks: [taskRow()] }, 1)
    const deleted = taskRow({ updatedAt: "2026-01-02T00:00:00.000Z", deletedAt: "2026-01-02T00:00:00.000Z" })
    await applyPayload(db, { v: 1, projects: [], sections: [], favoritePlaces: [], tasks: [deleted] }, 2)
    expect((await readTask(db))?.deletedAt).toBe("2026-01-02T00:00:00.000Z")

    const tombstone = taskRow({ id: "task-2", deletedAt: "2026-01-02T00:00:00.000Z" })
    await applyPayload(db, { v: 1, projects: [], sections: [], favoritePlaces: [], tasks: [tombstone] }, 3)
    expect((await readTask(db, "task-2"))?.deletedAt).toBe("2026-01-02T00:00:00.000Z")
  })

  test("applique les projets", async () => {
    const project = {
      id: "project-1",
      name: "Maison",
      color: "green" as const,
      parentId: null,
      position: 0,
      archivedAt: null,
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:00:00.000Z",
      deletedAt: null,
    }
    await applyPayload(
      db,
      { v: 1, projects: [project], sections: [], favoritePlaces: [], tasks: [taskRow({ projectId: "project-1" })] },
      1,
    )
    const [row] = await db.select().from(projects)
    expect(row).toMatchObject({ name: "Maison", color: "green", syncVersion: 1 })
    expect((await readTask(db))?.projectId).toBe("project-1")
  })

  test("applique le projet parent d'un sous-projet", async () => {
    const base = {
      color: "gray" as const,
      position: 0,
      archivedAt: null,
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:00:00.000Z",
      deletedAt: null,
    }
    const child = { ...base, id: "project-2", name: "Jardin", parentId: "project-1" }
    const parent = { ...base, id: "project-1", name: "Maison", parentId: null }
    await applyPayload(db, { v: 6, projects: [child, parent], sections: [], favoritePlaces: [], tasks: [] }, 1)
    const [row] = await db.select().from(projects).where(eq(projects.id, "project-2"))
    expect(row?.parentId).toBe("project-1")
  })

  test("lit un ancien projet sans parent comme un projet racine", async () => {
    const legacy = {
      v: 5,
      projects: [
        {
          id: "project-1",
          name: "Maison",
          position: 0,
          archivedAt: null,
          createdAt: "2026-01-01T08:00:00.000Z",
          updatedAt: "2026-01-01T08:00:00.000Z",
          deletedAt: null,
        },
      ],
    }
    const payload = payloadSchema.parse(legacy)
    expect(payload.projects[0]?.parentId).toBeNull()
    expect(payload.projects[0]?.color).toBe("gray")
    await applyPayload(db, payload, 1)
    const [row] = await db.select().from(projects)
    expect(row?.parentId).toBeNull()
    expect(row?.color).toBe("gray")
  })

  test("lit une couleur de projet inconnue comme du gris", () => {
    const payload = payloadSchema.parse({
      v: 6,
      projects: [
        {
          id: "project-1",
          name: "Maison",
          color: "#ff0000",
          parentId: null,
          position: 0,
          archivedAt: null,
          createdAt: "2026-01-01T08:00:00.000Z",
          updatedAt: "2026-01-01T08:00:00.000Z",
          deletedAt: null,
        },
      ],
    })
    expect(payload.projects[0]?.color).toBe("gray")
  })

  test("lit une ancienne tâche sans lieu comme une tâche sans lieu", () => {
    const { place: _, ...legacy } = taskRow()
    const payload = payloadSchema.parse({ v: 6, tasks: [legacy] })
    expect(payload.tasks[0]?.place).toBeNull()
  })

  test("applique un lieu favori", async () => {
    const favorite = {
      id: "favorite-1",
      label: "Bureau",
      latitude: 46.5197,
      longitude: 6.6323,
      radius: 250,
      position: 0,
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:00:00.000Z",
      deletedAt: null,
    }
    const applied = await applyPayload(db, payloadSchema.parse({ v: 8, favoritePlaces: [favorite] }), 1)
    expect(applied).toBe(1)
    const [row] = await db.select().from(favoritePlaces)
    expect(row).toMatchObject({ label: "Bureau", latitude: 46.5197, radius: 250, syncVersion: 1 })
  })

  test("lit un ancien envoi sans lieux favoris comme une liste vide", () => {
    expect(payloadSchema.parse({ v: 7, tasks: [] }).favoritePlaces).toEqual([])
  })

  test("applique le lieu d'une tâche", async () => {
    const place = { latitude: 46.5197, longitude: 6.6323, radius: 250, label: "Bureau" }
    await applyPayload(db, payloadSchema.parse({ v: 7, tasks: [taskRow({ place })] }), 1)
    expect((await readTask(db))?.place).toEqual(place)
  })

  test("lit une ancienne tâche sans heure d’échéance comme une tâche sans heure", () => {
    const { dueTime: _, ...legacy } = taskRow({ due: "2026-01-02" })
    const payload = payloadSchema.parse({ v: 8, tasks: [legacy] })
    expect(payload.tasks[0]?.dueTime).toBeNull()
  })

  test("applique l’heure d’échéance d’une tâche", async () => {
    const row = taskRow({ due: "2026-01-02", dueTime: "14:30" })
    await applyPayload(db, payloadSchema.parse({ v: 9, tasks: [row] }), 1)
    expect((await readTask(db))?.dueTime).toBe("14:30")
  })

  test("lit une tâche v9 sans fuseau comme une heure sans fuseau", () => {
    const { dueTimeZone: _, ...legacy } = taskRow({ due: "2026-01-02", dueTime: "14:30" })
    const payload = payloadSchema.parse({ v: 9, tasks: [legacy] })
    expect(payload.tasks[0]).toMatchObject({ dueTime: "14:30", dueTimeZone: null })
  })

  test("garde une heure sans fuseau reçue d’un ancien appareil", async () => {
    const { dueTimeZone: _, ...legacy } = taskRow({ due: "2026-01-02", dueTime: "14:30" })
    await applyPayload(db, payloadSchema.parse({ v: 9, tasks: [legacy] }), 1)
    expect(await readTask(db)).toMatchObject({ dueTime: "14:30", dueTimeZone: null })
  })

  test("applique le fuseau de l’heure d’échéance", async () => {
    const row = taskRow({ due: "2026-01-02", dueTime: "14:30", dueTimeZone: "Europe/Zurich" })
    await applyPayload(db, payloadSchema.parse({ v: 10, tasks: [row] }), 1)
    expect((await readTask(db))?.dueTimeZone).toBe("Europe/Zurich")
  })

  test("efface un fuseau reçu sans heure d’échéance", async () => {
    const row = taskRow({ due: "2026-01-02", dueTime: null, dueTimeZone: "Europe/Zurich" })
    await applyPayload(db, payloadSchema.parse({ v: 10, tasks: [row] }), 1)
    expect((await readTask(db))?.dueTimeZone).toBeNull()
  })

  test("refuse une heure d’échéance mal formée", () => {
    const row = taskRow({ due: "2026-01-02", dueTime: "25:00" })
    expect(payloadSchema.safeParse({ v: 9, tasks: [row] }).success).toBe(false)
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
