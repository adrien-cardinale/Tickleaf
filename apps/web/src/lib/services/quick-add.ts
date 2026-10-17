import type { IsoDate, Project, QuickAddResult, Task } from "@tickleaf/core"
import type { Db } from "@tickleaf/db"
import { findOrCreateProject } from "./projects"
import { createTask } from "./tasks"

export type QuickAddDefaults = { due: IsoDate | null; projectId: string | null; sectionId: string | null }

export type QuickAddOutcome = { task: Task; project: Project | null; createdProject: Project | null }

export async function addQuickTask(
  db: Db,
  parsed: QuickAddResult,
  defaults: QuickAddDefaults,
): Promise<QuickAddOutcome> {
  const assigned = parsed.projectName === null ? null : await findOrCreateProject(db, parsed.projectName)
  const projectId = assigned?.project.id ?? defaults.projectId
  const task = await createTask(db, {
    title: parsed.title,
    due: parsed.due ?? defaults.due,
    priority: parsed.priority,
    recurrence: parsed.recurrence,
    projectId,
    sectionId: projectId === defaults.projectId ? defaults.sectionId : null,
  })
  return {
    task,
    project: assigned?.project ?? null,
    createdProject: assigned?.created ? assigned.project : null,
  }
}
