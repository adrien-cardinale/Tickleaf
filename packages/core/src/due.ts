import { fromIsoDate, todayIso } from "./dates"
import { zonedInstant } from "./time-zone"
import type { DueTime, Task } from "./types"

const DUE_TIME = /^(\d{2}):(\d{2})$/

export function isDueTime(value: unknown): value is DueTime {
  if (typeof value !== "string") return false
  const match = DUE_TIME.exec(value)
  if (!match) return false
  return Number(match[1]) < 24 && Number(match[2]) < 60
}

export type DatedTask = Pick<Task, "due" | "dueTime" | "dueTimeZone">

function localInstant(due: string, dueTime: DueTime): Date {
  const instant = fromIsoDate(due)
  const [hours = 0, minutes = 0] = dueTime.split(":").map(Number)
  instant.setHours(hours, minutes, 0, 0)
  return instant
}

export function dueInstant(task: DatedTask): Date | null {
  if (task.due === null) return null
  if (task.dueTime === null) return fromIsoDate(task.due)
  if (task.dueTimeZone === null) return localInstant(task.due, task.dueTime)
  return zonedInstant(task.due, task.dueTime, task.dueTimeZone)
}

function padded(value: number): string {
  return String(value).padStart(2, "0")
}

export function localDueTime(task: DatedTask): DueTime | null {
  if (task.dueTime === null || task.dueTimeZone === null) return task.dueTime
  const instant = dueInstant(task)
  return instant === null ? task.dueTime : `${padded(instant.getHours())}:${padded(instant.getMinutes())}`
}

export function isOverdue(task: DatedTask & Pick<Task, "completedAt">, now: Date): boolean {
  if (task.completedAt !== null || task.due === null) return false
  const today = todayIso(now)
  if (task.due !== today) return task.due < today
  const instant = task.dueTime === null ? null : dueInstant(task)
  return instant !== null && instant < now
}

export function rescheduledToToday(task: Pick<Task, "dueTime" | "dueTimeZone">, now: Date): DatedTask {
  const moved = { due: todayIso(now), dueTime: task.dueTime, dueTimeZone: task.dueTimeZone }
  return isOverdue({ ...moved, completedAt: null }, now) ? { ...moved, dueTime: null, dueTimeZone: null } : moved
}
