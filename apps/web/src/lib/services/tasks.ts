import { DEFAULT_PRIORITY, type IsoDate, type Priority, type Task } from "@tickleaf/core"
import { type Db, tasks } from "@tickleaf/db"
import { and, desc, eq, inArray, isNotNull, isNull, lt, max } from "@tickleaf/db/orm"
import { newId, nowIso } from "./clock"

export type NewTask = {
  title: string
  description?: string
  due: IsoDate | null
  priority?: Priority
  projectId: string | null
}

export type TaskPatch = Partial<Pick<Task, "title" | "description" | "due" | "priority" | "projectId">>

export async function listAllTasks(db: Db): Promise<Task[]> {
  return db.select().from(tasks)
}

export async function listOpenTasks(db: Db): Promise<Task[]> {
  return db.select().from(tasks).where(isNull(tasks.completedAt))
}

export async function listCompletedTasks(db: Db): Promise<Task[]> {
  return db.select().from(tasks).where(isNotNull(tasks.completedAt)).orderBy(desc(tasks.completedAt))
}

export async function getTask(db: Db, id: string): Promise<Task | null> {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id))
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
    priority: input.priority ?? DEFAULT_PRIORITY,
    projectId: input.projectId,
    position: await nextPosition(db),
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.insert(tasks).values(task)
  return task
}

async function requireTask(db: Db, id: string): Promise<Task> {
  const task = await getTask(db, id)
  if (!task) throw new Error(`Tâche ${id} introuvable`)
  return task
}

export async function updateTask(db: Db, id: string, patch: TaskPatch): Promise<Task> {
  const previous = await requireTask(db, id)
  await db
    .update(tasks)
    .set({ ...patch, updatedAt: nowIso() })
    .where(eq(tasks.id, id))
  return previous
}

export async function completeTask(db: Db, id: string): Promise<Task> {
  const previous = await requireTask(db, id)
  const timestamp = nowIso()
  await db.update(tasks).set({ completedAt: timestamp, updatedAt: timestamp }).where(eq(tasks.id, id))
  return previous
}

export async function reopenTask(db: Db, id: string): Promise<Task> {
  const previous = await requireTask(db, id)
  await db.update(tasks).set({ completedAt: null, updatedAt: nowIso() }).where(eq(tasks.id, id))
  return previous
}

export async function deleteTask(db: Db, id: string): Promise<Task | null> {
  const previous = await getTask(db, id)
  await db.delete(tasks).where(eq(tasks.id, id))
  return previous
}

export async function rescheduleOverdue(db: Db, today: IsoDate): Promise<Task[]> {
  const overdue = and(isNull(tasks.completedAt), isNotNull(tasks.due), lt(tasks.due, today))
  const previous = await db.select().from(tasks).where(overdue)
  if (previous.length === 0) return []
  await db
    .update(tasks)
    .set({ due: today, updatedAt: nowIso() })
    .where(
      inArray(
        tasks.id,
        previous.map((task) => task.id),
      ),
    )
  return previous
}

export async function restoreTask(db: Db, snapshot: Task): Promise<void> {
  await db.insert(tasks).values(snapshot).onConflictDoUpdate({ target: tasks.id, set: snapshot })
}

export async function restoreTasks(db: Db, snapshots: readonly Task[]): Promise<void> {
  for (const snapshot of snapshots) await restoreTask(db, snapshot)
}
