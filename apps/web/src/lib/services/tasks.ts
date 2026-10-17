import {
  DEFAULT_PRIORITY,
  daysBetween,
  type IsoDate,
  nextOccurrence,
  type Priority,
  type Recurrence,
  type Task,
  todayIso,
} from "@tickleaf/core"
import { type Db, tasks } from "@tickleaf/db"
import { and, desc, eq, inArray, isNotNull, isNull, lt, max, or, type SQL } from "@tickleaf/db/orm"
import { newId, nowIso, touched } from "./clock"

export type NewTask = {
  title: string
  description?: string
  due: IsoDate | null
  priority?: Priority
  projectId: string | null
  sectionId?: string | null
  parentId?: string | null
  recurrence?: Recurrence | null
}

export type TaskPatch = Partial<
  Pick<Task, "title" | "description" | "due" | "reminderAt" | "recurrence" | "priority" | "projectId" | "sectionId">
>

const notDeleted = isNull(tasks.deletedAt)

function alive(condition: SQL | undefined): SQL | undefined {
  return and(notDeleted, condition)
}

export async function listAllTasks(db: Db): Promise<Task[]> {
  return db.select().from(tasks).where(notDeleted)
}

export async function listOpenTasks(db: Db): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(alive(isNull(tasks.completedAt)))
}

export async function listCompletedTasks(db: Db): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(alive(isNotNull(tasks.completedAt)))
    .orderBy(desc(tasks.completedAt))
}

export async function getTask(db: Db, id: string): Promise<Task | null> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(alive(eq(tasks.id, id)))
  return task ?? null
}

async function nextPosition(db: Db): Promise<number> {
  const [row] = await db.select({ value: max(tasks.position) }).from(tasks)
  return (row?.value ?? -1) + 1
}

export async function createTask(db: Db, input: NewTask): Promise<Task> {
  const timestamp = nowIso()
  const task: Task = {
    id: newId(),
    title: input.title,
    description: input.description ?? "",
    due: input.due,
    reminderAt: null,
    recurrence: input.recurrence ?? null,
    priority: input.priority ?? DEFAULT_PRIORITY,
    projectId: input.projectId,
    sectionId: input.projectId === null ? null : (input.sectionId ?? null),
    parentId: input.parentId ?? null,
    position: await nextPosition(db),
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.insert(tasks).values(task)
  return task
}

export async function createSubtask(db: Db, parentId: string, title: string): Promise<Task> {
  return createTask(db, { title, due: null, projectId: null, parentId })
}

async function requireTask(db: Db, id: string): Promise<Task> {
  const task = await getTask(db, id)
  if (!task) throw new Error(`Tâche ${id} introuvable`)
  return task
}

function withSectionCleared(previous: Task, patch: TaskPatch): TaskPatch {
  const movesProject = patch.projectId !== undefined && patch.projectId !== previous.projectId
  return movesProject && patch.sectionId === undefined ? { ...patch, sectionId: null } : patch
}

export async function updateTask(db: Db, id: string, patch: TaskPatch): Promise<Task> {
  const previous = await requireTask(db, id)
  await db
    .update(tasks)
    .set({ ...withSectionCleared(previous, patch), ...touched() })
    .where(eq(tasks.id, id))
  return previous
}

function shiftTimestamp(timestamp: string, days: number): string {
  const date = new Date(timestamp)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function nextRepetition(task: Task, recurrence: Recurrence, today: IsoDate): TaskPatch {
  const due = nextOccurrence(task.due, recurrence, today)
  const shift = daysBetween(task.due ?? today, due)
  return { due, reminderAt: task.reminderAt === null ? null : shiftTimestamp(task.reminderAt, shift) }
}

async function markSubtasks(db: Db, parentId: string, completedAt: string | null): Promise<Task[]> {
  const pending = completedAt === null ? isNotNull(tasks.completedAt) : isNull(tasks.completedAt)
  const previous = await db
    .select()
    .from(tasks)
    .where(alive(and(eq(tasks.parentId, parentId), pending)))
  if (previous.length === 0) return []
  await db
    .update(tasks)
    .set({ completedAt, ...touched() })
    .where(
      inArray(
        tasks.id,
        previous.map((task) => task.id),
      ),
    )
  return previous
}

export async function completeTask(db: Db, id: string, today: IsoDate = todayIso()): Promise<Task[]> {
  const previous = await requireTask(db, id)
  if (previous.recurrence !== null) {
    await db
      .update(tasks)
      .set({ ...nextRepetition(previous, previous.recurrence, today), ...touched() })
      .where(eq(tasks.id, id))
    return [previous, ...(await markSubtasks(db, id, null))]
  }
  const timestamp = nowIso()
  await db
    .update(tasks)
    .set({ completedAt: timestamp, ...touched(timestamp) })
    .where(eq(tasks.id, id))
  return [previous, ...(await markSubtasks(db, id, timestamp))]
}

export async function reopenTask(db: Db, id: string): Promise<Task> {
  const previous = await requireTask(db, id)
  await db
    .update(tasks)
    .set({ completedAt: null, ...touched() })
    .where(eq(tasks.id, id))
  return previous
}

export async function deleteTask(db: Db, id: string): Promise<Task[]> {
  const previous = await db
    .select()
    .from(tasks)
    .where(alive(or(eq(tasks.id, id), eq(tasks.parentId, id))))
  if (previous.length === 0) return []
  const timestamp = nowIso()
  await db
    .update(tasks)
    .set({ deletedAt: timestamp, ...touched(timestamp) })
    .where(
      inArray(
        tasks.id,
        previous.map((task) => task.id),
      ),
    )
  return previous
}

export async function rescheduleOverdue(db: Db, today: IsoDate): Promise<Task[]> {
  const overdue = alive(and(isNull(tasks.completedAt), isNotNull(tasks.due), lt(tasks.due, today)))
  const previous = await db.select().from(tasks).where(overdue)
  if (previous.length === 0) return []
  await db
    .update(tasks)
    .set({ due: today, ...touched() })
    .where(
      inArray(
        tasks.id,
        previous.map((task) => task.id),
      ),
    )
  return previous
}

export async function restoreTask(db: Db, snapshot: Task): Promise<void> {
  const restored = { ...snapshot, deletedAt: null, ...touched() }
  await db.insert(tasks).values(restored).onConflictDoUpdate({ target: tasks.id, set: restored })
}

export async function restoreTasks(db: Db, snapshots: readonly Task[]): Promise<void> {
  for (const snapshot of snapshots) await restoreTask(db, snapshot)
}
