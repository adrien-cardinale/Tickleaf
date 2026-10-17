import type { Project, Section } from "@tickleaf/core"
import { Plus } from "lucide-react"
import { type FormEvent, type KeyboardEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTaskActions } from "@/hooks/use-task-actions"
import { useToday } from "@/hooks/use-today"
import { labels } from "@/lib/labels"

type SectionTaskAddProps = {
  project: Project
  section: Section
}

export function SectionTaskAdd({ project, section }: SectionTaskAddProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const today = useToday()
  const { add } = useTaskActions()
  const text = labels.views.section
  const inputId = `section-task-${section.id}`

  const close = () => {
    setValue("")
    setOpen(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (value.trim() === "") return
    if (await add(value, { due: null, project, sectionId: section.id }, today)) setValue("")
  }

  const cancelOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    close()
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="self-start text-muted-foreground" onClick={() => setOpen(true)}>
        <Plus /> {text.addTask}
      </Button>
    )
  }

  return (
    <form onSubmit={submit} className="flex gap-2 pt-2">
      <label className="sr-only" htmlFor={inputId}>
        {text.addTask}
      </label>
      <Input
        id={inputId}
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={cancelOnEscape}
        onBlur={() => value.trim() === "" && close()}
        placeholder={text.addTaskPlaceholder(section.name)}
        autoComplete="off"
        enterKeyHint="done"
        className="min-w-0 flex-1"
      />
      <Button type="submit">{labels.quickAdd.submit}</Button>
    </form>
  )
}
