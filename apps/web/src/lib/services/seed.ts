import { addDays, type IsoDate, type Priority } from "@tickleaf/core"
import type { Db } from "@tickleaf/db"
import { labels } from "@/lib/labels"
import { createProject } from "./projects"
import { createTask } from "./tasks"

type SeedTask = {
  title: string
  description?: string
  dueOffset: number | null
  priority: Priority
  projectIndex: number | null
}

export async function seedStarterData(db: Db, today: IsoDate): Promise<void> {
  const created = []
  for (const name of labels.seed.projects) created.push(await createProject(db, name))
  for (const seed of labels.seed.tasks as readonly SeedTask[]) {
    await createTask(db, {
      title: seed.title,
      description: seed.description ?? "",
      due: seed.dueOffset === null ? null : addDays(today, seed.dueOffset),
      priority: seed.priority,
      projectId: seed.projectIndex === null ? null : (created[seed.projectIndex]?.id ?? null),
    })
  }
}
