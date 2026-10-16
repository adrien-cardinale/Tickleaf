import { useNavigate } from "@tanstack/react-router"
import { type FormEvent, type KeyboardEvent, useState } from "react"
import { Input } from "@/components/ui/input"
import { useProjectActions } from "@/hooks/use-project-actions"
import { labels } from "@/lib/labels"

type NewProjectFormProps = {
  onCreated: () => void
  onCancel: () => void
}

export function NewProjectForm({ onCreated, onCancel }: NewProjectFormProps) {
  const [name, setName] = useState("")
  const navigate = useNavigate()
  const { create } = useProjectActions()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === "") return
    const project = await create(trimmed)
    if (!project) return
    setName("")
    onCreated()
    void navigate({ to: "/project/$projectId", params: { projectId: project.id } })
  }

  const cancelOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    onCancel()
  }

  return (
    <form onSubmit={submit} className="px-2 pt-1.5">
      <label className="sr-only" htmlFor="new-project-name">
        {labels.nav.projectName}
      </label>
      <Input
        id="new-project-name"
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={cancelOnEscape}
        placeholder={labels.nav.projectNamePlaceholder}
        className="h-8 text-[13px]"
        autoComplete="off"
      />
    </form>
  )
}
