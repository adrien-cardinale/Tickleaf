import { type QueryClient, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { subtasksOf, type Task } from "@tickleaf/core"
import type { Db } from "@tickleaf/db"
import { useCallback } from "react"
import { toast } from "sonner"
import { labels } from "@/lib/labels"
import { getLocalDatabase } from "@/lib/local-db/current-database"
import { listProjects } from "@/lib/services/projects"
import { listSections } from "@/lib/services/sections"
import { listAllTasks } from "@/lib/services/tasks"

export const queryKeys = {
  tasks: ["tasks"] as const,
  projects: ["projects"] as const,
  sections: ["sections"] as const,
}

const localWriteListeners = new Set<() => void>()

export function onLocalWrite(listener: () => void): () => void {
  localWriteListeners.add(listener)
  return () => localWriteListeners.delete(listener)
}

function notifyLocalWrite(): void {
  for (const listener of localWriteListeners) listener()
}

export async function invalidateData(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
    queryClient.invalidateQueries({ queryKey: queryKeys.sections }),
  ])
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

export const sectionsQuery = queryOptions({
  queryKey: queryKeys.sections,
  queryFn: () => runDb(listSections),
})

export function useTasks() {
  return useQuery(tasksQuery)
}

export function useSubtasks(parentId: string) {
  const select = useCallback((tasks: Task[]) => subtasksOf(tasks, parentId), [parentId])
  return useQuery({ ...tasksQuery, select })
}

export function useProjects() {
  return useQuery(projectsQuery)
}

export function useSections() {
  return useQuery(sectionsQuery)
}

export function useInvalidateData() {
  const queryClient = useQueryClient()
  return () => invalidateData(queryClient)
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
    onSettled: async () => {
      notifyLocalWrite()
      await invalidate()
    },
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
