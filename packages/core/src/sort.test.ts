import { describe, expect, test } from "bun:test"
import { compareDue, compareTasks, sortManually } from "./sort"

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

function dated(id: string, due: string | null, dueTime: string | null, dueTimeZone: string | null = null) {
  return { id, due, dueTime, dueTimeZone, priority: 4 as const, createdAt: "2026-10-01T08:00:00.000Z" }
}

describe("compareDue", () => {
  test("orders by day before time", () => {
    const rows = [dated("later", "2026-10-02", "08:00"), dated("earlier", "2026-10-01", "20:00")]
    expect(rows.sort(compareDue).map((task) => task.id)).toEqual(["earlier", "later"])
  })

  test("orders the same day by time and puts tasks without time last", () => {
    const rows = [
      dated("none", "2026-10-01", null),
      dated("afternoon", "2026-10-01", "14:30"),
      dated("morning", "2026-10-01", "09:00"),
    ]
    expect(rows.sort(compareDue).map((task) => task.id)).toEqual(["morning", "afternoon", "none"])
  })

  test("orders the same day by instant across time zones", () => {
    const rows = [
      dated("new-york", "2026-10-01", "10:00", "America/New_York"),
      dated("zurich", "2026-10-01", "15:00", "Europe/Zurich"),
    ]
    expect(rows.sort(compareDue).map((task) => task.id)).toEqual(["zurich", "new-york"])
  })

  test("keeps tasks without due date last", () => {
    const rows = [dated("undated", null, null), dated("dated", "2026-10-01", null)]
    expect(rows.sort(compareDue).map((task) => task.id)).toEqual(["dated", "undated"])
  })
})

describe("compareTasks", () => {
  test("breaks a due day tie with the due time", () => {
    const rows = [dated("noon", "2026-10-01", "12:00"), dated("dawn", "2026-10-01", "06:00")]
    expect(rows.sort(compareTasks).map((task) => task.id)).toEqual(["dawn", "noon"])
  })
})
