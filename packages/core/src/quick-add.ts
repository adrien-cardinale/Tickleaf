import { addDays, isIsoDate, nextDayMonth, nextWeekday, type Weekday } from "./dates"
import type { IsoDate, Priority } from "./types"
import { DEFAULT_PRIORITY } from "./types"

export type QuickAddResult = {
  title: string
  due: IsoDate | null
  priority: Priority
  projectName: string | null
}

type DateRule = {
  pattern: RegExp
  resolve: (match: RegExpMatchArray, today: IsoDate) => IsoDate | null
}

const DATE_RULES: readonly DateRule[] = [
  { pattern: /(?<![\p{L}\d])aujourd['’]hui(?![\p{L}\d])/iu, resolve: (_, today) => today },
  { pattern: /(?<![\p{L}\d])après-demain(?![\p{L}\d])/iu, resolve: (_, today) => addDays(today, 2) },
  { pattern: /(?<![\p{L}\d-])demain(?![\p{L}\d])/iu, resolve: (_, today) => addDays(today, 1) },
  {
    pattern: /(?<![\p{L}\d])dans (\d{1,4}) jours?(?![\p{L}\d])/iu,
    resolve: (match, today) => addDays(today, Number(match[1])),
  },
  {
    pattern: /(?<![\p{L}\d])(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?![\p{L}\d])/iu,
    resolve: (match, today) => nextWeekday(String(match[1]).toLowerCase() as Weekday, today),
  },
  {
    pattern: /(?<![\p{L}\d-])(\d{4}-\d{2}-\d{2})(?![\p{L}\d-])/u,
    resolve: (match) => (isIsoDate(match[1]) ? match[1] : null),
  },
  {
    pattern: /(?<![\p{L}\d./])(\d{1,2})[./](\d{1,2})(?![\p{L}\d./])/u,
    resolve: (match, today) => nextDayMonth(Number(match[1]), Number(match[2]), today),
  },
]

const PRIORITY_PATTERN = /(?:^|\s)[p!]([1-4])(?=\s|$)/i
const PROJECT_PATTERN = /#([\p{L}\d_-]+)/u

function extractDate(text: string, today: IsoDate): { text: string; due: IsoDate | null } {
  for (const rule of DATE_RULES) {
    const match = text.match(rule.pattern)
    if (!match) continue
    const due = rule.resolve(match, today)
    if (due === null) continue
    return { text: text.replace(rule.pattern, " "), due }
  }
  return { text, due: null }
}

function extractPriority(text: string): { text: string; priority: Priority } {
  const match = text.match(PRIORITY_PATTERN)
  if (!match) return { text, priority: DEFAULT_PRIORITY }
  return { text: text.replace(match[0], " "), priority: Number(match[1]) as Priority }
}

function extractProject(text: string): { text: string; projectName: string | null } {
  const match = text.match(PROJECT_PATTERN)
  if (!match) return { text, projectName: null }
  return { text: text.replace(match[0], " "), projectName: match[1] ?? null }
}

export function parseQuickAdd(input: string, today: IsoDate): QuickAddResult {
  const dated = extractDate(input.trim(), today)
  const prioritized = extractPriority(dated.text)
  const assigned = extractProject(prioritized.text)
  return {
    title: assigned.text.replace(/\s+/g, " ").trim(),
    due: dated.due,
    priority: prioritized.priority,
    projectName: assigned.projectName,
  }
}
