import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Db } from "@tickleaf/db"
import { toast } from "sonner"
import { labels } from "@/lib/labels"
import { getLocalDatabase } from "@/lib/local-db/current-database"
import { listProjects } from "@/lib/services/projects"
import { listAllTasks } from "@/lib/services/tasks"

export const queryKeys = {
  tasks: ["tasks"] as const,
  projects: ["projects"] as const,
}

export function runDb<Result>(task: (db: Db) => Promise<Result>): Promise<Result> {
  return getLocalDatabase().run(task)
}

export const tasksQuery = queryOptions({
  queryKey: queryKeys.tasks,
  queryFn: () => runDb(listAllTasks),
})

export const projectsQuery = queryOptions({
  queryKey: queryKeys.projects,
  queryFn: () => runDb(listProjects),
})

export function useTasks() {
  return useQuery(tasksQuery)
}

export function useProjects() {
  return useQuery(projectsQuery)
}

export function useInvalidateData() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
    ])
  }
}

type DbTask = (db: Db) => Promise<unknown>

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : labels.boot.unexpected
}

export function useDbAction() {
  const invalidate = useInvalidateData()
  const mutation = useMutation({
    mutationFn: (task: DbTask) => runDb(task),
    onError: (error) => toast.error(labels.toast.failed, { description: errorMessage(error) }),
    onSettled: invalidate,
  })
  const { mutateAsync } = mutation
  return async <Result>(task: (db: Db) => Promise<Result>): Promise<Result | null> => {
    try {
      return (await mutateAsync(task)) as Result
    } catch {
      return null
    }
  }
}
