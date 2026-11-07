import { describe, expect, test } from "bun:test"
import { buildFocusView, FOCUS_LIMIT, isFocused, suggestedFocus } from "./focus"
import type { Task } from "./types"

const TODAY = "2026-10-16"
const YESTERDAY = "2026-10-15"

function task(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: "Tâche",
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
    focusDate: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  }
}

function focusedTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, index) => task({ focusDate: TODAY, position: index }))
}

describe("isFocused", () => {
  test("keeps an open task in focus today", () => {
    expect(isFocused(task({ focusDate: TODAY }), TODAY)).toBe(true)
  })

  test("drops a focus from another day", () => {
    expect(isFocused(task({ focusDate: YESTERDAY }), TODAY)).toBe(false)
    expect(isFocused(task({ focusDate: null }), TODAY)).toBe(false)
  })

  test("drops a completed task", () => {
    expect(isFocused(task({ focusDate: TODAY, completedAt: TODAY }), TODAY)).toBe(false)
  })
})

describe("buildFocusView", () => {
  test("lists only the tasks in focus today", () => {
    const tasks = [
      task({ id: "in", focusDate: TODAY }),
      task({ id: "old", focusDate: YESTERDAY }),
      task({ id: "none" }),
    ]
    expect(buildFocusView(tasks, TODAY).tasks.map((item) => item.id)).toEqual(["in"])
  })

  test("keeps the manual order", () => {
    const tasks = [task({ id: "b", focusDate: TODAY, position: 2 }), task({ id: "a", focusDate: TODAY, position: 1 })]
    expect(buildFocusView(tasks, TODAY).tasks.map((item) => item.id)).toEqual(["a", "b"])
  })

  test("flags the view over the limit", () => {
    expect(buildFocusView(focusedTasks(FOCUS_LIMIT), TODAY).overLimit).toBe(false)
    expect(buildFocusView(focusedTasks(FOCUS_LIMIT + 1), TODAY).overLimit).toBe(true)
  })
})

describe("suggestedFocus", () => {
  test("suggests the urgent and important tasks not yet in focus", () => {
    const tasks = [
      task({ id: "urgent", priority: 1, due: TODAY }),
      task({ id: "focused", priority: 1, due: TODAY, focusDate: TODAY }),
      task({ id: "later", priority: 1, due: "2026-12-01" }),
      task({ id: "minor", priority: 4, due: TODAY }),
    ]
    expect(suggestedFocus(tasks, TODAY).map((item) => item.id)).toEqual(["urgent"])
  })

  test("sorts the suggestions by priority", () => {
    const tasks = [task({ id: "p2", priority: 2, due: TODAY }), task({ id: "p1", priority: 1, due: TODAY })]
    expect(suggestedFocus(tasks, TODAY).map((item) => item.id)).toEqual(["p1", "p2"])
  })

  test("stops at the focus limit", () => {
    const tasks = Array.from({ length: FOCUS_LIMIT + 2 }, () => task({ priority: 1, due: TODAY }))
    expect(suggestedFocus(tasks, TODAY)).toHaveLength(FOCUS_LIMIT)
  })
})
