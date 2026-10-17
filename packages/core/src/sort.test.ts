import { describe, expect, test } from "bun:test"
import { sortManually } from "./sort"

function row(id: string, position: number, createdAt = "2026-10-01T08:00:00.000Z") {
  return { id, position, createdAt }
}

describe("sortManually", () => {
  test("orders tasks by position", () => {
    const rows = [row("c", 2), row("a", 0), row("b", 1)]
    expect(sortManually(rows).map((task) => task.id)).toEqual(["a", "b", "c"])
  })

  test("breaks position ties by creation date", () => {
    const rows = [row("late", 1, "2026-10-02T08:00:00.000Z"), row("early", 1, "2026-10-01T08:00:00.000Z")]
    expect(sortManually(rows).map((task) => task.id)).toEqual(["early", "late"])
  })

  test("leaves the input untouched", () => {
    const rows = [row("b", 1), row("a", 0)]
    sortManually(rows)
    expect(rows.map((task) => task.id)).toEqual(["b", "a"])
  })
})
