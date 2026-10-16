import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/components/workspace-context"
import { labels } from "@/lib/labels"

export function SearchField() {
  const { search, setSearch } = useWorkspace()
  return (
    <div className="ml-auto hidden w-full max-w-[360px] md:block">
      <label className="sr-only" htmlFor="search">
        {labels.search.label}
      </label>
      <Input
        id="search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={labels.search.placeholder}
        autoComplete="off"
      />
    </div>
  )
}
