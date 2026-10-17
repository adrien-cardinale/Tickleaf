import { type FormEvent, type KeyboardEvent, useState } from "react"
import { Input } from "@/components/ui/input"

type NameEditorProps = {
  id: string
  label: string
  name: string
  className?: string
  onDone: () => void
  onRename: (name: string) => void
}

export function NameEditor({ id, label, name, className, onDone, onRename }: NameEditorProps) {
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
    <form onSubmit={submit} className="min-w-0 flex-1">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={cancelOnEscape}
        autoComplete="off"
        className={className}
      />
    </form>
  )
}
