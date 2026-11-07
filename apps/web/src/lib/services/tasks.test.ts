import { beforeEach, describe, expect, test } from "bun:test"
import { type Db, tasks } from "@tickleaf/db"
import { eq } from "@tickleaf/db/orm"
import { createMemoryDb } from "../test-support/memory-db"
import { deviceTimeZone } from "./clock"
import { completeTask, createTask, getTask, rescheduleOverdue, updateTask } from "./tasks"

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

describe("fuseau de l’heure d’échéance", () => {
  async function savedIn(id: string, dueTimeZone: string) {
    await db.update(tasks).set({ dueTimeZone }).where(eq(tasks.id, id))
  }

  test("enregistre le fuseau de l’appareil avec l’heure", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "14:30", projectId: null })
    expect(task.dueTimeZone).toBe(deviceTimeZone())
    expect((await reload(task.id))?.dueTimeZone).toBe(deviceTimeZone())
  })

  test("n’enregistre aucun fuseau sans heure", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", projectId: null })
    expect((await reload(task.id))?.dueTimeZone).toBeNull()
  })

  test("remplace le fuseau quand l’heure change", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "14:30", projectId: null })
    await savedIn(task.id, "Asia/Kolkata")
    await updateTask(db, task.id, { dueTime: "16:00" })
    expect(await reload(task.id)).toMatchObject({ dueTime: "16:00", dueTimeZone: deviceTimeZone() })
  })

  test("garde l’heure et le fuseau quand seule la date change", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "14:30", projectId: null })
    await savedIn(task.id, "Asia/Kolkata")
    await updateTask(db, task.id, { due: "2026-11-09" })
    expect(await reload(task.id)).toMatchObject({ dueTime: "14:30", dueTimeZone: "Asia/Kolkata" })
  })

  test("efface le fuseau avec l’heure", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "14:30", projectId: null })
    await updateTask(db, task.id, { dueTime: null })
    expect(await reload(task.id)).toMatchObject({ dueTime: null, dueTimeZone: null })
  })

  test("efface le fuseau quand la date est effacée", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "14:30", projectId: null })
    await updateTask(db, task.id, { due: null })
    expect((await reload(task.id))?.dueTimeZone).toBeNull()
  })
})

describe("report des tâches en retard", () => {
  const NOW = new Date(2026, 10, 7, 14, 30)

  test("reporte à aujourd’hui en gardant une heure encore à venir", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-05", dueTime: "18:00", projectId: null })
    await rescheduleOverdue(db, NOW)
    expect(await reload(task.id)).toMatchObject({ due: "2026-11-07", dueTime: "18:00" })
  })

  test("efface une heure déjà passée aujourd’hui", async () => {
    const task = await createTask(db, { title: "Appel", due: "2026-11-07", dueTime: "09:00", projectId: null })
    const previous = await rescheduleOverdue(db, NOW)
    expect(previous.map((item) => item.id)).toEqual([task.id])
    expect(await reload(task.id)).toMatchObject({ due: "2026-11-07", dueTime: null, dueTimeZone: null })
  })

  test("laisse les tâches à l’heure intactes", async () => {
    const later = await createTask(db, { title: "Soir", due: "2026-11-07", dueTime: "20:00", projectId: null })
    const allDay = await createTask(db, { title: "Jour", due: "2026-11-07", projectId: null })
    expect(await rescheduleOverdue(db, NOW)).toEqual([])
    expect(await reload(later.id)).toMatchObject({ dueTime: "20:00", updatedAt: later.updatedAt })
    expect(await reload(allDay.id)).toMatchObject({ updatedAt: allDay.updatedAt })
  })
})
