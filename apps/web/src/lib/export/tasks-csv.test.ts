import { describe, expect, test } from "bun:test"
import type { Project, Task } from "@tickleaf/core"
import { tasksToCsv } from "./tasks-csv"

const project: Project = {
  id: "p1",
  name: "Maison",
  position: 0,
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-01T08:00:00.000Z",
}

function task(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    title: "Tâche",
    description: "",
    due: null,
    reminderAt: null,
    priority: 4,
    projectId: null,
    sectionId: null,
    position: 0,
    completedAt: null,
    createdAt: "2026-10-02T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z",
    ...overrides,
  }
}

describe("export CSV des tâches", () => {
  test("commence par le BOM et l'en-tête", () => {
    const [header] = tasksToCsv([], []).split("\r\n")
    expect(header).toBe("﻿Titre;Description;Projet;Échéance;Priorité;Statut;Terminée le;Créée le")
  })

  test("écrit une ligne par tâche, triée par création", () => {
    const later = task({ id: "t2", title: "Après", createdAt: "2026-10-03T08:00:00.000Z" })
    const done = task({
      title: "Payer",
      projectId: "p1",
      due: "2026-10-05",
      reminderAt: null,
      priority: 1,
      completedAt: "2026-10-04T08:00:00.000Z",
    })
    const lines = tasksToCsv([later, done], [project]).split("\r\n")
    expect(lines[1]).toBe("Payer;;Maison;2026-10-05;P1;Terminée;2026-10-04T08:00:00.000Z;2026-10-02T08:00:00.000Z")
    expect(lines[2]).toBe("Après;;Boîte de réception;;P4;Ouverte;;2026-10-03T08:00:00.000Z")
  })

  test("met entre guillemets les cellules avec séparateur, guillemet ou saut de ligne", () => {
    const csv = tasksToCsv([task({ title: 'Dire "oui"; vite', description: "a\nb" })], [])
    expect(csv).toContain('"Dire ""oui""; vite";"a\nb";')
  })
})
