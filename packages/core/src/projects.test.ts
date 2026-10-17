import { describe, expect, test } from "bun:test"
import {
  ancestorsOf,
  buildProjectTree,
  canAddSubproject,
  canMoveProject,
  childProjectsOf,
  countWithDescendants,
  DEFAULT_PROJECT_COLOR,
  descendantIdsOf,
  isProjectColor,
  MAX_PROJECT_DEPTH,
  moveTargetsFor,
  outlineProjects,
  PROJECT_COLORS,
  projectDepth,
  rootProjectsOf,
  subtreeHeight,
} from "./projects"

function node(id: string, parentId: string | null = null) {
  return { id, parentId }
}

const tree = [
  node("home"),
  node("garden", "home"),
  node("kitchen", "home"),
  node("seeds", "garden"),
  node("work"),
  node("orphan", "archived"),
]

const ids = (projects: readonly { id: string }[]) => projects.map((project) => project.id)

describe("projects", () => {
  test("lists children in input order", () => {
    expect(ids(childProjectsOf(tree, "home"))).toEqual(["garden", "kitchen"])
    expect(childProjectsOf(tree, "work")).toEqual([])
  })

  test("treats projects with a missing parent as roots", () => {
    expect(ids(rootProjectsOf(tree))).toEqual(["home", "work", "orphan"])
  })

  test("builds a tree that keeps every project once", () => {
    const roots = buildProjectTree(tree)
    expect(ids(roots.map((root) => root.project))).toEqual(["home", "work", "orphan"])
    const home = roots[0]
    expect(ids(home?.children.map((child) => child.project) ?? [])).toEqual(["garden", "kitchen"])
    expect(ids(home?.children[0]?.children.map((child) => child.project) ?? [])).toEqual(["seeds"])
    const cyclic = buildProjectTree([node("a", "b"), node("b", "a"), node("self", "self")])
    expect(ids(cyclic.map((root) => root.project))).toEqual(["a", "self"])
    expect(ids(cyclic[0]?.children.map((child) => child.project) ?? [])).toEqual(["b"])
  })

  test("lists ancestors from the root down to the parent", () => {
    expect(ids(ancestorsOf(tree, "seeds"))).toEqual(["home", "garden"])
    expect(ancestorsOf(tree, "home")).toEqual([])
    expect(ancestorsOf(tree, "orphan")).toEqual([])
  })

  test("collects every descendant", () => {
    expect(descendantIdsOf(tree, "home").sort()).toEqual(["garden", "kitchen", "seeds"])
    expect(descendantIdsOf(tree, "seeds")).toEqual([])
  })

  test("survives a cycle", () => {
    const cyclic = [node("a", "b"), node("b", "a")]
    expect(ids(ancestorsOf(cyclic, "a"))).toEqual(["b"])
    expect(descendantIdsOf(cyclic, "a")).toEqual(["b"])
    expect(subtreeHeight(cyclic, "a")).toBe(1)
  })

  test("measures depth and subtree height", () => {
    expect(projectDepth(tree, "seeds")).toBe(2)
    expect(subtreeHeight(tree, "home")).toBe(2)
    expect(subtreeHeight(tree, "work")).toBe(0)
  })

  test("refuses to move a project under itself or a descendant", () => {
    expect(canMoveProject(tree, "home", "home")).toBe(false)
    expect(canMoveProject(tree, "home", "seeds")).toBe(false)
    expect(canMoveProject(tree, "home", "unknown")).toBe(false)
    expect(canMoveProject(tree, "home", "work")).toBe(true)
    expect(canMoveProject(tree, "seeds", null)).toBe(true)
  })

  test("refuses a move that exceeds the maximum depth", () => {
    const chain = [node("l0"), node("l1", "l0"), node("l2", "l1"), node("l3", "l2"), node("deep"), node("leaf", "deep")]
    expect(MAX_PROJECT_DEPTH).toBe(3)
    expect(canMoveProject(chain, "deep", "l2")).toBe(false)
    expect(canMoveProject(chain, "leaf", "l2")).toBe(true)
    expect(canAddSubproject(chain, "l2")).toBe(true)
    expect(canAddSubproject(chain, "l3")).toBe(false)
  })

  test("outlines the tree depth first", () => {
    const outline = outlineProjects(tree).map((entry) => `${entry.project.id}:${entry.depth}`)
    expect(outline).toEqual(["home:0", "garden:1", "seeds:2", "kitchen:1", "work:0", "orphan:0"])
  })

  test("offers every eligible target in outline order", () => {
    expect(ids(moveTargetsFor(tree, "home").map((entry) => entry.project))).toEqual(["work", "orphan"])
    expect(ids(moveTargetsFor(tree, "work").map((entry) => entry.project))).toEqual([
      "home",
      "garden",
      "seeds",
      "kitchen",
      "orphan",
    ])
  })

  test("counts the tasks of a project and its descendants", () => {
    const byProject = { home: 1, garden: 2, seeds: 3, work: 5 }
    expect(countWithDescendants(tree, byProject, "home")).toBe(6)
    expect(countWithDescendants(tree, byProject, "garden")).toBe(5)
    expect(countWithDescendants(tree, byProject, "kitchen")).toBe(0)
  })
})

describe("project colors", () => {
  test("includes the default color in the palette", () => {
    expect(PROJECT_COLORS).toContain(DEFAULT_PROJECT_COLOR)
    expect(DEFAULT_PROJECT_COLOR).toBe("gray")
  })

  test("has no duplicate color", () => {
    expect(new Set(PROJECT_COLORS).size).toBe(PROJECT_COLORS.length)
  })

  test("accepts only palette colors", () => {
    expect(PROJECT_COLORS.every(isProjectColor)).toBe(true)
    expect(isProjectColor("#ff0000")).toBe(false)
    expect(isProjectColor("Red")).toBe(false)
    expect(isProjectColor(null)).toBe(false)
    expect(isProjectColor(3)).toBe(false)
  })
})
