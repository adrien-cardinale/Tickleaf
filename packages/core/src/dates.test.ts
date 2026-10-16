import { describe, expect, test } from "bun:test"
import { addDays, isIsoDate, nextDayMonth, nextWeekday } from "./dates"

describe("dates", () => {
  test("adds days across months and years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01")
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
  })

  test("validates ISO dates", () => {
    expect(isIsoDate("2026-02-28")).toBe(true)
    expect(isIsoDate("2026-02-30")).toBe(false)
    expect(isIsoDate("26-02-01")).toBe(false)
  })

  test("finds the next weekday", () => {
    expect(nextWeekday("dimanche", "2026-10-16")).toBe("2026-10-18")
    expect(nextWeekday("vendredi", "2026-10-16")).toBe("2026-10-23")
  })

  test("rejects impossible day and month", () => {
    expect(nextDayMonth(31, 2, "2026-10-16")).toBeNull()
  })
})
