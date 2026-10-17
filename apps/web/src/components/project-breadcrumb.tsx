import { Link } from "@tanstack/react-router"
import type { Project } from "@tickleaf/core"
import { ChevronRight } from "lucide-react"
import { ProjectDot } from "@/components/project-dot"
import { labels } from "@/lib/labels"

export function ProjectBreadcrumb({ ancestors }: { ancestors: readonly Project[] }) {
  if (ancestors.length === 0) return null
  return (
    <nav aria-label={labels.views.project.breadcrumb} className="mb-1">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {ancestors.map((ancestor, index) => (
          <li key={ancestor.id} className="flex min-w-0 items-center gap-1">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
            <Link
              to="/project/$projectId"
              params={{ projectId: ancestor.id }}
              className="flex min-w-0 items-center gap-1.5 rounded-sm hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ProjectDot color={ancestor.color} />
              <span className="truncate">{ancestor.name}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
