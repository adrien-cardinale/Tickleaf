import { Ellipsis, Pencil, Trash2 } from "lucide-react"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { labels } from "@/lib/labels"

type SectionMenuProps = {
  name: string
  onRename: () => void
  onDelete: () => void
}

export function SectionMenu({ name, onRename, onDelete }: SectionMenuProps) {
  const renaming = useRef(false)
  const text = labels.views.section

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={text.actions(name)}
          title={text.actions(name)}
        >
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
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 /> {text.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
