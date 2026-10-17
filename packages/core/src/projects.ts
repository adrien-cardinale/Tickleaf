import type { Project } from "./types"

export const MAX_PROJECT_DEPTH = 3

export const PROJECT_COLORS = [
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
] as const

export type ProjectColor = (typeof PROJECT_COLORS)[number]

export const DEFAULT_PROJECT_COLOR: ProjectColor = "gray"

export function isProjectColor(value: unknown): value is ProjectColor {
  return typeof value === "string" && (PROJECT_COLORS as readonly string[]).includes(value)
}

type TreeProject = Pick<Project, "id" | "parentId">

export type ProjectNode<T extends TreeProject> = { project: T; children: ProjectNode<T>[] }

export type ProjectOutlineEntry<T extends TreeProject> = { project: T; depth: number }

function byId<T extends TreeProject>(projects: readonly T[]): Map<string, T> {
  return new Map(projects.map((project) => [project.id, project]))
}

export function childProjectsOf<T extends TreeProject>(projects: readonly T[], parentId: string): T[] {
  return projects.filter((project) => project.parentId === parentId && project.id !== parentId)
}

function hasReachableParent(projects: readonly TreeProject[], known: Map<string, TreeProject>, project: TreeProject) {
  const { id, parentId } = project
  if (parentId === null || parentId === id || !known.has(parentId)) return false
  return !descendantIdsOf(projects, id).includes(parentId)
}

export function rootProjectsOf<T extends TreeProject>(projects: readonly T[]): T[] {
  const known = byId(projects)
  return projects.filter((project) => !hasReachableParent(projects, known, project))
}

export function buildProjectTree<T extends TreeProject>(projects: readonly T[]): ProjectNode<T>[] {
  const visited = new Set<string>()
  const toNodes = (candidates: readonly T[]): ProjectNode<T>[] => {
    const nodes: ProjectNode<T>[] = []
    for (const project of candidates) {
      if (visited.has(project.id)) continue
      visited.add(project.id)
      nodes.push({ project, children: toNodes(childProjectsOf(projects, project.id)) })
    }
    return nodes
  }
  return toNodes(rootProjectsOf(projects))
}

export function outlineProjects<T extends TreeProject>(projects: readonly T[]): ProjectOutlineEntry<T>[] {
  const outline: ProjectOutlineEntry<T>[] = []
  const visit = (nodes: readonly ProjectNode<T>[], depth: number) => {
    for (const node of nodes) {
      outline.push({ project: node.project, depth })
      visit(node.children, depth + 1)
    }
  }
  visit(buildProjectTree(projects), 0)
  return outline
}

export function ancestorsOf<T extends TreeProject>(projects: readonly T[], id: string): T[] {
  const known = byId(projects)
  const ancestors: T[] = []
  const visited = new Set([id])
  let parentId = known.get(id)?.parentId ?? null
  while (parentId !== null && !visited.has(parentId)) {
    const parent = known.get(parentId)
    if (!parent) break
    visited.add(parentId)
    ancestors.unshift(parent)
    parentId = parent.parentId
  }
  return ancestors
}

export function descendantIdsOf(projects: readonly TreeProject[], id: string): string[] {
  const found = new Set<string>()
  const pending = [id]
  while (pending.length > 0) {
    const current = pending.pop() as string
    for (const child of childProjectsOf(projects, current)) {
      if (child.id === id || found.has(child.id)) continue
      found.add(child.id)
      pending.push(child.id)
    }
  }
  return [...found]
}

export function projectDepth(projects: readonly TreeProject[], id: string): number {
  return ancestorsOf(projects, id).length
}

export function subtreeHeight(projects: readonly TreeProject[], id: string, visited = new Set([id])): number {
  let height = 0
  for (const child of childProjectsOf(projects, id)) {
    if (visited.has(child.id)) continue
    visited.add(child.id)
    height = Math.max(height, 1 + subtreeHeight(projects, child.id, visited))
  }
  return height
}

export function canAddSubproject(projects: readonly TreeProject[], id: string): boolean {
  return projectDepth(projects, id) < MAX_PROJECT_DEPTH
}

export function canMoveProject(projects: readonly TreeProject[], id: string, parentId: string | null): boolean {
  if (parentId === null) return true
  if (parentId === id) return false
  if (!projects.some((project) => project.id === parentId)) return false
  if (descendantIdsOf(projects, id).includes(parentId)) return false
  return projectDepth(projects, parentId) + 1 + subtreeHeight(projects, id) <= MAX_PROJECT_DEPTH
}

export function moveTargetsFor<T extends TreeProject>(projects: readonly T[], id: string): ProjectOutlineEntry<T>[] {
  return outlineProjects(projects).filter((entry) => canMoveProject(projects, id, entry.project.id))
}

export function countWithDescendants(
  projects: readonly TreeProject[],
  byProject: Readonly<Record<string, number>>,
  id: string,
): number {
  const ids = [id, ...descendantIdsOf(projects, id)]
  return ids.reduce((total, projectId) => total + (byProject[projectId] ?? 0), 0)
}
