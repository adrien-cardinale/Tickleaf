import { describe, expect, test } from "bun:test"
import { parseQuickAdd } from "./quick-add"

const FRIDAY = "2026-10-16"

describe("parseQuickAdd", () => {
  test("keeps a plain title", () => {
    expect(parseQuickAdd("  Lire   la doc  ", FRIDAY)).toEqual({
      title: "Lire la doc",
      due: null,
      priority: 4,
      projectName: null,
    })
  })

  test("reads aujourd'hui with both apostrophes", () => {
    expect(parseQuickAdd("Appeler aujourd'hui", FRIDAY).due).toBe(FRIDAY)
    expect(parseQuickAdd("Appeler aujourd’hui", FRIDAY)).toMatchObject({ title: "Appeler", due: FRIDAY })
  })

  test("reads demain and après-demain", () => {
    expect(parseQuickAdd("Payer demain", FRIDAY)).toMatchObject({ title: "Payer", due: "2026-10-17" })
    expect(parseQuickAdd("Payer après-demain", FRIDAY)).toMatchObject({ title: "Payer", due: "2026-10-18" })
  })

  test("reads dans N jours", () => {
    expect(parseQuickAdd("Relancer dans 3 jours", FRIDAY)).toMatchObject({ title: "Relancer", due: "2026-10-19" })
    expect(parseQuickAdd("Relancer dans 1 jour", FRIDAY).due).toBe("2026-10-17")
  })

  test("reads the next weekday, never today", () => {
    expect(parseQuickAdd("Cours lundi", FRIDAY).due).toBe("2026-10-19")
    expect(parseQuickAdd("Marché vendredi", FRIDAY).due).toBe("2026-10-23")
    expect(parseQuickAdd("Marché Samedi", FRIDAY).due).toBe("2026-10-17")
  })

  test("reads ISO dates", () => {
    expect(parseQuickAdd("Rendu 2026-12-01", FRIDAY)).toMatchObject({ title: "Rendu", due: "2026-12-01" })
  })

  test("ignores invalid ISO dates", () => {
    expect(parseQuickAdd("Rendu 2026-13-01", FRIDAY)).toMatchObject({ title: "Rendu 2026-13-01", due: null })
  })

  test("reads day and month in the current or next year", () => {
    expect(parseQuickAdd("Fête 24.12", FRIDAY)).toMatchObject({ title: "Fête", due: "2026-12-24" })
    expect(parseQuickAdd("Impôts 15/03", FRIDAY).due).toBe("2027-03-15")
    expect(parseQuickAdd("Rappel 16.10", FRIDAY).due).toBe(FRIDAY)
  })

  test("reads priorities with p or !", () => {
    expect(parseQuickAdd("Urgent p1", FRIDAY)).toMatchObject({ title: "Urgent", priority: 1 })
    expect(parseQuickAdd("!2 Important", FRIDAY)).toMatchObject({ title: "Important", priority: 2 })
    expect(parseQuickAdd("Version P3", FRIDAY).priority).toBe(3)
    expect(parseQuickAdd("Code p5", FRIDAY)).toMatchObject({ title: "Code p5", priority: 4 })
    expect(parseQuickAdd("Groupe p12", FRIDAY).priority).toBe(4)
  })

  test("reads the project name", () => {
    expect(parseQuickAdd("Ampoules #Maison", FRIDAY)).toMatchObject({ title: "Ampoules", projectName: "Maison" })
    expect(parseQuickAdd("Doc #Projet-été", FRIDAY).projectName).toBe("Projet-été")
  })

  test("combines every token", () => {
    expect(parseQuickAdd("Préparer le cours demain p1 #Travail", FRIDAY)).toEqual({
      title: "Préparer le cours",
      due: "2026-10-17",
      priority: 1,
      projectName: "Travail",
    })
  })

  test("uses only the first date token", () => {
    expect(parseQuickAdd("demain ou lundi", FRIDAY)).toMatchObject({ title: "ou lundi", due: "2026-10-17" })
  })

  test("returns an empty title when only tokens remain", () => {
    expect(parseQuickAdd("demain p1", FRIDAY).title).toBe("")
  })
})
