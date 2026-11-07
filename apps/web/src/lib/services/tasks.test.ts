import { beforeEach, describe, expect, test } from "bun:test"
import type { Db } from "@tickleaf/db"
import { createMemoryDb } from "../test-support/memory-db"
import { completeTask, createTask, getTask, updateTask } from "./tasks"

let db: Db

beforeEach(async () => {
  db = await createMemoryDb()
})

async function reload(id: string) {
  return getTask(db, id)
}

describe("heure d’échéance", () => {
  test("enregistre une heure avec la date", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "14:30", projectId: null })
    expect((await reload(task.id))?.dueTime).toBe("14:30")
  })

  test("refuse une heure sans date à la création", async () => {
    await expect(createTask(db, { title: "Appel", due: null, dueTime: "14:30", projectId: null })).rejects.toThrow()
  })

  test("refuse une heure sans date à la mise à jour", async () => {
    const task = await createTask(db, { title: "Appel", due: null, projectId: null })
    await expect(updateTask(db, task.id, { dueTime: "14:30" })).rejects.toThrow()
  })

  test("refuse une heure mal formée", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", projectId: null })
    await expect(updateTask(db, task.id, { dueTime: "25:00" })).rejects.toThrow()
  })

  test("efface l’heure quand la date est effacée", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "14:30", projectId: null })
    await updateTask(db, task.id, { due: null })
    expect((await reload(task.id))?.dueTime).toBeNull()
  })

  test("garde l’heure quand la date change", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "14:30", projectId: null })
    await updateTask(db, task.id, { due: "2026-11-09" })
    expect((await reload(task.id))?.dueTime).toBe("14:30")
  })

  test("garde l’heure sur l’occurrence suivante", async () => {
    const task = await createTask(db, {
      title: "Appel",
      due: "2026-11-07",
      dueTime: "14:30",
      projectId: null,
      recurrence: { unit: "day", interval: 1 },
    })
    await completeTask(db, task.id, "2026-11-07")
    const next = await reload(task.id)
    expect(next?.due).toBe("2026-11-08")
    expect(next?.dueTime).toBe("14:30")
  })
})
