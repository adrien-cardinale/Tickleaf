import { describe, expect, test } from "bun:test"
import { isReminderPast, movedReminder, reminderAtFor, reminderOffset } from "./reminders"

const evening = { due: "2026-11-20", dueTime: "18:00", dueTimeZone: "UTC" }
const parisDstMorning = { due: "2027-03-28", dueTime: "09:00", dueTimeZone: "Europe/Paris" }

describe("reminderAtFor", () => {
  test("subtracts the offset from the due instant", () => {
    expect(reminderAtFor(evening, 15)).toBe("2026-11-20T17:45:00.000Z")
  })

  test("is null without a due time", () => {
    expect(reminderAtFor({ ...evening, dueTime: null, dueTimeZone: null }, 15)).toBeNull()
  })

  test("keeps the wall-clock time one day before across a DST change", () => {
    expect(reminderAtFor(parisDstMorning, 1440)).toBe("2027-03-27T08:00:00.000Z")
  })
})

describe("reminderOffset", () => {
  test("reads a preset offset", () => {
    expect(reminderOffset({ ...evening, reminderAt: "2026-11-20T17:30:00.000Z" })).toBe(30)
  })

  test("recognises one day before across a DST change", () => {
    expect(reminderOffset({ ...parisDstMorning, reminderAt: "2027-03-27T08:00:00.000Z" })).toBe(1440)
  })

  test("is null without a due time", () => {
    const task = { ...evening, dueTime: null, dueTimeZone: null, reminderAt: "2026-11-20T09:00:00.000Z" }
    expect(reminderOffset(task)).toBeNull()
  })
})

describe("movedReminder", () => {
  const reminded = { ...evening, reminderAt: "2026-11-20T17:45:00.000Z" }

  test("is null without a reminder", () => {
    expect(movedReminder({ ...evening, reminderAt: null }, { ...evening, due: "2026-11-21" })).toBeNull()
  })

  test("keeps the offset when the timed due moves", () => {
    expect(movedReminder(reminded, { ...evening, due: "2026-11-21", dueTime: "10:00" })).toBe(
      "2026-11-21T09:45:00.000Z",
    )
  })

  test("keeps the reminder when the due time is cleared", () => {
    expect(movedReminder(reminded, { ...evening, dueTime: null, dueTimeZone: null })).toBe(reminded.reminderAt)
  })

  test("shifts the reminder by days for a date-only due", () => {
    const dateOnly = { due: "2026-11-20", dueTime: null, dueTimeZone: null, reminderAt: "2026-11-20T09:00:00.000Z" }
    expect(movedReminder(dateOnly, { ...dateOnly, due: "2026-11-21" })).toBe("2026-11-21T09:00:00.000Z")
  })

  test("keeps the reminder when the due date is removed", () => {
    expect(movedReminder(reminded, { due: null, dueTime: null, dueTimeZone: null })).toBe(reminded.reminderAt)
  })
})

describe("isReminderPast", () => {
  test("compares the reminder with now", () => {
    const now = new Date("2026-11-20T17:50:00.000Z")
    expect(isReminderPast("2026-11-20T17:00:00.000Z", now)).toBe(true)
    expect(isReminderPast("2026-11-20T17:55:00.000Z", now)).toBe(false)
  })
})
