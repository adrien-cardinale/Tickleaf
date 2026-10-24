import type { Project } from "@tickleaf/core"
import { type FormEvent, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useProjectActions } from "@/hooks/use-project-actions"
import { labels } from "@/lib/labels"

type RenameProjectDialogProps = {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RenameFormProps = {
  project: Project
  onDone: () => void
}

function RenameForm({ project, onDone }: RenameFormProps) {
  const [draft, setDraft] = useState(project.name)
  const inputId = useId()
  const { rename } = useProjectActions()
  const text = labels.views.project

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (trimmed !== "" && trimmed !== project.name) void rename(project.id, trimmed)
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="sr-only" htmlFor={inputId}>
        {text.renameLabel}
      </label>
      <Input
        id={inputId}
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        autoComplete="off"
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {text.cancel}
        </Button>
        <Button type="submit">{text.save}</Button>
      </DialogFooter>
    </form>
  )
}

export function RenameProjectDialog({ project, open, onOpenChange }: RenameProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.views.project.renameTitle}</DialogTitle>
        </DialogHeader>
        <RenameForm project={project} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
