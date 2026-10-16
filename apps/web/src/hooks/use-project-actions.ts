import type { Project } from "@tickleaf/core"
import { toast } from "sonner"
import { labels } from "@/lib/labels"
import { useDbAction } from "@/lib/queries"
import { archiveProject, findOrCreateProject, renameProject, restoreProject } from "@/lib/services/projects"
import { restoreTasks } from "@/lib/services/tasks"

export function useProjectActions() {
  const execute = useDbAction()

  return {
    create: async (name: string): Promise<Project | null> => {
      const outcome = await execute((db) => findOrCreateProject(db, name))
      return outcome?.project ?? null
    },

    rename: async (id: string, name: string) => {
      await execute((db) => renameProject(db, id, name))
    },

    archive: async (id: string): Promise<boolean> => {
      const archived = await execute((db) => archiveProject(db, id))
      if (!archived) return false
      toast(labels.toast.projectArchived(archived.project.name), {
        action: {
          label: labels.toast.undo,
          onClick: () =>
            void execute(async (db) => {
              await restoreProject(db, archived.project)
              await restoreTasks(db, archived.movedTasks)
            }),
        },
      })
      return true
    },
  }
}
