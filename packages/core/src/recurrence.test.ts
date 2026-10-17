import { describe, expect, test } from "bun:test"
import { nextOccurrence } from "./recurrence"

const FRIDAY = "2026-10-16"

describe("nextOccurrence", () => {
  test("moves a task due today to the next occurrence", () => {
    expect(nextOccurrence(FRIDAY, { unit: "day", interval: 1 }, FRIDAY)).toBe("2026-10-17")
    expect(nextOccurrence(FRIDAY, { unit: "week", interval: 2 }, FRIDAY)).toBe("2026-10-30")
    expect(nextOccurrence(FRIDAY, { unit: "year", interval: 1 }, FRIDAY)).toBe("2027-10-16")
  })

  test("skips the weekend for working days", () => {
    expect(nextOccurrence(FRIDAY, { unit: "weekday", interval: 1 }, FRIDAY)).toBe("2026-10-19")
  })

  test("keeps the day of the month, clamped to short months", () => {
    expect(nextOccurrence("2026-01-31", { unit: "month", interval: 1 }, "2026-01-31")).toBe("2026-02-28")
    expect(nextOccurrence("2026-01-31", { unit: "month", interval: 1 }, "2026-03-01")).toBe("2026-03-31")
  })

  test("skips missed occurrences of an overdue task", () => {
    expect(nextOccurrence("2026-10-05", { unit: "week", interval: 1 }, FRIDAY)).toBe("2026-10-19")
    expect(nextOccurrence("2026-10-01", { unit: "day", interval: 1 }, FRIDAY)).toBe("2026-10-17")
  })

  test("advances one step for a task completed early", () => {
    expect(nextOccurrence("2026-10-20", { unit: "day", interval: 3 }, FRIDAY)).toBe("2026-10-23")
  })

  test("starts from today without a due date", () => {
    expect(nextOccurrence(null, { unit: "day", interval: 1 }, FRIDAY)).toBe("2026-10-17")
  })
})
