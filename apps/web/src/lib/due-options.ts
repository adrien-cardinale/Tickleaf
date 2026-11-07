import { addDays, type IsoDate } from "@tickleaf/core"
import { labels } from "@/lib/labels"

export type DueOption = { label: string; due: IsoDate | null }

export function dueOptions(today: IsoDate): readonly DueOption[] {
  return [
    { label: labels.due.today, due: today },
    { label: labels.due.tomorrow, due: addDays(today, 1) },
    { label: labels.task.menu.noDue, due: null },
  ]
}
