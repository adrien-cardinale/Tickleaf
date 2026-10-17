import { describe, expect, test } from "bun:test"
import { compareTasks } from "./sort"
import type { Task } from "./types"
import { buildTodayView, buildUpcomingView, countTasks } from "./views"

const TODAY = "2026-10-16"

function task(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: "Tâche",
    description: "",
    due: null,
    reminderAt: null,
    recurrence: null,
    priority: 4,
    projectId: null,
    sectionId: null,
    position: 0,
    completedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("views", () => {
  test("sorts by priority, then due, then creation", () => {
    const tasks = [
      task({ id: "c", priority: 2, due: null }),
      task({ id: "b", priority: 2, due: "2026-10-20" }),
      task({ id: "a", priority: 1, due: "2026-12-01" }),
    ]
    expect(tasks.sort(compareTasks).map((item) => item.id)).toEqual(["a", "b", "c"])
  })

  test("splits overdue and today", () => {
    const view = buildTodayView([task({ due: "2026-10-15" }), task({ due: TODAY }), task({ due: null })], TODAY)
    expect(view.overdue).toHaveLength(1)
    expect(view.today).toHaveLength(1)
  })

  test("always shows the first two upcoming days", () => {
    const view = buildUpcomingView([task({ due: "2026-10-20" }), task({ due: "2026-11-30" })], TODAY)
    expect(view.days.map((day) => day.date)).toEqual(["2026-10-17", "2026-10-18", "2026-10-20"])
    expect(view.later).toHaveLength(1)
  })

  test("counts tasks per view", () => {
    const counts = countTasks(
      [task({ due: "2026-10-10" }), task({ due: "2026-10-20", projectId: "p" }), task({ completedAt: TODAY })],
      TODAY,
    )
    expect(counts).toEqual({ inbox: 1, today: 1, upcoming: 1, completed: 1, byProject: { p: 1 } })
  })
})
