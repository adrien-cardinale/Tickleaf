import { useRouterState } from "@tanstack/react-router"
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react"

type Workspace = {
  search: string
  setSearch: (value: string) => void
  selectedTaskId: string | null
  openTask: (id: string) => void
  closeTask: () => void
  shortcutsOpen: boolean
  openShortcuts: () => void
  closeShortcuts: () => void
  selectedIds: ReadonlySet<string>
  toggleSelected: (id: string) => void
  retainSelected: (presentIds: ReadonlySet<string>) => void
  clearSelection: () => void
}

type Selection = { pathname: string; ids: ReadonlySet<string> }

const NO_SELECTION: ReadonlySet<string> = new Set()

const WorkspaceContext = createContext<Workspace | null>(null)

function toggled(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(ids)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

function retained(ids: ReadonlySet<string>, presentIds: ReadonlySet<string>): ReadonlySet<string> {
  const kept = [...ids].filter((id) => presentIds.has(id))
  return kept.length === ids.size ? ids : new Set(kept)
}

function useTaskSelection() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [selection, setSelection] = useState<Selection>({ pathname, ids: NO_SELECTION })
  const selectedIds = selection.pathname === pathname ? selection.ids : NO_SELECTION

  const changeSelection = useCallback(
    (change: (ids: ReadonlySet<string>) => ReadonlySet<string>) =>
      setSelection((current) => {
        const ids = current.pathname === pathname ? current.ids : NO_SELECTION
        const next = change(ids)
        return next === current.ids && current.pathname === pathname ? current : { pathname, ids: next }
      }),
    [pathname],
  )

  const toggleSelected = useCallback((id: string) => changeSelection((ids) => toggled(ids, id)), [changeSelection])
  const retainSelected = useCallback(
    (presentIds: ReadonlySet<string>) => changeSelection((ids) => retained(ids, presentIds)),
    [changeSelection],
  )
  const clearSelection = useCallback(() => changeSelection(() => NO_SELECTION), [changeSelection])

  return { selectedIds, toggleSelected, retainSelected, clearSelection }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { selectedIds, toggleSelected, retainSelected, clearSelection } = useTaskSelection()
  const value = useMemo<Workspace>(
    () => ({
      search,
      setSearch,
      selectedTaskId,
      openTask: setSelectedTaskId,
      closeTask: () => setSelectedTaskId(null),
      shortcutsOpen,
      openShortcuts: () => setShortcutsOpen(true),
      closeShortcuts: () => setShortcutsOpen(false),
      selectedIds,
      toggleSelected,
      retainSelected,
      clearSelection,
    }),
    [search, selectedTaskId, shortcutsOpen, selectedIds, toggleSelected, retainSelected, clearSelection],
  )
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext)
  if (!workspace) throw new Error("WorkspaceProvider manquant")
  return workspace
}
