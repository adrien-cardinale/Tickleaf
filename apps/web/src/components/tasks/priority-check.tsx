import type { Priority } from "@tickleaf/core"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const PRIORITY_CLASSES: Record<Priority, string> = {
  1: "border-red-600 text-red-600 bg-red-600/10 dark:border-red-400 dark:text-red-400 dark:bg-red-400/10",
  2: "border-amber-600 text-amber-600 bg-amber-600/10 dark:border-amber-400 dark:text-amber-400 dark:bg-amber-400/10",
  3: "border-foreground text-foreground",
  4: "border-ring text-ring",
}

const DONE_CLASSES = "border-muted-foreground bg-muted-foreground text-background"

type PriorityCheckProps = {
  priority: Priority
  done: boolean
  label: string
  onToggle: () => void
}

export function PriorityCheck({ priority, done, label, onToggle }: PriorityCheckProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={done}
      className={cn(
        "group/check mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-[22px]",
        done ? DONE_CLASSES : PRIORITY_CLASSES[priority],
      )}
    >
      <Check
        strokeWidth={3}
        className={cn("size-2.5 transition-opacity", done ? "opacity-100" : "opacity-0 group-hover/check:opacity-100")}
      />
    </button>
  )
}
