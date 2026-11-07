import { describe, expect, test } from "bun:test"
import type { Project, Task } from "@tickleaf/core"
import { tasksToCsv } from "./tasks-csv"

const project: Project = {
  id: "p1",
  name: "Maison",
  color: "gray",
  parentId: null,
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
    dueTime: null,
    dueTimeZone: null,
    reminderAt: null,
    recurrence: null,
    place: null,
    priority: 4,
    projectId: null,
    sectionId: null,
    parentId: null,
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
    expect(header).toBe(
      "﻿Titre;Description;Projet;Tâche parente;Échéance;Heure;Répétition;Lieu;Priorité;Statut;Terminée le;Créée le",
    )
  })

  test("écrit une ligne par tâche, triée par création", () => {
    const later = task({ id: "t2", title: "Après", createdAt: "2026-10-03T08:00:00.000Z" })
    const done = task({
      title: "Payer",
      projectId: "p1",
      due: "2026-10-05",
      dueTime: "14:30",
      reminderAt: null,
      recurrence: { unit: "week", interval: 2 },
      place: { latitude: 46.5197, longitude: 6.6323, radius: 100, label: "Bureau" },
      priority: 1,
      completedAt: "2026-10-04T08:00:00.000Z",
    })
    const lines = tasksToCsv([later, done], [project]).split("\r\n")
    expect(lines[1]).toBe(
      "Payer;;Maison;;2026-10-05;14:30;Toutes les 2 semaines;Bureau;P1;Terminée;2026-10-04T08:00:00.000Z;2026-10-02T08:00:00.000Z",
    )
    expect(lines[2]).toBe("Après;;Boîte de réception;;;;;;P4;Ouverte;;2026-10-03T08:00:00.000Z")
  })

  test("écrit l’heure dans le fuseau de l’appareil", () => {
    const zoned = task({ due: "2026-10-05", dueTime: "14:30", dueTimeZone: "Asia/Kolkata" })
    const instant = new Date("2026-10-05T09:00:00.000Z")
    const local = `${String(instant.getHours()).padStart(2, "0")}:${String(instant.getMinutes()).padStart(2, "0")}`
    const [, line] = tasksToCsv([zoned], []).split("\r\n")
    expect(line?.split(";")[5]).toBe(local)
  })

  test("indique le titre de la tâche parente d'une sous-tâche", () => {
    const parent = task({ id: "parent", title: "Déménager" })
    const subtask = task({ id: "sub", title: "Cartons", parentId: "parent", createdAt: "2026-10-03T08:00:00.000Z" })
    const lines = tasksToCsv([parent, subtask], []).split("\r\n")
    expect(lines[2]).toBe("Cartons;;Boîte de réception;Déménager;;;;;P4;Ouverte;;2026-10-03T08:00:00.000Z")
  })

  test("écrit les coordonnées d'un lieu sans nom", () => {
    const placed = task({ place: { latitude: 46.5197, longitude: 6.6323, radius: 100, label: "" } })
    const [, line] = tasksToCsv([placed], []).split("\r\n")
    expect(line).toBe("Tâche;;Boîte de réception;;;;;46.5197,6.6323;P4;Ouverte;;2026-10-02T08:00:00.000Z")
  })

  test("met entre guillemets les cellules avec séparateur, guillemet ou saut de ligne", () => {
    const csv = tasksToCsv([task({ title: 'Dire "oui"; vite', description: "a\nb" })], [])
    expect(csv).toContain('"Dire ""oui""; vite";"a\nb";')
  })
})
