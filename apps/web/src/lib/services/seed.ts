import { addDays, DEFAULT_PROJECT_COLOR, type IsoDate, type Priority, type ProjectColor } from "@tickleaf/core"
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

const SEED_PROJECT_COLORS: readonly ProjectColor[] = ["blue", "orange", "green"]

export async function seedStarterData(db: Db, today: IsoDate): Promise<void> {
  const created = []
  for (const [index, name] of labels.seed.projects.entries()) {
    created.push(await createProject(db, name, null, SEED_PROJECT_COLORS[index] ?? DEFAULT_PROJECT_COLOR))
  }
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
