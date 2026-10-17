import type { Project, Task } from "@tickleaf/core"
import { recurrenceLabel } from "@/lib/format"
import { labels } from "@/lib/labels"

const SEPARATOR = ";"
const LINE_BREAK = "\r\n"
const BYTE_ORDER_MARK = "﻿"
const NEEDS_QUOTES = /[";\r\n]/

function escapeCell(value: string): string {
  return NEEDS_QUOTES.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

function taskRow(task: Task, projectNames: Map<string, string>): string[] {
  const project =
    task.projectId === null ? labels.detail.inbox : (projectNames.get(task.projectId) ?? labels.detail.inbox)
  return [
    task.title,
    task.description,
    project,
    task.due ?? "",
    task.recurrence === null ? "" : recurrenceLabel(task.recurrence),
    `P${task.priority}`,
    task.completedAt === null ? labels.export.open : labels.export.done,
    task.completedAt ?? "",
    task.createdAt,
  ]
}

export function tasksToCsv(tasks: readonly Task[], projects: readonly Project[]): string {
  const projectNames = new Map(projects.map((project) => [project.id, project.name]))
  const sorted = [...tasks].sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  const rows = [labels.export.columns, ...sorted.map((task) => taskRow(task, projectNames))]
  return BYTE_ORDER_MARK + rows.map((row) => row.map(escapeCell).join(SEPARATOR)).join(LINE_BREAK) + LINE_BREAK
}

export function exportFileName(today: string): string {
  return `tickleaf-${today}.csv`
}
