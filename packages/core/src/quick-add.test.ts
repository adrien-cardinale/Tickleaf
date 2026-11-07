import { describe, expect, test } from "bun:test"
import { parseQuickAdd } from "./quick-add"

const FRIDAY = "2026-10-16"

describe("parseQuickAdd", () => {
  test("keeps a plain title", () => {
    expect(parseQuickAdd("  Lire   la doc  ", FRIDAY)).toEqual({
      title: "Lire la doc",
      due: null,
      dueTime: null,
      priority: 4,
      projectName: null,
      recurrence: null,
      focusDate: null,
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
      dueTime: null,
      priority: 1,
      projectName: "Travail",
      recurrence: null,
      focusDate: null,
    })
  })

  test("reads a daily, weekly, monthly or yearly recurrence starting today", () => {
    expect(parseQuickAdd("Méditer tous les jours", FRIDAY)).toMatchObject({
      title: "Méditer",
      due: FRIDAY,
      recurrence: { unit: "day", interval: 1 },
    })
    expect(parseQuickAdd("Arroser chaque semaine", FRIDAY).recurrence).toEqual({ unit: "week", interval: 1 })
    expect(parseQuickAdd("Loyer tous les mois", FRIDAY).recurrence).toEqual({ unit: "month", interval: 1 })
    expect(parseQuickAdd("Bilan chaque année", FRIDAY).recurrence).toEqual({ unit: "year", interval: 1 })
    expect(parseQuickAdd("Bilan tous les ans", FRIDAY).recurrence).toEqual({ unit: "year", interval: 1 })
  })

  test("reads a recurrence with an interval", () => {
    expect(parseQuickAdd("Sport tous les 2 jours", FRIDAY)).toMatchObject({
      title: "Sport",
      recurrence: { unit: "day", interval: 2 },
    })
    expect(parseQuickAdd("Courses toutes les 3 semaines", FRIDAY).recurrence).toEqual({ unit: "week", interval: 3 })
  })

  test("reads working days", () => {
    expect(parseQuickAdd("Mails tous les jours ouvrés", FRIDAY)).toMatchObject({
      title: "Mails",
      recurrence: { unit: "weekday", interval: 1 },
    })
    expect(parseQuickAdd("Mails chaque jour ouvrable", FRIDAY).recurrence).toEqual({ unit: "weekday", interval: 1 })
  })

  test("reads a weekday recurrence starting on that weekday", () => {
    expect(parseQuickAdd("Cours chaque lundi", FRIDAY)).toMatchObject({
      title: "Cours",
      due: "2026-10-19",
      recurrence: { unit: "week", interval: 1 },
    })
    expect(parseQuickAdd("Marché tous les vendredis", FRIDAY).due).toBe(FRIDAY)
  })

  test("lets an explicit date set the first occurrence", () => {
    expect(parseQuickAdd("Loyer tous les mois 01.11 #Maison", FRIDAY)).toMatchObject({
      title: "Loyer",
      due: "2026-11-01",
      projectName: "Maison",
      recurrence: { unit: "month", interval: 1 },
    })
  })

  test("uses only the first date token", () => {
    expect(parseQuickAdd("demain ou lundi", FRIDAY)).toMatchObject({ title: "ou lundi", due: "2026-10-17" })
  })

  test("reads a time in every format", () => {
    expect(parseQuickAdd("Dentiste demain 14h", FRIDAY)).toMatchObject({
      title: "Dentiste",
      due: "2026-10-17",
      dueTime: "14:00",
    })
    expect(parseQuickAdd("Appel 14h30", FRIDAY).dueTime).toBe("14:30")
    expect(parseQuickAdd("Appel 14:30", FRIDAY).dueTime).toBe("14:30")
    expect(parseQuickAdd("Café 9h", FRIDAY).dueTime).toBe("09:00")
    expect(parseQuickAdd("Café 09:05", FRIDAY).dueTime).toBe("09:05")
    expect(parseQuickAdd("Café 9H15", FRIDAY).dueTime).toBe("09:15")
  })

  test("removes an optional à before the time", () => {
    expect(parseQuickAdd("Réunion à 14h lundi", FRIDAY)).toMatchObject({
      title: "Réunion",
      due: "2026-10-19",
      dueTime: "14:00",
    })
    expect(parseQuickAdd("Réunion a 10h30", FRIDAY)).toMatchObject({ title: "Réunion", dueTime: "10:30" })
    expect(parseQuickAdd("Voilà 8h", FRIDAY)).toMatchObject({ title: "Voilà", dueTime: "08:00" })
  })

  test("dates a time without a date today", () => {
    expect(parseQuickAdd("Appeler à 18h", FRIDAY)).toMatchObject({ title: "Appeler", due: FRIDAY, dueTime: "18:00" })
  })

  test("keeps the recurrence start for a timed recurrence", () => {
    expect(parseQuickAdd("Cours chaque lundi à 8h", FRIDAY)).toMatchObject({
      title: "Cours",
      due: "2026-10-19",
      dueTime: "08:00",
      recurrence: { unit: "week", interval: 1 },
    })
  })

  test("keeps an out of range time in the title", () => {
    expect(parseQuickAdd("Film 25h", FRIDAY)).toMatchObject({ title: "Film 25h", due: null, dueTime: null })
    expect(parseQuickAdd("Film 14h75", FRIDAY)).toMatchObject({ title: "Film 14h75", dueTime: null })
    expect(parseQuickAdd("Film 24:00", FRIDAY).dueTime).toBeNull()
  })

  test("reads a time only as a whole word", () => {
    expect(parseQuickAdd("Dormir 14heures", FRIDAY)).toMatchObject({ title: "Dormir 14heures", dueTime: null })
    expect(parseQuickAdd("Lire 14 pages", FRIDAY)).toMatchObject({ title: "Lire 14 pages", dueTime: null })
    expect(parseQuickAdd("Code a14h", FRIDAY).dueTime).toBeNull()
    expect(parseQuickAdd("Score 114h", FRIDAY).dueTime).toBeNull()
  })

  test("uses only the first valid time", () => {
    expect(parseQuickAdd("Train 9h ou 10h", FRIDAY)).toMatchObject({ title: "Train ou 10h", dueTime: "09:00" })
    expect(parseQuickAdd("Train 25h ou 10h", FRIDAY)).toMatchObject({ title: "Train 25h ou", dueTime: "10:00" })
  })

  test("puts the task in focus today with @focus or !focus", () => {
    expect(parseQuickAdd("Rédiger le rapport @focus", FRIDAY)).toMatchObject({
      title: "Rédiger le rapport",
      focusDate: FRIDAY,
    })
    expect(parseQuickAdd("!focus Rédiger le rapport p1", FRIDAY)).toMatchObject({
      title: "Rédiger le rapport",
      priority: 1,
      focusDate: FRIDAY,
    })
  })

  test("keeps focus inside a word", () => {
    expect(parseQuickAdd("Lire refocus", FRIDAY)).toMatchObject({ title: "Lire refocus", focusDate: null })
  })

  test("returns an empty title when only tokens remain", () => {
    expect(parseQuickAdd("demain p1", FRIDAY).title).toBe("")
  })
})
