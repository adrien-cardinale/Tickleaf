import type { Project, Task } from "@tickleaf/core"
import { type Db, projects, tasks } from "@tickleaf/db"
import { and, asc, eq, isNull, max } from "@tickleaf/db/orm"
import { newId, nowIso } from "./clock"

export type ArchivedProject = { project: Project; movedTasks: Task[] }

export async function listProjects(db: Db): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(isNull(projects.archivedAt))
    .orderBy(asc(projects.position), asc(projects.createdAt))
}

async function nextPosition(db: Db): Promise<number> {
  const [row] = await db.select({ value: max(projects.position) }).from(projects)
  return (row?.value ?? -1) + 1
}

export async function createProject(db: Db, name: string): Promise<Project> {
  const timestamp = nowIso()
  const project: Project = {
    id: newId(),
    name: name.trim(),
    position: await nextPosition(db),
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.insert(projects).values(project)
  return project
}

export async function findProjectByName(db: Db, name: string): Promise<Project | null> {
  const needle = name.trim().toLowerCase()
  const active = await listProjects(db)
  return active.find((project) => project.name.toLowerCase() === needle) ?? null
}

export async function findOrCreateProject(db: Db, name: string): Promise<{ project: Project; created: boolean }> {
  const existing = await findProjectByName(db, name)
  if (existing) return { project: existing, created: false }
  return { project: await createProject(db, name), created: true }
}

export async function renameProject(db: Db, id: string, name: string): Promise<void> {
  await db.update(projects).set({ name: name.trim(), updatedAt: nowIso() }).where(eq(projects.id, id))
}

export async function archiveProject(db: Db, id: string): Promise<ArchivedProject | null> {
  const [project] = await db.select().from(projects).where(eq(projects.id, id))
  if (!project) return null
  const timestamp = nowIso()
  const openInProject = and(eq(tasks.projectId, id), isNull(tasks.completedAt))
  const movedTasks = await db.select().from(tasks).where(openInProject)
  await db.update(tasks).set({ projectId: null, updatedAt: timestamp }).where(openInProject)
  await db.update(projects).set({ archivedAt: timestamp, updatedAt: timestamp }).where(eq(projects.id, id))
  return { project, movedTasks }
}

export async function restoreProject(db: Db, project: Project): Promise<void> {
  await db.insert(projects).values(project).onConflictDoUpdate({ target: projects.id, set: project })
}

export async function removeProject(db: Db, id: string): Promise<void> {
  await db.update(tasks).set({ projectId: null }).where(eq(tasks.projectId, id))
  await db.delete(projects).where(eq(projects.id, id))
}
