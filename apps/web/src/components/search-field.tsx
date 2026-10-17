import type { KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/components/workspace-context"
import { labels } from "@/lib/labels"
import { SEARCH_INPUT_ID } from "@/lib/shortcuts"

export function SearchField() {
  const { search, setSearch } = useWorkspace()

  const leaveOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    setSearch("")
    event.currentTarget.blur()
  }

  return (
    <div className="ml-auto hidden w-full max-w-[360px] md:block">
      <label className="sr-only" htmlFor={SEARCH_INPUT_ID}>
        {labels.search.label}
      </label>
      <Input
        id={SEARCH_INPUT_ID}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={leaveOnEscape}
        placeholder={labels.search.placeholder}
        autoComplete="off"
      />
    </div>
  )
}
