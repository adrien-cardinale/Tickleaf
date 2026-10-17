import { NameEditor } from "@/components/name-editor"
import { labels } from "@/lib/labels"

type ProjectTitleProps = {
  name: string
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onRename: (name: string) => void
}

export function ProjectTitle({ name, editing, onEditingChange, onRename }: ProjectTitleProps) {
  if (editing) {
    return (
      <NameEditor
        id="project-name"
        label={labels.views.project.renameLabel}
        name={name}
        onDone={() => onEditingChange(false)}
        onRename={onRename}
        className="h-9 text-[22px] font-semibold tracking-tight md:text-[22px]"
      />
    )
  }
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
