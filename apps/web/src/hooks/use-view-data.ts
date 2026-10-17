import { isOpen, isSubtask, matchesSearch, type Task } from "@tickleaf/core"
import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-context"
import { useToday } from "@/hooks/use-today"
import { useProjects, useTasks } from "@/lib/queries"

export function useViewData() {
  const today = useToday()
  const { search } = useWorkspace()
  const tasksQuery = useTasks()
  const projectsQuery = useProjects()
  const tasks = tasksQuery.data
  const projects = projectsQuery.data

  return useMemo(() => {
    const visible = (tasks ?? []).filter((task) => !isSubtask(task) && matchesSearch(task, search))
    const names = new Map((projects ?? []).map((project) => [project.id, project.name]))
    return {
      today,
      ready: tasks !== undefined && projects !== undefined,
      projects: projects ?? [],
      openTasks: visible.filter(isOpen),
      completedTasks: visible.filter((task) => !isOpen(task)),
      projectNameOf: (task: Task) => (task.projectId === null ? null : (names.get(task.projectId) ?? null)),
    }
  }, [today, search, tasks, projects])
}
