import { describe, expect, test } from "bun:test"
import { buildMatrixView, isUrgent, quadrantOf } from "./matrix"
import type { Task } from "./types"

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
    parentId: null,
    position: 0,
    completedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("matrix", () => {
  test("places tasks in the four quadrants", () => {
    const view = buildMatrixView(
      [
        task({ id: "do", priority: 1, due: TODAY }),
        task({ id: "schedule", priority: 2, due: "2026-10-30" }),
        task({ id: "delegate", priority: 3, due: "2026-10-17" }),
        task({ id: "eliminate", priority: 4, due: null }),
      ],
      TODAY,
    )
    expect(view.doFirst.map((item) => item.id)).toEqual(["do"])
    expect(view.schedule.map((item) => item.id)).toEqual(["schedule"])
    expect(view.delegate.map((item) => item.id)).toEqual(["delegate"])
    expect(view.eliminate.map((item) => item.id)).toEqual(["eliminate"])
  })

  test("treats the day after tomorrow as urgent and the next day as not urgent", () => {
    expect(isUrgent(task({ due: "2026-10-18" }), TODAY)).toBe(true)
    expect(isUrgent(task({ due: "2026-10-19" }), TODAY)).toBe(false)
  })

  test("schedules an important task without a due date", () => {
    expect(quadrantOf(task({ priority: 1, due: null }), TODAY)).toBe("schedule")
  })

  test("delegates an overdue task of low priority", () => {
    expect(quadrantOf(task({ priority: 4, due: "2026-10-10" }), TODAY)).toBe("delegate")
  })

  test("sorts the urgent and important tasks by due date", () => {
    const view = buildMatrixView(
      [
        task({ id: "tomorrow", priority: 1, due: "2026-10-17" }),
        task({ id: "overdue", priority: 2, due: "2026-10-12" }),
        task({ id: "today", priority: 1, due: TODAY }),
      ],
      TODAY,
    )
    expect(view.doFirst.map((item) => item.id)).toEqual(["overdue", "today", "tomorrow"])
  })
})
