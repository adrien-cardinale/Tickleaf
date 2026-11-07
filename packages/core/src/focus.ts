import { quadrantOf } from "./matrix"
import { compareTasks, sortManually } from "./sort"
import type { IsoDate, Task } from "./types"

export const FOCUS_LIMIT = 5

export type FocusView = { tasks: Task[]; overLimit: boolean }

export function isFocused(task: Pick<Task, "focusDate" | "completedAt">, today: IsoDate): boolean {
  return task.focusDate === today && task.completedAt === null
}

export function buildFocusView(openTasks: readonly Task[], today: IsoDate): FocusView {
  const tasks = sortManually(openTasks.filter((task) => isFocused(task, today)))
  return { tasks, overLimit: tasks.length > FOCUS_LIMIT }
}

export function suggestedFocus(openTasks: readonly Task[], today: IsoDate): Task[] {
  return openTasks
    .filter((task) => quadrantOf(task, today) === "doFirst" && !isFocused(task, today))
    .sort(compareTasks)
    .slice(0, FOCUS_LIMIT)
}
