import type { Project } from "@tickleaf/core"
import { NewProjectForm } from "@/components/new-project-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { labels } from "@/lib/labels"

type SubprojectDialogProps = {
  parent: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubprojectDialog({ parent, open, onOpenChange }: SubprojectDialogProps) {
  const text = labels.views.project
  const close = () => onOpenChange(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{text.newSubproject}</DialogTitle>
          <DialogDescription>{text.newSubprojectDescription(parent.name)}</DialogDescription>
        </DialogHeader>
        <NewProjectForm parentId={parent.id} className="p-0" onCreated={close} onCancel={close} />
      </DialogContent>
    </Dialog>
  )
}
