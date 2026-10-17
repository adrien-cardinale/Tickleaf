import { Plus } from "lucide-react"
import { type FormEvent, type KeyboardEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSectionActions } from "@/hooks/use-section-actions"
import { labels } from "@/lib/labels"

type NewSectionFormProps = {
  projectId: string
}

export function NewSectionForm({ projectId }: NewSectionFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const { create } = useSectionActions()
  const text = labels.views.section

  const close = () => {
    setName("")
    setOpen(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === "") return
    if (await create(projectId, trimmed)) close()
  }

  const cancelOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    close()
  }

  if (!open) {
    return (
      <Button variant="ghost" className="self-center text-muted-foreground" onClick={() => setOpen(true)}>
        <Plus /> {text.add}
      </Button>
    )
  }

  return (
    <form onSubmit={submit}>
      <label className="sr-only" htmlFor="new-section-name">
        {text.nameLabel}
      </label>
      <Input
        id="new-section-name"
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={cancelOnEscape}
        onBlur={() => name.trim() === "" && close()}
        placeholder={text.namePlaceholder}
        autoComplete="off"
      />
    </form>
  )
}
