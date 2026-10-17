import { type IsoDate, type Project, parseQuickAdd, type Task } from "@tickleaf/core"
import type { Db } from "@tickleaf/db"
import { toast } from "sonner"
import { dueLabel } from "@/lib/format"
import { labels } from "@/lib/labels"
import { useDbAction } from "@/lib/queries"
import { removeProject } from "@/lib/services/projects"
import { addQuickTask } from "@/lib/services/quick-add"
import {
  completeTask,
  deleteTask,
  reopenTask,
  rescheduleOverdue,
  restoreTask,
  restoreTasks,
  type TaskPatch,
  updateTask,
} from "@/lib/services/tasks"

export type QuickAddContext = { due: IsoDate | null; project: Project | null; sectionId?: string | null }

type UndoableToast = { message: string; undo: (db: Db) => Promise<void> }

export function useTaskActions() {
  const execute = useDbAction()

  const showUndo = ({ message, undo }: UndoableToast) => {
    toast(message, {
      action: { label: labels.toast.undo, onClick: () => void execute(undo) },
    })
  }

  return {
    toggle: async (task: Task) => {
      const done = task.completedAt !== null
      const previous = await execute((db) => (done ? reopenTask(db, task.id) : completeTask(db, task.id)))
      if (!previous) return
      showUndo({
        message: done ? labels.toast.reopened : labels.toast.completed,
        undo: (db) => restoreTask(db, previous),
      })
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

    remove: async (id: string) => {
      const previous = await execute((db) => deleteTask(db, id))
      if (!previous) return
      showUndo({ message: labels.toast.deleted, undo: (db) => restoreTask(db, previous) })
    },

    rescheduleOverdue: async (today: IsoDate) => {
      const previous = await execute((db) => rescheduleOverdue(db, today))
      if (!previous || previous.length === 0) return
      showUndo({ message: labels.toast.rescheduled(previous.length), undo: (db) => restoreTasks(db, previous) })
    },
  }
}
