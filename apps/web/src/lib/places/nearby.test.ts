import { describe, expect, test } from "bun:test"
import type { Place, Task } from "@tickleaf/core"
import { nearbyTasks } from "./nearby"

const HERE = { latitude: 46.5197, longitude: 6.6323 }

function placeAt(latitudeOffset: number, radius = 100): Place {
  return { latitude: HERE.latitude + latitudeOffset, longitude: HERE.longitude, radius, label: "" }
}

function task(id: string, place: Place | null, completedAt: string | null = null): Task {
  return {
    id,
    title: id,
    description: "",
    due: null,
    reminderAt: null,
    recurrence: null,
    place,
    priority: 4,
    projectId: null,
    sectionId: null,
    parentId: null,
    position: 0,
    completedAt,
    createdAt: "2026-10-02T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
  }
}

describe("nearbyTasks", () => {
  test("lists tasks on site first, then the others by distance", () => {
    const tasks = [task("far", placeAt(0.02)), task("close", placeAt(0.005)), task("here", placeAt(0.0005))]
    const nearby = nearbyTasks(tasks, HERE)
    expect(nearby.map((entry) => entry.task.id)).toEqual(["here", "close", "far"])
    expect(nearby.map((entry) => entry.onSite)).toEqual([true, false, false])
  })

  test("puts a large zone that contains the position before a closer small one", () => {
    const tasks = [task("small", placeAt(0.002, 50)), task("large", placeAt(0.004, 1000))]
    expect(nearbyTasks(tasks, HERE).map((entry) => entry.task.id)).toEqual(["large", "small"])
  })

  test("leaves out tasks beyond the threshold", () => {
    expect(nearbyTasks([task("far", placeAt(0.1))], HERE, 5_000)).toEqual([])
  })

  test("ignores completed tasks and tasks without a place", () => {
    const tasks = [task("done", placeAt(0), "2026-10-03T08:00:00.000Z"), task("free", null)]
    expect(nearbyTasks(tasks, HERE)).toEqual([])
  })
})
