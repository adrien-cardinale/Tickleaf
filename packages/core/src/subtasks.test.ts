import { describe, expect, test } from "bun:test"
import { isSubtask, subtaskProgress, subtasksOf } from "./subtasks"

const parentId = "parent"

function row(id: string, position: number, overrides: { parentId?: string | null; completedAt?: string | null } = {}) {
  return {
    id,
    parentId: overrides.parentId === undefined ? parentId : overrides.parentId,
    position,
    createdAt: "2026-10-01T08:00:00.000Z",
    completedAt: overrides.completedAt ?? null,
  }
}

describe("subtasks", () => {
  test("recognizes a subtask by its parent", () => {
    expect(isSubtask({ parentId })).toBe(true)
    expect(isSubtask({ parentId: null })).toBe(false)
  })

  test("keeps the subtasks of the parent, in position order", () => {
    const rows = [row("b", 2), row("other", 0, { parentId: "x" }), row("a", 1), row("top", 3, { parentId: null })]
    expect(subtasksOf(rows, parentId).map((subtask) => subtask.id)).toEqual(["a", "b"])
  })

  test("counts completed subtasks", () => {
    const rows = [row("a", 0, { completedAt: "2026-10-02T08:00:00.000Z" }), row("b", 1)]
    expect(subtaskProgress(rows)).toEqual({ done: 1, total: 2 })
  })
})
