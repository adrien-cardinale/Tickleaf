import { fromIsoDate } from "./dates"
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
