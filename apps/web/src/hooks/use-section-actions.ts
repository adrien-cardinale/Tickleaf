import { toast } from "sonner"
import { labels } from "@/lib/labels"
import { useDbAction } from "@/lib/queries"
import { createSection, removeSection, renameSection, restoreSection } from "@/lib/services/sections"
import { restoreTasks } from "@/lib/services/tasks"

export function useSectionActions() {
  const execute = useDbAction()

  return {
    create: async (projectId: string, name: string): Promise<boolean> => {
      return (await execute((db) => createSection(db, projectId, name))) !== null
    },

    rename: async (id: string, name: string) => {
      await execute((db) => renameSection(db, id, name))
    },

    remove: async (id: string) => {
      const removed = await execute((db) => removeSection(db, id))
      if (!removed) return
      toast(labels.toast.sectionDeleted(removed.section.name), {
        action: {
          label: labels.toast.undo,
          onClick: () =>
            void execute(async (db) => {
              await restoreSection(db, removed.section)
              await restoreTasks(db, removed.movedTasks)
            }),
        },
      })
    },
  }
}
