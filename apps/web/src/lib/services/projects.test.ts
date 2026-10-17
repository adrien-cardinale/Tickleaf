import { beforeEach, describe, expect, test } from "bun:test"
import type { Db } from "@tickleaf/db"
import { createMemoryDb } from "../test-support/memory-db"
import {
  archiveProject,
  createProject,
  findOrCreateProject,
  listProjects,
  moveProject,
  removeProject,
  restoreProjects,
  setProjectColor,
} from "./projects"
import { createTask, listAllTasks, restoreTasks } from "./tasks"

let db: Db

beforeEach(async () => {
  db = await createMemoryDb()
})

async function family() {
  const home = await createProject(db, "Maison")
  const garden = await createProject(db, "Jardin", home.id)
  const seeds = await createProject(db, "Graines", garden.id)
  return { home, garden, seeds }
}

async function activeIds(): Promise<string[]> {
  return (await listProjects(db)).map((project) => project.id)
}

describe("sous-projets", () => {
  test("crée un sous-projet sous son parent", async () => {
    const { home, garden } = await family()
    expect(garden.parentId).toBe(home.id)
    expect((await listProjects(db)).find((project) => project.id === garden.id)?.parentId).toBe(home.id)
  })

  test("refuse de déplacer un projet sous lui-même ou un descendant", async () => {
    const { home, seeds } = await family()
    expect(await moveProject(db, home.id, home.id)).toBeNull()
    expect(await moveProject(db, home.id, seeds.id)).toBeNull()
  })

  test("déplace un projet à la racine puis sous un autre", async () => {
    const { home, garden } = await family()
    const work = await createProject(db, "Travail")
    expect(await moveProject(db, garden.id, null)).toMatchObject({ previousParentId: home.id })
    expect(await moveProject(db, garden.id, work.id)).toMatchObject({ previousParentId: null })
    expect((await listProjects(db)).find((project) => project.id === garden.id)?.parentId).toBe(work.id)
  })

  test("archive les descendants et rend leurs tâches ouvertes à la boîte de réception", async () => {
    const { home, garden, seeds } = await family()
    const task = await createTask(db, { title: "Semer", due: null, projectId: seeds.id })
    const archived = await archiveProject(db, home.id)
    expect(archived?.projects.map((project) => project.id).sort()).toEqual([home.id, garden.id, seeds.id].sort())
    expect(archived?.movedTasks.map((moved) => moved.id)).toEqual([task.id])
    expect(await activeIds()).toEqual([])
    const [inbox] = await listAllTasks(db)
    expect(inbox?.projectId).toBeNull()
  })

  test("l'annulation restaure toute la hiérarchie", async () => {
    const { home, seeds } = await family()
    await createTask(db, { title: "Semer", due: null, projectId: seeds.id })
    const archived = await archiveProject(db, home.id)
    if (!archived) throw new Error("archive failed")
    await restoreProjects(db, archived.projects)
    await restoreTasks(db, archived.movedTasks)
    expect((await activeIds()).length).toBe(3)
    const [restored] = await listAllTasks(db)
    expect(restored?.projectId).toBe(seeds.id)
  })

  test("supprime les descendants avec le projet", async () => {
    const { home, garden } = await family()
    const removed = await removeProject(db, garden.id)
    expect(removed?.projects.length).toBe(2)
    expect(await activeIds()).toEqual([home.id])
  })
})

describe("couleurs des projets", () => {
  test("crée un projet gris par défaut", async () => {
    const home = await createProject(db, "Maison")
    expect(home.color).toBe("gray")
    expect((await listProjects(db))[0]?.color).toBe("gray")
  })

  test("crée un projet avec la couleur choisie", async () => {
    const home = await createProject(db, "Maison")
    const garden = await createProject(db, "Jardin", home.id, "green")
    expect(garden.color).toBe("green")
    expect((await listProjects(db)).find((project) => project.id === garden.id)?.color).toBe("green")
  })

  test("change la couleur d'un projet", async () => {
    const home = await createProject(db, "Maison")
    await setProjectColor(db, home.id, "blue")
    expect((await listProjects(db))[0]?.color).toBe("blue")
  })

  test("crée en gris un projet issu de l'ajout rapide", async () => {
    const { project } = await findOrCreateProject(db, "Courses")
    expect(project.color).toBe("gray")
  })
})
