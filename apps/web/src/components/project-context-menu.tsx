import { canAddSubproject, PROJECT_COLORS, type Project } from "@tickleaf/core"
import { Archive, FolderInput, FolderPlus, Palette, Pencil } from "lucide-react"
import { type ReactNode, useState } from "react"
import { ArchiveProjectDialog } from "@/components/archive-project-dialog"
import { MoveProjectDialog } from "@/components/move-project-dialog"
import { ProjectDot } from "@/components/project-dot"
import { RenameProjectDialog } from "@/components/rename-project-dialog"
import { SubprojectDialog } from "@/components/subproject-dialog"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import { useProjectActions } from "@/hooks/use-project-actions"
import { labels } from "@/lib/labels"

type ProjectDialog = "rename" | "subproject" | "move" | "archive" | null

type ProjectContextMenuProps = {
  project: Project
  projects: readonly Project[]
  onArchived: () => void
  children: ReactNode
}

export function ProjectContextMenu({ project, projects, onArchived, children }: ProjectContextMenuProps) {
  const [dialog, setDialog] = useState<ProjectDialog>(null)
  const { setColor, archive } = useProjectActions()
  const text = labels.views.project
  const closeDialog = (open: boolean) => {
    if (!open) setDialog(null)
  }

  const archiveProject = async () => {
    if (await archive(project.id)) onArchived()
  }

  return (
    <>
      <ContextMenu>
        {children}
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => setDialog("rename")}>
            <Pencil /> {text.rename}
          </ContextMenuItem>
          {canAddSubproject(projects, project.id) && (
            <ContextMenuItem onSelect={() => setDialog("subproject")}>
              <FolderPlus /> {text.addSubproject}
            </ContextMenuItem>
          )}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Palette /> {text.color}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {PROJECT_COLORS.map((option) => (
                <ContextMenuCheckboxItem
                  key={option}
                  checked={option === project.color}
                  onSelect={() => void setColor(project.id, option)}
                >
                  <ProjectDot color={option} />
                  {labels.colors[option]}
                </ContextMenuCheckboxItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem onSelect={() => setDialog("move")}>
            <FolderInput /> {text.move}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={() => setDialog("archive")}>
            <Archive /> {text.archive}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <RenameProjectDialog project={project} open={dialog === "rename"} onOpenChange={closeDialog} />
      <SubprojectDialog parent={project} open={dialog === "subproject"} onOpenChange={closeDialog} />
      <MoveProjectDialog project={project} projects={projects} open={dialog === "move"} onOpenChange={closeDialog} />
      <ArchiveProjectDialog
        open={dialog === "archive"}
        onOpenChange={closeDialog}
        onArchive={() => void archiveProject()}
      />
    </>
  )
}
