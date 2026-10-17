import type { ProjectColor } from "@tickleaf/core"
import { cn } from "@/lib/utils"

const PROJECT_COLOR_CLASSES: Record<ProjectColor, string> = {
  gray: "bg-muted-foreground",
  red: "bg-red-500 dark:bg-red-400",
  orange: "bg-orange-500 dark:bg-orange-400",
  yellow: "bg-yellow-500 dark:bg-yellow-400",
  green: "bg-green-600 dark:bg-green-500",
  teal: "bg-teal-500 dark:bg-teal-400",
  blue: "bg-blue-500 dark:bg-blue-400",
  indigo: "bg-indigo-500 dark:bg-indigo-400",
  purple: "bg-purple-500 dark:bg-purple-400",
  pink: "bg-pink-500 dark:bg-pink-400",
}

type ProjectDotProps = {
  color: ProjectColor
  className?: string
}

export function ProjectDot({ color, className }: ProjectDotProps) {
  return (
    <span className={cn("size-2 shrink-0 rounded-full", PROJECT_COLOR_CLASSES[color], className)} aria-hidden="true" />
  )
}
