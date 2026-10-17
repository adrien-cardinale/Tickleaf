import { Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useWorkspace } from "@/components/workspace-context"
import { labels } from "@/lib/labels"

export function ShortcutsButton() {
  const { openShortcuts } = useWorkspace()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="hidden size-7 md:inline-flex" onClick={openShortcuts}>
          <Keyboard />
          <span className="sr-only">{labels.shortcuts.title}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{labels.shortcuts.title}</TooltipContent>
    </Tooltip>
  )
}
