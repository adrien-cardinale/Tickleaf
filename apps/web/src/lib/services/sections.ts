import type { Section, Task } from "@tickleaf/core"
import { type Db, projects, sections, tasks } from "@tickleaf/db"
import { and, asc, eq, isNull, max } from "@tickleaf/db/orm"
import { newId, nowIso, touched } from "./clock"

export type RemovedSection = { section: Section; movedTasks: Task[] }

export async function listSections(db: Db): Promise<Section[]> {
  return db
    .select({
      id: sections.id,
      projectId: sections.projectId,
      name: sections.name,
      position: sections.position,
      createdAt: sections.createdAt,
      updatedAt: sections.updatedAt,
    })
    .from(sections)
    .innerJoin(projects, eq(projects.id, sections.projectId))
    .where(and(isNull(sections.deletedAt), isNull(projects.archivedAt), isNull(projects.deletedAt)))
    .orderBy(asc(sections.position), asc(sections.createdAt))
}

async function nextPosition(db: Db, projectId: string): Promise<number> {
  const [row] = await db
    .select({ value: max(sections.position) })
    .from(sections)
    .where(eq(sections.projectId, projectId))
  return (row?.value ?? -1) + 1
}

export async function createSection(db: Db, projectId: string, name: string): Promise<Section> {
  const timestamp = nowIso()
  const section: Section = {
    id: newId(),
    projectId,
    name: name.trim(),
    position: await nextPosition(db, projectId),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.insert(sections).values(section)
  return section
}

export async function renameSection(db: Db, id: string, name: string): Promise<void> {
  await db
    .update(sections)
    .set({ name: name.trim(), ...touched() })
    .where(eq(sections.id, id))
}

export async function removeSection(db: Db, id: string): Promise<RemovedSection | null> {
  const [section] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, id), isNull(sections.deletedAt)))
  if (!section) return null
  const timestamp = nowIso()
  const inSection = and(eq(tasks.sectionId, id), isNull(tasks.deletedAt))
  const movedTasks = await db.select().from(tasks).where(inSection)
  await db
    .update(tasks)
    .set({ sectionId: null, ...touched(timestamp) })
    .where(inSection)
  await db
    .update(sections)
    .set({ deletedAt: timestamp, ...touched(timestamp) })
    .where(eq(sections.id, id))
  return { section, movedTasks }
}

export async function restoreSection(db: Db, section: Section): Promise<void> {
  const restored = { ...section, deletedAt: null, ...touched() }
  await db.insert(sections).values(restored).onConflictDoUpdate({ target: sections.id, set: restored })
}
