import {
  type IsoDate,
  isFocused,
  nextOccurrence,
  type Project,
  parseQuickAdd,
  type Task,
  todayIso,
} from "@tickleaf/core"
import type { Db } from "@tickleaf/db"
import { toast } from "sonner"
import { useWorkspace } from "@/components/workspace-context"
import { dueLabel } from "@/lib/format"
import { labels } from "@/lib/labels"
import { useDbAction } from "@/lib/queries"
import { removeProject } from "@/lib/services/projects"
import { addQuickTask } from "@/lib/services/quick-add"
import {
  completeTask,
  completeTasks,
  createSubtask,
  deleteTask,
  deleteTasks,
  reopenTask,
  reopenTasks,
  reorderAmong,
  reorderTasks,
  rescheduleOverdue,
  restoreTasks,
  setFocus,
  type TaskPatch,
  updateTask,
  updateTasks,
} from "@/lib/services/tasks"

export type QuickAddContext = { due: IsoDate | null; project: Project | null; sectionId?: string | null }

type UndoableToast = { message: string; undo: (db: Db) => Promise<void> }

function toggleMessage(task: Task): string {
  if (task.completedAt !== null) return labels.toast.reopened
  if (task.recurrence === null) return labels.toast.completed
  const today = todayIso()
  return labels.toast.repeated(dueLabel(nextOccurrence(task.due, task.recurrence, today), today))
}

function idsOf(tasks: readonly Task[]): string[] {
  return tasks.map((task) => task.id)
}

function isDone(task: Task): boolean {
  return task.completedAt !== null
}

export function useTaskActions() {
  const execute = useDbAction()
  const { selectedTaskId, closeTask, clearSelection } = useWorkspace()

  const showUndo = ({ message, undo }: UndoableToast) => {
    toast(message, {
      action: { label: labels.toast.undo, onClick: () => void execute(undo) },
    })
  }

  const changeFocus = async (ids: readonly string[], focusDate: IsoDate | null) => {
    const previous = await execute((db) => setFocus(db, ids, focusDate))
    if (!previous || previous.length === 0) return
    const message = focusDate === null ? labels.toast.unfocused(ids.length) : labels.toast.focused(ids.length)
    showUndo({ message, undo: (db) => restoreTasks(db, previous) })
  }

  return {
    toggle: async (task: Task) => {
      const done = task.completedAt !== null
      const previous = await execute(async (db) =>
        done ? [await reopenTask(db, task.id)] : await completeTask(db, task.id),
      )
      if (!previous) return
      showUndo({ message: toggleMessage(task), undo: (db) => restoreTasks(db, previous) })
    },

    toggleSubtask: async (subtask: Task) => {
      const done = subtask.completedAt !== null
      await execute((db): Promise<unknown> => (done ? reopenTask(db, subtask.id) : completeTask(db, subtask.id)))
    },

    addSubtask: async (parentId: string, title: string) => {
      await execute((db) => createSubtask(db, parentId, title))
    },

    add: async (input: string, context: QuickAddContext, today: IsoDate): Promise<boolean> => {
      const parsed = parseQuickAdd(input, today)
      if (parsed.title === "") return false
      const defaults = {
        due: context.due,
        projectId: context.project?.id ?? null,
        sectionId: context.sectionId ?? null,
      }
      const outcome = await execute((db) => addQuickTask(db, parsed, defaults))
      if (!outcome) return false
      const { task, createdProject } = outcome
      const projectName = (outcome.project ?? context.project)?.name ?? null
      const where = [task.due ? dueLabel(task.due, today) : null, projectName].filter(Boolean).join(" · ")
      showUndo({
        message: where ? labels.toast.addedWith(where) : labels.toast.added,
        undo: async (db) => {
          await deleteTask(db, task.id)
          if (createdProject) await removeProject(db, createdProject.id)
        },
      })
      return true
    },

    update: async (id: string, patch: TaskPatch) => {
      await execute((db) => updateTask(db, id, patch))
    },

    reorder: async (orderedIds: readonly string[]) => {
      await execute((db) => reorderTasks(db, orderedIds))
    },

    reorderAmong: async (orderedIds: readonly string[]) => {
      await execute((db) => reorderAmong(db, orderedIds))
    },

    moveToSection: async (id: string, sectionId: string | null, orderedIds: readonly string[]) => {
      await execute(async (db) => {
        await updateTask(db, id, { sectionId })
        await reorderTasks(db, orderedIds)
      })
    },

    remove: async (id: string) => {
      const previous = await execute((db) => deleteTask(db, id))
      if (!previous || previous.length === 0) return
      showUndo({ message: labels.toast.deleted, undo: (db) => restoreTasks(db, previous) })
    },

    updateMany: async (ids: readonly string[], patch: TaskPatch) => {
      clearSelection()
      const previous = await execute((db) => updateTasks(db, ids, patch))
      if (!previous || previous.length === 0) return
      showUndo({ message: labels.toast.updatedMany(ids.length), undo: (db) => restoreTasks(db, previous) })
    },

    completeMany: async (tasks: readonly Task[]) => {
      clearSelection()
      const reopening = tasks.every(isDone)
      const targets = reopening ? tasks : tasks.filter((task) => !isDone(task))
      const ids = idsOf(targets)
      const previous = await execute((db) => (reopening ? reopenTasks(db, ids) : completeTasks(db, ids)))
      if (!previous || previous.length === 0) return
      const message = reopening ? labels.toast.reopenedMany(ids.length) : labels.toast.completedMany(ids.length)
      showUndo({ message, undo: (db) => restoreTasks(db, previous) })
    },

    removeMany: async (ids: readonly string[]) => {
      clearSelection()
      if (selectedTaskId !== null && ids.includes(selectedTaskId)) closeTask()
      const previous = await execute((db) => deleteTasks(db, ids))
      if (!previous || previous.length === 0) return
      showUndo({ message: labels.toast.deletedMany(ids.length), undo: (db) => restoreTasks(db, previous) })
    },

    focus: async (task: Task, today: IsoDate) => {
      await changeFocus([task.id], isFocused(task, today) ? null : today)
    },

    focusMany: async (ids: readonly string[], today: IsoDate) => {
      clearSelection()
      await changeFocus(ids, today)
    },

    unfocusMany: async (ids: readonly string[]) => {
      clearSelection()
      await changeFocus(ids, null)
    },

    rescheduleOverdue: async (now: Date) => {
      const previous = await execute((db) => rescheduleOverdue(db, now))
      if (!previous || previous.length === 0) return
      showUndo({ message: labels.toast.rescheduled(previous.length), undo: (db) => restoreTasks(db, previous) })
    },
  }
}
