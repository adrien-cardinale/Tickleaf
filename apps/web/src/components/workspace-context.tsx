import { createContext, type ReactNode, useContext, useMemo, useState } from "react"

type Workspace = {
  search: string
  setSearch: (value: string) => void
  selectedTaskId: string | null
  openTask: (id: string) => void
  closeTask: () => void
  shortcutsOpen: boolean
  openShortcuts: () => void
  closeShortcuts: () => void
}

const WorkspaceContext = createContext<Workspace | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
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
    }),
    [search, selectedTaskId, shortcutsOpen],
  )
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext)
  if (!workspace) throw new Error("WorkspaceProvider manquant")
  return workspace
}
