import { PROJECT_COLORS, type ProjectColor } from "@tickleaf/core"
import { Archive, Ellipsis, FolderInput, FolderPlus, Palette, Pencil } from "lucide-react"
import { useRef, useState } from "react"
import { ProjectDot } from "@/components/project-dot"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { labels } from "@/lib/labels"

type ColorSubmenuProps = {
  color: ProjectColor
  onColorChange: (color: ProjectColor) => void
}

function ColorSubmenu({ color, onColorChange }: ColorSubmenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Palette /> {labels.views.project.color}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {PROJECT_COLORS.map((option) => (
          <DropdownMenuCheckboxItem key={option} checked={option === color} onSelect={() => onColorChange(option)}>
            <ProjectDot color={option} />
            {labels.colors[option]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

type ProjectMenuProps = ColorSubmenuProps & {
  canAddSubproject: boolean
  onRename: () => void
  onAddSubproject: () => void
  onMove: () => void
  onArchive: () => void
}

export function ProjectMenu({
  color,
  onColorChange,
  canAddSubproject,
  onRename,
  onAddSubproject,
  onMove,
  onArchive,
}: ProjectMenuProps) {
  const [confirming, setConfirming] = useState(false)
  const renaming = useRef(false)
  const text = labels.views.project

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={text.actions} title={text.actions}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(event) => {
            if (!renaming.current) return
            renaming.current = false
            event.preventDefault()
            onRename()
          }}
        >
          <DropdownMenuItem
            onSelect={() => {
              renaming.current = true
            }}
          >
            <Pencil /> {text.rename}
          </DropdownMenuItem>
          {canAddSubproject && (
            <DropdownMenuItem onSelect={onAddSubproject}>
              <FolderPlus /> {text.addSubproject}
            </DropdownMenuItem>
          )}
          <ColorSubmenu color={color} onColorChange={onColorChange} />
          <DropdownMenuItem onSelect={onMove}>
            <FolderInput /> {text.move}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirming(true)}>
            <Archive /> {text.archive}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{text.archiveTitle}</AlertDialogTitle>
            <AlertDialogDescription>{text.archiveDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={onArchive}>{text.archive}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
