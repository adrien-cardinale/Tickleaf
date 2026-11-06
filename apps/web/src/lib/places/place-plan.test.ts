import { describe, expect, test } from "bun:test"
import type { Place, Task } from "@tickleaf/core"
import { notificationId } from "@/lib/reminders/reminder-plan"
import { checkArrivals, geofenceTargets } from "./place-plan"

const OFFICE: Place = { latitude: 46.5197, longitude: 6.6323, radius: 100, label: "Bureau" }
const AT_OFFICE = { latitude: 46.5199, longitude: 6.6323 }
const FAR_AWAY = { latitude: 46.2044, longitude: 6.1432 }

function task(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    title: "Imprimer le rapport",
    description: "",
    due: null,
    reminderAt: null,
    recurrence: null,
    place: OFFICE,
    priority: 4,
    projectId: null,
    sectionId: null,
    parentId: null,
    position: 0,
    completedAt: null,
    createdAt: "2026-10-02T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
    ...overrides,
  }
}

describe("geofenceTargets", () => {
  test("turns an open task with a place into a target", () => {
    expect(geofenceTargets([task({})])).toEqual([
      {
        id: notificationId("t1"),
        taskId: "t1",
        title: "Imprimer le rapport",
        body: "Vous êtes sur place : Bureau",
        latitude: 46.5197,
        longitude: 6.6323,
        radius: 100,
      },
    ])
  })

  test("skips completed tasks and tasks without a place", () => {
    const tasks = [task({ id: "done", completedAt: "2026-10-03T08:00:00.000Z" }), task({ id: "free", place: null })]
    expect(geofenceTargets(tasks)).toEqual([])
  })

  test("uses a generic body for a place without a name", () => {
    const [target] = geofenceTargets([task({ place: { ...OFFICE, label: "" } })])
    expect(target?.body).toBe("Vous êtes sur place")
  })
})

describe("checkArrivals", () => {
  const targets = geofenceTargets([task({})])

  test("reports an arrival inside the zone", () => {
    const check = checkArrivals(targets, AT_OFFICE, new Set())
    expect(check.arrivals.map((target) => target.taskId)).toEqual(["t1"])
    expect([...check.inside]).toEqual(["t1"])
  })

  test("does not repeat an arrival while still inside", () => {
    expect(checkArrivals(targets, AT_OFFICE, new Set(["t1"])).arrivals).toEqual([])
  })

  test("forgets the zone once the position leaves it", () => {
    const check = checkArrivals(targets, FAR_AWAY, new Set(["t1"]))
    expect(check.arrivals).toEqual([])
    expect(check.inside.size).toBe(0)
  })
})
