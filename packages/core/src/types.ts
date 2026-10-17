import type { ProjectColor } from "./projects"
import type { Recurrence } from "./recurrence"

export const PRIORITIES = [1, 2, 3, 4] as const

export type Priority = (typeof PRIORITIES)[number]

export const DEFAULT_PRIORITY: Priority = 4

export type IsoDate = string

export type Project = {
  id: string
  name: string
  color: ProjectColor
  parentId: string | null
  position: number
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type Section = {
  id: string
  projectId: string
  name: string
  position: number
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: string
  title: string
  description: string
  due: IsoDate | null
  reminderAt: string | null
  recurrence: Recurrence | null
  priority: Priority
  projectId: string | null
  sectionId: string | null
  parentId: string | null
  position: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "number" && (PRIORITIES as readonly number[]).includes(value)
}
