import { type DatedTask, dueInstant, type Task } from "@tickleaf/core"

export const REMINDER_OFFSETS = [0, 5, 15, 30, 60, 120, 1440] as const

const MINUTE = 60_000

function timedDueInstant(schedule: DatedTask): Date | null {
  return schedule.dueTime === null ? null : dueInstant(schedule)
}

export function reminderAtFor(schedule: DatedTask, offset: number): string | null {
  const instant = timedDueInstant(schedule)
  return instant === null ? null : new Date(instant.getTime() - offset * MINUTE).toISOString()
}

export function reminderOffset(task: DatedTask & Pick<Task, "reminderAt">): number | null {
  const instant = timedDueInstant(task)
  if (instant === null || task.reminderAt === null) return null
  return Math.round((instant.getTime() - new Date(task.reminderAt).getTime()) / MINUTE)
}

export function followDueChange(previous: Task, next: DatedTask): string | null {
  if (previous.reminderAt === null || timedDueInstant(next) === null) return null
  const offset = reminderOffset(previous)
  return offset === null ? previous.reminderAt : reminderAtFor(next, offset)
}
