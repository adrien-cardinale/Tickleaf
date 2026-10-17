import type { Task } from "./types"

type OrderedTask = Pick<Task, "parentId" | "position" | "createdAt">

export type SubtaskProgress = { done: number; total: number }

export function isSubtask(task: Pick<Task, "parentId">): boolean {
  return task.parentId !== null
}

export function subtasksOf<T extends OrderedTask>(tasks: readonly T[], parentId: string): T[] {
  return tasks
    .filter((task) => task.parentId === parentId)
    .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt))
}

export function subtaskProgress(subtasks: readonly Pick<Task, "completedAt">[]): SubtaskProgress {
  const done = subtasks.filter((subtask) => subtask.completedAt !== null).length
  return { done, total: subtasks.length }
}
