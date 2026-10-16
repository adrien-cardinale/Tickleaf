import type { IsoDate, Project, QuickAddResult, Task } from "@tickleaf/core"
import type { Db } from "@tickleaf/db"
import { findOrCreateProject } from "./projects"
import { createTask } from "./tasks"

export type QuickAddDefaults = { due: IsoDate | null; projectId: string | null }

export type QuickAddOutcome = { task: Task; project: Project | null; createdProject: Project | null }

export async function addQuickTask(
  db: Db,
  parsed: QuickAddResult,
  defaults: QuickAddDefaults,
): Promise<QuickAddOutcome> {
  const assigned = parsed.projectName === null ? null : await findOrCreateProject(db, parsed.projectName)
  const task = await createTask(db, {
    title: parsed.title,
    due: parsed.due ?? defaults.due,
    priority: parsed.priority,
    projectId: assigned?.project.id ?? defaults.projectId,
  })
  return {
    task,
    project: assigned?.project ?? null,
    createdProject: assigned?.created ? assigned.project : null,
  }
}
