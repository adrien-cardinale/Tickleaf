import { addDays, daysBetween } from "./dates"
import { type DatedTask, timedDueInstant } from "./due"
import type { Task } from "./types"

export const REMINDER_OFFSETS = [0, 5, 15, 30, 60, 120, 1440] as const

export type RemindedTask = DatedTask & Pick<Task, "reminderAt">

const MINUTE = 60_000
const DAY_MINUTES = 1440

export function reminderAtFor(schedule: DatedTask, offset: number): string | null {
  if (schedule.due === null) return null
  const days = Math.floor(offset / DAY_MINUTES)
  const instant = timedDueInstant({ ...schedule, due: addDays(schedule.due, -days) })
  if (instant === null) return null
  return new Date(instant.getTime() - (offset - days * DAY_MINUTES) * MINUTE).toISOString()
}

function remindsAt(schedule: DatedTask, offset: number, reminderAt: string): boolean {
  const candidate = reminderAtFor(schedule, offset)
  return candidate !== null && Date.parse(candidate) === Date.parse(reminderAt)
}

export function reminderOffset(task: RemindedTask): number | null {
  const instant = timedDueInstant(task)
  const { reminderAt } = task
  if (instant === null || reminderAt === null) return null
  const preset = REMINDER_OFFSETS.find((offset) => remindsAt(task, offset, reminderAt))
  return preset ?? Math.round((instant.getTime() - Date.parse(reminderAt)) / MINUTE)
}

function shiftedTimestamp(timestamp: string, days: number): string {
  const date = new Date(timestamp)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function movedReminder(previous: RemindedTask, next: DatedTask): string | null {
  if (previous.reminderAt === null) return null
  const offset = timedDueInstant(next) === null ? null : reminderOffset(previous)
  if (offset !== null) return reminderAtFor(next, offset)
  if (previous.due === null || next.due === null) return previous.reminderAt
  return shiftedTimestamp(previous.reminderAt, daysBetween(previous.due, next.due))
}

export function isReminderPast(reminderAt: string, now: Date): boolean {
  return Date.parse(reminderAt) <= now.getTime()
}
