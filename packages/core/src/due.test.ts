import { describe, expect, test } from "bun:test"
import { dueInstant, isDueTime, isOverdue, rescheduledToToday } from "./due"

describe("dueInstant", () => {
  test("is null without a due date", () => {
    expect(dueInstant({ due: null, dueTime: null })).toBeNull()
  })

  test("starts the local day without a due time", () => {
    expect(dueInstant({ due: "2026-11-07", dueTime: null })).toEqual(new Date(2026, 10, 7, 0, 0))
  })

  test("uses the local due time", () => {
    expect(dueInstant({ due: "2026-11-07", dueTime: "14:30" })).toEqual(new Date(2026, 10, 7, 14, 30))
  })

  test("handles the last minute of the day", () => {
    expect(dueInstant({ due: "2026-12-31", dueTime: "23:59" })).toEqual(new Date(2026, 11, 31, 23, 59))
  })
})

describe("isDueTime", () => {
  test("accepts a 24-hour time", () => {
    expect(isDueTime("00:00")).toBe(true)
    expect(isDueTime("23:59")).toBe(true)
  })

  test("rejects malformed or impossible times", () => {
    expect(isDueTime("24:00")).toBe(false)
    expect(isDueTime("12:60")).toBe(false)
    expect(isDueTime("9:30")).toBe(false)
    expect(isDueTime(null)).toBe(false)
  })
})

describe("isOverdue", () => {
  const NOW = new Date(2026, 10, 7, 14, 30)

  function dated(due: string | null, dueTime: string | null = null, completedAt: string | null = null) {
    return { due, dueTime, completedAt }
  }

  test("is overdue on a past day", () => {
    expect(isOverdue(dated("2026-11-06"), NOW)).toBe(true)
    expect(isOverdue(dated("2026-11-06", "23:59"), NOW)).toBe(true)
  })

  test("is never overdue without a date or on a future day", () => {
    expect(isOverdue(dated(null), NOW)).toBe(false)
    expect(isOverdue(dated("2026-11-08", "00:00"), NOW)).toBe(false)
  })

  test("keeps a task of today without a time on time all day", () => {
    expect(isOverdue(dated("2026-11-07"), new Date(2026, 10, 7, 23, 59))).toBe(false)
  })

  test("is overdue today once the due time has passed", () => {
    expect(isOverdue(dated("2026-11-07", "14:29"), NOW)).toBe(true)
    expect(isOverdue(dated("2026-11-07", "14:30"), NOW)).toBe(false)
    expect(isOverdue(dated("2026-11-07", "18:00"), NOW)).toBe(false)
  })

  test("is never overdue once completed", () => {
    expect(isOverdue(dated("2026-11-06", null, "2026-11-06T10:00:00.000Z"), NOW)).toBe(false)
  })
})

describe("rescheduledToToday", () => {
  const NOW = new Date(2026, 10, 7, 14, 30)

  test("moves the date to today", () => {
    expect(rescheduledToToday({ dueTime: null }, NOW)).toEqual({ due: "2026-11-07", dueTime: null })
  })

  test("keeps a time still ahead today", () => {
    expect(rescheduledToToday({ dueTime: "18:00" }, NOW)).toEqual({ due: "2026-11-07", dueTime: "18:00" })
  })

  test("drops a time already past today", () => {
    expect(rescheduledToToday({ dueTime: "10:00" }, NOW)).toEqual({ due: "2026-11-07", dueTime: null })
  })
})
