import { describe, expect, test } from "bun:test"
import { dueInstant, isDueTime, isOverdue, localDueTime, rescheduledToToday } from "./due"

describe("dueInstant", () => {
  test("is null without a due date", () => {
    expect(dueInstant({ due: null, dueTime: null, dueTimeZone: null })).toBeNull()
  })

  test("starts the local day without a due time", () => {
    expect(dueInstant({ due: "2026-11-07", dueTime: null, dueTimeZone: null })).toEqual(new Date(2026, 10, 7, 0, 0))
  })

  test("uses the local due time without a time zone", () => {
    expect(dueInstant({ due: "2026-11-07", dueTime: "14:30", dueTimeZone: null })).toEqual(
      new Date(2026, 10, 7, 14, 30),
    )
  })

  test("reads the due time in its time zone", () => {
    const task = { due: "2026-11-07", dueTime: "14:30", dueTimeZone: "Asia/Kolkata" }
    expect(dueInstant(task)?.toISOString()).toBe("2026-11-07T09:00:00.000Z")
  })

  test("handles the last minute of the day", () => {
    expect(dueInstant({ due: "2026-12-31", dueTime: "23:59", dueTimeZone: null })).toEqual(
      new Date(2026, 11, 31, 23, 59),
    )
  })
})

describe("localDueTime", () => {
  function hoursAndMinutes(instant: Date): string {
    return `${String(instant.getHours()).padStart(2, "0")}:${String(instant.getMinutes()).padStart(2, "0")}`
  }

  test("is null without a due time", () => {
    expect(localDueTime({ due: "2026-11-07", dueTime: null, dueTimeZone: null })).toBeNull()
  })

  test("keeps a due time without a time zone", () => {
    expect(localDueTime({ due: "2026-11-07", dueTime: "14:30", dueTimeZone: null })).toBe("14:30")
  })

  test("keeps a due time saved in the device time zone", () => {
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    expect(localDueTime({ due: "2026-11-07", dueTime: "14:30", dueTimeZone: deviceZone })).toBe("14:30")
  })

  test("converts a due time saved in another time zone to the device time", () => {
    const task = { due: "2026-11-07", dueTime: "14:30", dueTimeZone: "Asia/Kolkata" }
    expect(localDueTime(task)).toBe(hoursAndMinutes(new Date("2026-11-07T09:00:00.000Z")))
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
    return { due, dueTime, dueTimeZone: null, completedAt }
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

  test("is overdue once the due time has passed in its time zone", () => {
    const now = new Date("2026-07-01T12:00:00.000Z")
    const zoned = (dueTime: string) => ({ due: "2026-07-01", dueTime, dueTimeZone: "Asia/Kolkata", completedAt: null })
    expect(isOverdue(zoned("17:00"), now)).toBe(true)
    expect(isOverdue(zoned("18:00"), now)).toBe(false)
  })

  test("is never overdue once completed", () => {
    expect(isOverdue(dated("2026-11-06", null, "2026-11-06T10:00:00.000Z"), NOW)).toBe(false)
  })
})

describe("rescheduledToToday", () => {
  const NOW = new Date(2026, 10, 7, 14, 30)

  test("moves the date to today", () => {
    expect(rescheduledToToday({ dueTime: null, dueTimeZone: null }, NOW)).toEqual({
      due: "2026-11-07",
      dueTime: null,
      dueTimeZone: null,
    })
  })

  test("keeps a time still ahead today", () => {
    expect(rescheduledToToday({ dueTime: "18:00", dueTimeZone: null }, NOW)).toEqual({
      due: "2026-11-07",
      dueTime: "18:00",
      dueTimeZone: null,
    })
  })

  test("keeps the time zone with a time still ahead", () => {
    const now = new Date("2026-07-01T12:00:00.000Z")
    expect(rescheduledToToday({ dueTime: "18:00", dueTimeZone: "Asia/Kolkata" }, now)).toEqual({
      due: "2026-07-01",
      dueTime: "18:00",
      dueTimeZone: "Asia/Kolkata",
    })
  })

  test("drops a time already past today with its time zone", () => {
    expect(rescheduledToToday({ dueTime: "10:00", dueTimeZone: "Europe/Zurich" }, NOW)).toEqual({
      due: "2026-11-07",
      dueTime: null,
      dueTimeZone: null,
    })
  })
})
