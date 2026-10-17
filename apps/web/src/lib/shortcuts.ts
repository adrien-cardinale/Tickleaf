import { labels } from "@/lib/labels"

export const MOD_KEY = "mod"
export const QUICK_ADD_INPUT_ID = "quick-add"
export const SEARCH_INPUT_ID = "search"
export const TASK_ROW_ATTRIBUTE = "data-task-row"
export const CHORD_PREFIX = "g"
export const CHORD_TIMEOUT_MS = 1000

export type ShortcutGroup = keyof typeof labels.shortcuts.groups
export type KeyStroke = readonly string[]
export type KeyBinding = readonly KeyStroke[]

export type Shortcut = {
  id: string
  group: ShortcutGroup
  description: string
  bindings: readonly KeyBinding[]
}

export type GoToPath = "/inbox" | "/today" | "/upcoming" | "/matrix" | "/completed" | "/settings"

type GoToShortcut = {
  key: string
  to: GoToPath
  description: string
}

const text = labels.shortcuts

export const goToShortcuts: readonly GoToShortcut[] = [
  { key: "i", to: "/inbox", description: text.goInbox },
  { key: "t", to: "/today", description: text.goToday },
  { key: "u", to: "/upcoming", description: text.goUpcoming },
  { key: "m", to: "/matrix", description: text.goMatrix },
  { key: "c", to: "/completed", description: text.goCompleted },
  { key: "s", to: "/settings", description: text.goSettings },
]

export const TOGGLE_TASK_KEYS: readonly string[] = ["x", "e"]

const navigationShortcuts: readonly Shortcut[] = goToShortcuts.map(({ key, to, description }) => ({
  id: `go-${to.slice(1)}`,
  group: "navigation",
  description,
  bindings: [[[CHORD_PREFIX], [key]]],
}))

const otherShortcuts: readonly Shortcut[] = [
  { id: "focus-quick-add", group: "tasks", description: text.focusQuickAdd, bindings: [[["/"]]] },
  { id: "next-task", group: "tasks", description: text.nextTask, bindings: [[["j"]], [[text.keys.down]]] },
  { id: "previous-task", group: "tasks", description: text.previousTask, bindings: [[["k"]], [[text.keys.up]]] },
  { id: "open-task", group: "tasks", description: text.openTask, bindings: [[[text.keys.enter]]] },
  {
    id: "toggle-task",
    group: "tasks",
    description: text.toggleTask,
    bindings: TOGGLE_TASK_KEYS.map((key) => [[key]]),
  },
  { id: "focus-search", group: "general", description: text.focusSearch, bindings: [[[MOD_KEY, "K"]]] },
  { id: "leave-field", group: "general", description: text.leaveField, bindings: [[[text.keys.escape]]] },
  { id: "toggle-sidebar", group: "general", description: text.toggleSidebar, bindings: [[[MOD_KEY, "B"]]] },
  { id: "show-shortcuts", group: "general", description: text.showShortcuts, bindings: [[["?"]]] },
]

export const shortcuts: readonly Shortcut[] = [...navigationShortcuts, ...otherShortcuts]

export const shortcutGroups: readonly ShortcutGroup[] = ["navigation", "tasks", "general"]

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])
const OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]'

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable
}

export function isInsideOverlay(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(OVERLAY_SELECTOR) !== null
}

export function isTaskRow(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement && target.hasAttribute(TASK_ROW_ATTRIBUTE)
}

type ModifierState = Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey">

export function hasAnyModifier(event: ModifierState): boolean {
  return event.ctrlKey || event.metaKey || event.altKey
}

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false
  return /mac|iphone|ipad|ipod/i.test(`${navigator.platform} ${navigator.userAgent}`)
}

export function isModifierKey(event: KeyboardEvent): boolean {
  if (event.altKey) return false
  return isApplePlatform() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
}

export function modifierLabel(): string {
  return isApplePlatform() ? "⌘" : "Ctrl"
}

export function keyLabel(key: string): string {
  return key === MOD_KEY ? modifierLabel() : key
}
