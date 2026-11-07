import { describe, expect, test } from "bun:test"
import { dueInstant, isDueTime } from "./due"

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
