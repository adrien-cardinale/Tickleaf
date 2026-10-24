import { useNavigate } from "@tanstack/react-router"
import { randomProjectColor } from "@tickleaf/core"
import { type FormEvent, type KeyboardEvent, useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { useProjectActions } from "@/hooks/use-project-actions"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"

type NewProjectFormProps = {
  parentId?: string
  className?: string
  onCreated: () => void
  onCancel: () => void
}

export function NewProjectForm({ parentId, className, onCreated, onCancel }: NewProjectFormProps) {
  const [name, setName] = useState("")
  const inputId = useId()
  const navigate = useNavigate()
  const { create, createSubproject } = useProjectActions()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === "") return
    const color = randomProjectColor()
    const project = parentId ? await createSubproject(trimmed, parentId, color) : await create(trimmed, color)
    if (!project) return
    setName("")
    onCreated()
    void navigate({ to: "/project/$projectId", params: { projectId: project.id } })
  }

  const cancelOnEscape = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    onCancel()
  }

  return (
    <form onSubmit={submit} onKeyDown={cancelOnEscape} className={cn("px-2 pt-1.5", className)}>
      <label className="sr-only" htmlFor={inputId}>
        {labels.nav.projectName}
      </label>
      <Input
        id={inputId}
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={parentId ? labels.nav.subprojectNamePlaceholder : labels.nav.projectNamePlaceholder}
        className="h-8 text-[13px]"
        autoComplete="off"
      />
    </form>
  )
}
