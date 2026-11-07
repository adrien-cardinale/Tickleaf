import { fromIsoDate, todayIso } from "./dates"
import type { DueTime, Task } from "./types"

const DUE_TIME = /^(\d{2}):(\d{2})$/

export function isDueTime(value: unknown): value is DueTime {
  if (typeof value !== "string") return false
  const match = DUE_TIME.exec(value)
  if (!match) return false
  return Number(match[1]) < 24 && Number(match[2]) < 60
}

export function dueInstant(task: Pick<Task, "due" | "dueTime">): Date | null {
  if (task.due === null) return null
  const instant = fromIsoDate(task.due)
  if (task.dueTime === null) return instant
  const [hours = 0, minutes = 0] = task.dueTime.split(":").map(Number)
  instant.setHours(hours, minutes, 0, 0)
  return instant
}

export function isOverdue(task: Pick<Task, "due" | "dueTime" | "completedAt">, now: Date): boolean {
  if (task.completedAt !== null || task.due === null) return false
  const today = todayIso(now)
  if (task.due !== today) return task.due < today
  const instant = task.dueTime === null ? null : dueInstant(task)
  return instant !== null && instant < now
}

export function rescheduledToToday(task: Pick<Task, "dueTime">, now: Date): Pick<Task, "due" | "dueTime"> {
  const moved = { due: todayIso(now), dueTime: task.dueTime }
  return isOverdue({ ...moved, completedAt: null }, now) ? { ...moved, dueTime: null } : moved
}
