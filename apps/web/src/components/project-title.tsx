import { type FormEvent, type KeyboardEvent, useState } from "react"
import { Input } from "@/components/ui/input"
import { labels } from "@/lib/labels"

type ProjectTitleProps = {
  name: string
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onRename: (name: string) => void
}

type ProjectNameEditorProps = {
  name: string
  onDone: () => void
  onRename: (name: string) => void
}

function ProjectNameEditor({ name, onDone, onRename }: ProjectNameEditorProps) {
  const [draft, setDraft] = useState(name)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed !== "" && trimmed !== name) onRename(trimmed)
    onDone()
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    commit()
  }

  const cancelOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    onDone()
  }

  return (
    <form onSubmit={submit}>
      <label className="sr-only" htmlFor="project-name">
        {labels.views.project.renameLabel}
      </label>
      <Input
        id="project-name"
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={cancelOnEscape}
        autoComplete="off"
        className="h-9 text-[22px] font-semibold tracking-tight md:text-[22px]"
      />
    </form>
  )
}

export function ProjectTitle({ name, editing, onEditingChange, onRename }: ProjectTitleProps) {
  if (editing) return <ProjectNameEditor name={name} onDone={() => onEditingChange(false)} onRename={onRename} />
  return (
    <button
      type="button"
      onClick={() => onEditingChange(true)}
      title={labels.views.project.rename}
      className="max-w-full cursor-text truncate rounded-sm text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {name}
    </button>
  )
}
