import type { Task } from "./types"

const NO_DUE = "9999-99-99"

const NO_DUE_TIME = "99:99"

type SortableTask = Pick<Task, "priority" | "due" | "dueTime" | "createdAt">

type DatedTask = Pick<Task, "due" | "dueTime">

type ManualTask = Pick<Task, "position" | "createdAt">

export function compareDue(a: DatedTask, b: DatedTask): number {
  const byDay = (a.due ?? NO_DUE).localeCompare(b.due ?? NO_DUE)
  if (byDay !== 0) return byDay
  return (a.dueTime ?? NO_DUE_TIME).localeCompare(b.dueTime ?? NO_DUE_TIME)
}

export function compareTasks(a: SortableTask, b: SortableTask): number {
  if (a.priority !== b.priority) return a.priority - b.priority
  return compareDue(a, b) || a.createdAt.localeCompare(b.createdAt)
}

export function compareOverdue(a: SortableTask, b: SortableTask): number {
  return compareDue(a, b) || compareTasks(a, b)
}

export function compareCompleted(a: Pick<Task, "completedAt">, b: Pick<Task, "completedAt">): number {
  return (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
}

export function sortTasks<T extends SortableTask>(tasks: readonly T[]): T[] {
  return [...tasks].sort(compareTasks)
}

export function compareManual(a: ManualTask, b: ManualTask): number {
  return a.position - b.position || a.createdAt.localeCompare(b.createdAt)
}

export function sortManually<T extends ManualTask>(tasks: readonly T[]): T[] {
  return [...tasks].sort(compareManual)
}
