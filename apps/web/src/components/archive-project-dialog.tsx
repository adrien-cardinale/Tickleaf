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
import { labels } from "@/lib/labels"

type ArchiveProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onArchive: () => void
}

export function ArchiveProjectDialog({ open, onOpenChange, onArchive }: ArchiveProjectDialogProps) {
  const text = labels.views.project
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
  )
}
