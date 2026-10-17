import type { TaskCounts } from "@tickleaf/core"
import { CalendarCheck, CalendarDays, CircleCheck, Inbox, LayoutGrid, type LucideIcon, Settings } from "lucide-react"
import { labels } from "@/lib/labels"

export type ViewPath = "/inbox" | "/today" | "/upcoming" | "/matrix" | "/completed"

export type NavigationItem = {
  title: string
  to: ViewPath
  icon: LucideIcon
  count: (counts: TaskCounts) => number
}

export const navigationItems: readonly NavigationItem[] = [
  { title: labels.nav.inbox, to: "/inbox", icon: Inbox, count: (counts) => counts.inbox },
  { title: labels.nav.today, to: "/today", icon: CalendarCheck, count: (counts) => counts.today },
  { title: labels.nav.upcoming, to: "/upcoming", icon: CalendarDays, count: (counts) => counts.upcoming },
  { title: labels.nav.matrix, to: "/matrix", icon: LayoutGrid, count: (counts) => counts.matrix },
  { title: labels.nav.completed, to: "/completed", icon: CircleCheck, count: (counts) => counts.completed },
]

export type SettingsItem = {
  title: string
  to: "/settings"
  icon: LucideIcon
}

export const settingsItem: SettingsItem = { title: labels.nav.settings, to: "/settings", icon: Settings }
