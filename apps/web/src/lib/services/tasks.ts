import {
  DEFAULT_PRIORITY,
  type DueTime,
  daysBetween,
  type IsoDate,
  isDueTime,
  isOverdue,
  nextOccurrence,
  type Place,
  type Priority,
  type Recurrence,
  rescheduledToToday,
  type Task,
  todayIso,
} from "@tickleaf/core"
import { type Db, tasks } from "@tickleaf/db"
import { and, desc, eq, inArray, isNotNull, isNull, lte, max, or, type SQL } from "@tickleaf/db/orm"
import { deviceTimeZone, newId, nowIso, touched } from "./clock"

export type NewTask = {
  title: string
  description?: string
  due: IsoDate | null
  dueTime?: DueTime | null
  priority?: Priority
  projectId: string | null
  sectionId?: string | null
  parentId?: string | null
  recurrence?: Recurrence | null
  place?: Place | null
  focusDate?: IsoDate | null
}

export type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "due"
    | "dueTime"
    | "reminderAt"
    | "recurrence"
    | "place"
    | "priority"
    | "projectId"
    | "sectionId"
    | "focusDate"
  >
>

type StoredTaskPatch = TaskPatch & Partial<Pick<Task, "dueTimeZone">>

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

function checkedDueTime(due: IsoDate | null, dueTime: DueTime | null): DueTime | null {
  if (dueTime === null) return null
  if (!isDueTime(dueTime)) throw new Error(`Heure d’échéance ${dueTime} invalide`)
  if (due === null) throw new Error("Une heure d’échéance demande une date d’échéance")
  return dueTime
}

function zonedDueTime(due: IsoDate | null, dueTime: DueTime | null): Pick<Task, "dueTime" | "dueTimeZone"> {
  const checked = checkedDueTime(due, dueTime)
  return { dueTime: checked, dueTimeZone: checked === null ? null : deviceTimeZone() }
}

function withDueTimeChecked(previous: Task, patch: TaskPatch): StoredTaskPatch {
  const due = patch.due === undefined ? previous.due : patch.due
  if (patch.dueTime !== undefined) return { ...patch, ...zonedDueTime(due, patch.dueTime) }
  return due === null ? { ...patch, dueTime: null, dueTimeZone: null } : patch
}

export async function createTask(db: Db, input: NewTask): Promise<Task> {
  const timestamp = nowIso()
  const task: Task = {
    id: newId(),
    title: input.title,
    description: input.description ?? "",
    due: input.due,
    ...zonedDueTime(input.due, input.dueTime ?? null),
    reminderAt: null,
    recurrence: input.recurrence ?? null,
    place: input.place ?? null,
    priority: input.priority ?? DEFAULT_PRIORITY,
    projectId: input.projectId,
    sectionId: input.projectId === null ? null : (input.sectionId ?? null),
    parentId: input.parentId ?? null,
    position: await nextPosition(db),
    completedAt: null,
    focusDate: input.focusDate ?? null,
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

function withSectionCleared(previous: Task, patch: StoredTaskPatch): StoredTaskPatch {
  const movesProject = patch.projectId !== undefined && patch.projectId !== previous.projectId
  return movesProject && patch.sectionId === undefined ? { ...patch, sectionId: null } : patch
}

export async function updateTask(db: Db, id: string, patch: TaskPatch): Promise<Task> {
  const previous = await requireTask(db, id)
  await db
    .update(tasks)
    .set({ ...withSectionCleared(previous, withDueTimeChecked(previous, patch)), ...touched() })
    .where(eq(tasks.id, id))
  return previous
}

export async function updateTasks(db: Db, ids: readonly string[], patch: TaskPatch): Promise<Task[]> {
  const previous: Task[] = []
  for (const id of ids) previous.push(await updateTask(db, id, patch))
  return previous
}

export async function setFocus(db: Db, ids: readonly string[], focusDate: IsoDate | null): Promise<Task[]> {
  return updateTasks(db, ids, { focusDate })
}

export async function reorderTasks(db: Db, orderedIds: readonly string[]): Promise<void> {
  if (orderedIds.length === 0) return
  const current = await db
    .select({ id: tasks.id, position: tasks.position })
    .from(tasks)
    .where(inArray(tasks.id, [...orderedIds]))
  const positions = new Map(current.map((task) => [task.id, task.position]))
  for (const [index, id] of orderedIds.entries()) {
    if (!positions.has(id) || positions.get(id) === index) continue
    await db
      .update(tasks)
      .set({ position: index, ...touched() })
      .where(eq(tasks.id, id))
  }
}

export async function reorderAmong(db: Db, orderedIds: readonly string[]): Promise<void> {
  if (orderedIds.length === 0) return
  const current = await db
    .select({ id: tasks.id, position: tasks.position })
    .from(tasks)
    .where(inArray(tasks.id, [...orderedIds]))
  const slots = current.map((task) => task.position).sort((a, b) => a - b)
  const positions = new Map(current.map((task) => [task.id, task.position]))
  for (const [index, id] of orderedIds.entries()) {
    const slot = slots[index]
    if (slot === undefined || !positions.has(id) || positions.get(id) === slot) continue
    await db
      .update(tasks)
      .set({ position: slot, ...touched() })
      .where(eq(tasks.id, id))
  }
}

function shiftTimestamp(timestamp: string, days: number): string {
  const date = new Date(timestamp)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function nextRepetition(task: Task, recurrence: Recurrence, today: IsoDate): TaskPatch {
  const due = nextOccurrence(task.due, recurrence, today)
  const shift = daysBetween(task.due ?? today, due)
  return {
    due,
    reminderAt: task.reminderAt === null ? null : shiftTimestamp(task.reminderAt, shift),
    focusDate: null,
  }
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

async function isOpen(db: Db, id: string): Promise<boolean> {
  const task = await getTask(db, id)
  return task !== null && task.completedAt === null
}

export async function completeTasks(db: Db, ids: readonly string[], today: IsoDate = todayIso()): Promise<Task[]> {
  const previous: Task[] = []
  for (const id of ids) {
    if (await isOpen(db, id)) previous.push(...(await completeTask(db, id, today)))
  }
  return previous
}

export async function reopenTasks(db: Db, ids: readonly string[]): Promise<Task[]> {
  const previous: Task[] = []
  for (const id of ids) {
    const task = await getTask(db, id)
    if (task !== null && task.completedAt !== null) previous.push(await reopenTask(db, id))
  }
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

export async function deleteTasks(db: Db, ids: readonly string[]): Promise<Task[]> {
  const previous: Task[] = []
  for (const id of ids) previous.push(...(await deleteTask(db, id)))
  return previous
}

export async function rescheduleOverdue(db: Db, now: Date): Promise<Task[]> {
  const dueByToday = alive(and(isNull(tasks.completedAt), isNotNull(tasks.due), lte(tasks.due, todayIso(now))))
  const candidates = await db.select().from(tasks).where(dueByToday)
  const previous = candidates.filter((task) => isOverdue(task, now))
  const stamp = touched()
  for (const task of previous) {
    await db
      .update(tasks)
      .set({ ...rescheduledToToday(task, now), ...stamp })
      .where(eq(tasks.id, task.id))
  }
  return previous
}

export async function restoreTask(db: Db, snapshot: Task): Promise<void> {
  const restored = { ...snapshot, deletedAt: null, ...touched() }
  await db.insert(tasks).values(restored).onConflictDoUpdate({ target: tasks.id, set: restored })
}

export async function restoreTasks(db: Db, snapshots: readonly Task[]): Promise<void> {
  for (const snapshot of snapshots) await restoreTask(db, snapshot)
}
