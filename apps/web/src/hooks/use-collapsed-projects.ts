import { useCallback, useState } from "react"

const COLLAPSED_PROJECTS_KEY = "tickleaf.collapsedProjects"

function readCollapsedProjects(): Set<string> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(COLLAPSED_PROJECTS_KEY) ?? "[]")
    return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : [])
  } catch {
    return new Set()
  }
}

function writeCollapsedProjects(ids: ReadonlySet<string>): void {
  try {
    localStorage.setItem(COLLAPSED_PROJECTS_KEY, JSON.stringify([...ids]))
  } catch {}
}

export function useCollapsedProjects() {
  const [collapsed, setCollapsed] = useState(readCollapsedProjects)

  const toggle = useCallback((id: string) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      writeCollapsedProjects(next)
      return next
    })
  }, [])

  const isCollapsed = useCallback((id: string) => collapsed.has(id), [collapsed])

  return { isCollapsed, toggle }
}
