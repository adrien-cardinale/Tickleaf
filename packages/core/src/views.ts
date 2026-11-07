import { addDays, todayIso } from "./dates"
import { isOverdue } from "./due"
import { isFocused } from "./focus"
import { quadrantOf } from "./matrix"
import { compareOverdue, compareTasks } from "./sort"
import { isSubtask } from "./subtasks"
import type { IsoDate, Task } from "./types"

export const UPCOMING_DAYS = 7
export const ALWAYS_SHOWN_DAYS = 2

export type TaskCounts = {
  inbox: number
  today: number
  focus: number
  upcoming: number
  matrix: number
  completed: number
  byProject: Record<string, number>
}

export type UpcomingDay = { date: IsoDate; tasks: Task[] }

export type UpcomingView = { days: UpcomingDay[]; later: Task[] }

export type TodayView = { overdue: Task[]; today: Task[] }

export function isOpen(task: Pick<Task, "completedAt">): boolean {
  return task.completedAt === null
}

export function countTasks(tasks: readonly Task[], today: IsoDate): TaskCounts {
  const counts: TaskCounts = { inbox: 0, today: 0, focus: 0, upcoming: 0, matrix: 0, completed: 0, byProject: {} }
  for (const task of tasks) {
    if (isSubtask(task)) continue
    if (!isOpen(task)) {
      counts.completed += 1
      continue
    }
    if (task.projectId === null) counts.inbox += 1
    else counts.byProject[task.projectId] = (counts.byProject[task.projectId] ?? 0) + 1
    if (task.due !== null && task.due <= today) counts.today += 1
    if (task.due !== null && task.due > today) counts.upcoming += 1
    if (isFocused(task, today)) counts.focus += 1
    if (quadrantOf(task, today) === "doFirst") counts.matrix += 1
  }
  return counts
}

export function buildTodayView(openTasks: readonly Task[], now: Date): TodayView {
  const today = todayIso(now)
  const overdue = openTasks.filter((task) => isOverdue(task, now))
  const dueToday = openTasks.filter((task) => task.due === today && !isOverdue(task, now))
  return { overdue: overdue.sort(compareOverdue), today: dueToday.sort(compareTasks) }
}

export function buildUpcomingView(openTasks: readonly Task[], today: IsoDate): UpcomingView {
  const future = openTasks.filter((task) => task.due !== null && task.due > today)
  const days: UpcomingDay[] = []
  for (let offset = 1; offset <= UPCOMING_DAYS; offset += 1) {
    const date = addDays(today, offset)
    const tasks = future.filter((task) => task.due === date).sort(compareTasks)
    if (tasks.length > 0 || offset <= ALWAYS_SHOWN_DAYS) days.push({ date, tasks })
  }
  const horizon = addDays(today, UPCOMING_DAYS)
  const later = future.filter((task) => task.due !== null && task.due > horizon).sort(compareTasks)
  return { days, later }
}

export function matchesSearch(task: Pick<Task, "title" | "description">, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === "") return true
  return task.title.toLowerCase().includes(needle) || task.description.toLowerCase().includes(needle)
}
