import { moveTargetsFor, type Project } from "@tickleaf/core"
import { Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"

type MoveProjectDialogProps = {
  project: Project
  projects: readonly Project[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TargetButtonProps = {
  name: string
  depth: number
  current: boolean
  onSelect: () => void
}

function TargetButton({ name, depth, current, onSelect }: TargetButtonProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={current ? "true" : undefined}
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-md pr-2 text-left text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          current && "font-medium",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{name}</span>
        {current && <Check className="size-4 shrink-0" aria-hidden="true" />}
      </button>
    </li>
  )
}

export function MoveProjectDialog({ project, projects, open, onOpenChange }: MoveProjectDialogProps) {
  const { move } = useProjectActions()
  const text = labels.views.project
  const targets = moveTargetsFor(projects, project.id)

  const moveTo = async (parent: Project | null) => {
    onOpenChange(false)
    if ((parent?.id ?? null) === project.parentId) return
    await move(project.id, parent)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{text.moveTitle}</DialogTitle>
          <DialogDescription>{text.moveDescription(project.name)}</DialogDescription>
        </DialogHeader>
        <ul className="-mx-2 flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          <TargetButton
            name={text.moveToRoot}
            depth={0}
            current={project.parentId === null}
            onSelect={() => void moveTo(null)}
          />
          {targets.map(({ project: target, depth }) => (
            <TargetButton
              key={target.id}
              name={target.name}
              depth={depth}
              current={target.id === project.parentId}
              onSelect={() => void moveTo(target)}
            />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
