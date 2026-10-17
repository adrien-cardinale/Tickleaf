import { addDays } from "./dates"
import { compareOverdue, compareTasks } from "./sort"
import type { IsoDate, Task } from "./types"

export const URGENT_DAYS = 2

export type MatrixQuadrant = "doFirst" | "schedule" | "delegate" | "eliminate"

export type MatrixView = Record<MatrixQuadrant, Task[]>

export const MATRIX_QUADRANTS: readonly MatrixQuadrant[] = ["doFirst", "schedule", "delegate", "eliminate"]

const URGENT_QUADRANTS: ReadonlySet<MatrixQuadrant> = new Set(["doFirst", "delegate"])

export function isImportant(task: Pick<Task, "priority">): boolean {
  return task.priority <= 2
}

export function isUrgent(task: Pick<Task, "due">, today: IsoDate): boolean {
  return task.due !== null && task.due <= addDays(today, URGENT_DAYS)
}

export function quadrantOf(task: Pick<Task, "priority" | "due">, today: IsoDate): MatrixQuadrant {
  const urgent = isUrgent(task, today)
  if (isImportant(task)) return urgent ? "doFirst" : "schedule"
  return urgent ? "delegate" : "eliminate"
}

export function buildMatrixView(openTasks: readonly Task[], today: IsoDate): MatrixView {
  const view: MatrixView = { doFirst: [], schedule: [], delegate: [], eliminate: [] }
  for (const task of openTasks) view[quadrantOf(task, today)].push(task)
  for (const quadrant of MATRIX_QUADRANTS) {
    view[quadrant].sort(URGENT_QUADRANTS.has(quadrant) ? compareOverdue : compareTasks)
  }
  return view
}
