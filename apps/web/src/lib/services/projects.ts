import {
  canMoveProject,
  DEFAULT_PROJECT_COLOR,
  descendantIdsOf,
  type Project,
  type ProjectColor,
  type Task,
} from "@tickleaf/core"
import { type Db, projects, tasks } from "@tickleaf/db"
import { and, asc, eq, inArray, isNull, max, type SQL } from "@tickleaf/db/orm"
import { newId, nowIso, touched } from "./clock"

export type ProjectCascade = { project: Project; projects: Project[]; movedTasks: Task[] }

export type ProjectMove = { project: Project; previousParentId: string | null }

const activeProjects = and(isNull(projects.archivedAt), isNull(projects.deletedAt))

export async function listProjects(db: Db): Promise<Project[]> {
  return db.select().from(projects).where(activeProjects).orderBy(asc(projects.position), asc(projects.createdAt))
}

async function nextPosition(db: Db): Promise<number> {
  const [row] = await db.select({ value: max(projects.position) }).from(projects)
  return (row?.value ?? -1) + 1
}

export async function createProject(
  db: Db,
  name: string,
  parentId: string | null = null,
  color: ProjectColor = DEFAULT_PROJECT_COLOR,
): Promise<Project> {
  const timestamp = nowIso()
  const project: Project = {
    id: newId(),
    name: name.trim(),
    color,
    parentId,
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

export async function findOrCreateProject(
  db: Db,
  name: string,
  color: ProjectColor = DEFAULT_PROJECT_COLOR,
): Promise<{ project: Project; created: boolean }> {
  const existing = await findProjectByName(db, name)
  if (existing) return { project: existing, created: false }
  return { project: await createProject(db, name, null, color), created: true }
}

export async function renameProject(db: Db, id: string, name: string): Promise<void> {
  await db
    .update(projects)
    .set({ name: name.trim(), ...touched() })
    .where(eq(projects.id, id))
}

export async function setProjectColor(db: Db, id: string, color: ProjectColor): Promise<void> {
  await db
    .update(projects)
    .set({ color, ...touched() })
    .where(eq(projects.id, id))
}

export async function moveProject(db: Db, id: string, parentId: string | null): Promise<ProjectMove | null> {
  const active = await listProjects(db)
  const project = active.find((candidate) => candidate.id === id)
  if (!project || !canMoveProject(active, id, parentId)) return null
  await db
    .update(projects)
    .set({ parentId, ...touched() })
    .where(eq(projects.id, id))
  return { project, previousParentId: project.parentId }
}

async function projectWithDescendants(db: Db, id: string, scope: SQL | undefined): Promise<Project[]> {
  const candidates = await db.select().from(projects).where(scope)
  const ids = new Set([id, ...descendantIdsOf(candidates, id)])
  return candidates.filter((candidate) => ids.has(candidate.id))
}

async function moveTasksToInbox(db: Db, scope: SQL | undefined, timestamp: string): Promise<Task[]> {
  const movedTasks = await db.select().from(tasks).where(scope)
  await db
    .update(tasks)
    .set({ projectId: null, sectionId: null, ...touched(timestamp) })
    .where(scope)
  return movedTasks
}

type ProjectStamp = { archivedAt: string } | { deletedAt: string }

type CascadeRule = {
  projectScope: SQL | undefined
  taskScope: (projectIds: string[]) => SQL | undefined
  stamp: (timestamp: string) => ProjectStamp
}

const archiveRule: CascadeRule = {
  projectScope: activeProjects,
  taskScope: (projectIds) =>
    and(inArray(tasks.projectId, projectIds), isNull(tasks.completedAt), isNull(tasks.deletedAt)),
  stamp: (timestamp) => ({ archivedAt: timestamp }),
}

const removeRule: CascadeRule = {
  projectScope: isNull(projects.deletedAt),
  taskScope: (projectIds) => and(inArray(tasks.projectId, projectIds), isNull(tasks.deletedAt)),
  stamp: (timestamp) => ({ deletedAt: timestamp }),
}

async function cascade(db: Db, id: string, rule: CascadeRule): Promise<ProjectCascade | null> {
  const affected = await projectWithDescendants(db, id, rule.projectScope)
  const project = affected.find((candidate) => candidate.id === id)
  if (!project) return null
  const timestamp = nowIso()
  const projectIds = affected.map((candidate) => candidate.id)
  const movedTasks = await moveTasksToInbox(db, rule.taskScope(projectIds), timestamp)
  await db
    .update(projects)
    .set({ ...rule.stamp(timestamp), ...touched(timestamp) })
    .where(inArray(projects.id, projectIds))
  return { project, projects: affected, movedTasks }
}

export function archiveProject(db: Db, id: string): Promise<ProjectCascade | null> {
  return cascade(db, id, archiveRule)
}

export function removeProject(db: Db, id: string): Promise<ProjectCascade | null> {
  return cascade(db, id, removeRule)
}

export async function restoreProject(db: Db, project: Project): Promise<void> {
  const restored = { ...project, deletedAt: null, ...touched() }
  await db.insert(projects).values(restored).onConflictDoUpdate({ target: projects.id, set: restored })
}

export async function restoreProjects(db: Db, snapshots: readonly Project[]): Promise<void> {
  for (const snapshot of snapshots) await restoreProject(db, snapshot)
}
