import type { Project, ProjectColor } from "@tickleaf/core"
import { toast } from "sonner"
import { labels } from "@/lib/labels"
import { useDbAction } from "@/lib/queries"
import {
  archiveProject,
  createProject,
  findOrCreateProject,
  moveProject,
  type ProjectCascade,
  renameProject,
  restoreProjects,
  setProjectColor,
} from "@/lib/services/projects"
import { restoreTasks } from "@/lib/services/tasks"

function archivedMessage({ project, projects }: ProjectCascade): string {
  const subprojects = projects.length - 1
  if (subprojects === 0) return labels.toast.projectArchived(project.name)
  return labels.toast.projectArchivedWithSubprojects(project.name, subprojects)
}

export function useProjectActions() {
  const execute = useDbAction()

  return {
    create: async (name: string, color: ProjectColor): Promise<Project | null> => {
      const outcome = await execute((db) => findOrCreateProject(db, name, color))
      return outcome?.project ?? null
    },

    createSubproject: async (name: string, parentId: string, color: ProjectColor): Promise<Project | null> => {
      return execute((db) => createProject(db, name, parentId, color))
    },

    rename: async (id: string, name: string) => {
      await execute((db) => renameProject(db, id, name))
    },

    setColor: async (id: string, color: ProjectColor) => {
      await execute((db) => setProjectColor(db, id, color))
    },

    move: async (id: string, parent: Project | null): Promise<boolean> => {
      const moved = await execute((db) => moveProject(db, id, parent?.id ?? null))
      if (!moved) return false
      toast(labels.toast.projectMoved(moved.project.name, parent?.name ?? null), {
        action: {
          label: labels.toast.undo,
          onClick: () => void execute((db) => moveProject(db, id, moved.previousParentId)),
        },
      })
      return true
    },

    archive: async (id: string): Promise<boolean> => {
      const archived = await execute((db) => archiveProject(db, id))
      if (!archived) return false
      toast(archivedMessage(archived), {
        action: {
          label: labels.toast.undo,
          onClick: () =>
            void execute(async (db) => {
              await restoreProjects(db, archived.projects)
              await restoreTasks(db, archived.movedTasks)
            }),
        },
      })
      return true
    },
  }
}
