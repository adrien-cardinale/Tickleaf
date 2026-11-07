import { isOpen, isSubtask, matchesSearch, type Task, todayIso } from "@tickleaf/core"
import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-context"
import { useMinuteClock } from "@/hooks/use-minute-clock"
import { useProjects, useTasks } from "@/lib/queries"

export function useViewData() {
  const now = useMinuteClock()
  const today = todayIso(now)
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
      now,
      ready: tasks !== undefined && projects !== undefined,
      projects: projects ?? [],
      openTasks: visible.filter(isOpen),
      completedTasks: visible.filter((task) => !isOpen(task)),
      projectNameOf: (task: Task) => (task.projectId === null ? null : (names.get(task.projectId) ?? null)),
    }
  }, [today, now, search, tasks, projects])
}
