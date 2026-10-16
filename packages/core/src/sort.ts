import type { Task } from "./types"

const NO_DUE = "9999-99-99"

type SortableTask = Pick<Task, "priority" | "due" | "createdAt">

export function compareTasks(a: SortableTask, b: SortableTask): number {
  if (a.priority !== b.priority) return a.priority - b.priority
  const dueA = a.due ?? NO_DUE
  const dueB = b.due ?? NO_DUE
  if (dueA !== dueB) return dueA < dueB ? -1 : 1
  return a.createdAt.localeCompare(b.createdAt)
}

export function compareOverdue(a: SortableTask, b: SortableTask): number {
  const byDue = (a.due ?? NO_DUE).localeCompare(b.due ?? NO_DUE)
  return byDue !== 0 ? byDue : compareTasks(a, b)
}

export function compareCompleted(a: Pick<Task, "completedAt">, b: Pick<Task, "completedAt">): number {
  return (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
}

export function sortTasks<T extends SortableTask>(tasks: readonly T[]): T[] {
  return [...tasks].sort(compareTasks)
}
