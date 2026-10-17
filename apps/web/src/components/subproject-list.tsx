import { Link } from "@tanstack/react-router"
import type { Project } from "@tickleaf/core"
import { ProjectDot } from "@/components/project-dot"
import { labels } from "@/lib/labels"

type SubprojectListProps = {
  subprojects: readonly Project[]
  openCountOf: (project: Project) => number
}

export function SubprojectList({ subprojects, openCountOf }: SubprojectListProps) {
  if (subprojects.length === 0) return null
  const text = labels.views.project
  return (
    <section className="flex flex-col">
      <h2 className="border-b pb-2 text-sm font-semibold tracking-tight">{text.subprojects}</h2>
      <ul className="flex flex-col">
        {subprojects.map((subproject) => (
          <li key={subproject.id} className="border-b">
            <Link
              to="/project/$projectId"
              params={{ projectId: subproject.id }}
              className="flex items-center gap-3 px-1 py-2 text-sm hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ProjectDot color={subproject.color} />
              <span className="min-w-0 flex-1 truncate">{subproject.name}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {text.subprojectCount(openCountOf(subproject))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
