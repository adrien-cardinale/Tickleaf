import type { Task } from "@tickleaf/core"
import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-context"
import { useTasks } from "@/lib/queries"

function selectedAmong(tasks: readonly Task[] | undefined, selectedIds: ReadonlySet<string>): readonly Task[] {
  return (tasks ?? []).filter((task) => selectedIds.has(task.id))
}

export function useSelectedTasks(): readonly Task[] {
  const { selectedIds } = useWorkspace()
  const { data: tasks } = useTasks()
  return useMemo(() => selectedAmong(tasks, selectedIds), [tasks, selectedIds])
}

export function useMenuTargets(task: Task): readonly Task[] {
  const { selectedIds } = useWorkspace()
  const { data: tasks } = useTasks()
  const inGroup = selectedIds.has(task.id) && selectedIds.size > 1
  return useMemo(() => {
    if (!inGroup) return [task]
    const selected = selectedAmong(tasks, selectedIds)
    return selected.length > 1 ? selected : [task]
  }, [inGroup, task, tasks, selectedIds])
}
