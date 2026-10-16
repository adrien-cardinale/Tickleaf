import { Archive, Ellipsis, Pencil } from "lucide-react"
import { useRef, useState } from "react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { labels } from "@/lib/labels"

type ProjectMenuProps = {
  onRename: () => void
  onArchive: () => void
}

export function ProjectMenu({ onRename, onArchive }: ProjectMenuProps) {
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
