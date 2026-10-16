import { addDays } from "./dates"
import { compareOverdue, compareTasks } from "./sort"
import type { IsoDate, Task } from "./types"

export const UPCOMING_DAYS = 7
export const ALWAYS_SHOWN_DAYS = 2

export type TaskCounts = {
  inbox: number
  today: number
  upcoming: number
  completed: number
  byProject: Record<string, number>
}

export type UpcomingDay = { date: IsoDate; tasks: Task[] }

export type UpcomingView = { days: UpcomingDay[]; later: Task[] }

export type TodayView = { overdue: Task[]; today: Task[] }

export function isOpen(task: Pick<Task, "completedAt">): boolean {
  return task.completedAt === null
}

export function isOverdue(task: Pick<Task, "due" | "completedAt">, today: IsoDate): boolean {
  return isOpen(task) && task.due !== null && task.due < today
}

export function countTasks(tasks: readonly Task[], today: IsoDate): TaskCounts {
  const counts: TaskCounts = { inbox: 0, today: 0, upcoming: 0, completed: 0, byProject: {} }
  for (const task of tasks) {
    if (!isOpen(task)) {
      counts.completed += 1
      continue
    }
    if (task.projectId === null) counts.inbox += 1
    else counts.byProject[task.projectId] = (counts.byProject[task.projectId] ?? 0) + 1
    if (task.due !== null && task.due <= today) counts.today += 1
    if (task.due !== null && task.due > today) counts.upcoming += 1
  }
  return counts
}

export function buildTodayView(openTasks: readonly Task[], today: IsoDate): TodayView {
  return {
    overdue: openTasks.filter((task) => task.due !== null && task.due < today).sort(compareOverdue),
    today: openTasks.filter((task) => task.due === today).sort(compareTasks),
  }
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
