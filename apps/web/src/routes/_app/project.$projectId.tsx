import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { sortManually } from "@tickleaf/core"
import { useState } from "react"
import { ProjectMenu } from "@/components/project-menu"
import { ProjectTitle } from "@/components/project-title"
import { NewSectionForm } from "@/components/sections/new-section-form"
import { ProjectSection } from "@/components/sections/project-section"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskSection } from "@/components/tasks/task-section"
import { Button } from "@/components/ui/button"
import { ViewPage } from "@/components/view-page"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useTaskActions } from "@/hooks/use-task-actions"
import { useViewData } from "@/hooks/use-view-data"
import { labels } from "@/lib/labels"
import { useSections } from "@/lib/queries"

export const Route = createFileRoute("/_app/project/$projectId")({
  component: ProjectPage,
})

const NO_PROJECT_NAME = () => null

function ProjectNotFound() {
  const text = labels.views.project
  return (
    <ViewPage title={text.fallbackTitle} documentTitle={text.fallbackTitle}>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-muted-foreground">{text.notFound}</p>
        <Button variant="outline" asChild>
          <Link to="/inbox">{text.backToInbox}</Link>
        </Button>
      </div>
    </ViewPage>
  )
}

function ProjectPage() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()
  const { today, ready, projects, openTasks } = useViewData()
  const { data: allSections = [] } = useSections()
  const { rename, archive } = useProjectActions()
  const { reorder } = useTaskActions()
  const [editing, setEditing] = useState(false)
  const project = projects.find((candidate) => candidate.id === projectId)
  const text = labels.views.project

  if (!project) return ready ? <ProjectNotFound /> : null

  const items = sortManually(openTasks.filter((task) => task.projectId === project.id))
  const sections = allSections.filter((section) => section.projectId === project.id)
  const sectionIds = new Set(sections.map((section) => section.id))
  const unsectioned = items.filter((task) => task.sectionId === null || !sectionIds.has(task.sectionId))

  const archiveProject = async () => {
    if (await archive(project.id)) void navigate({ to: "/inbox" })
  }

  return (
    <ViewPage
      title={
        <ProjectTitle
          key={project.id}
          name={project.name}
          editing={editing}
          onEditingChange={setEditing}
          onRename={(name) => void rename(project.id, name)}
        />
      }
      documentTitle={project.name}
      description={text.description(items.length)}
      actions={<ProjectMenu onRename={() => setEditing(true)} onArchive={() => void archiveProject()} />}
    >
      <QuickAdd context={{ due: null, project }} placeholder={labels.quickAdd.placeholderProject(project.name)} />
      {(sections.length === 0 || unsectioned.length > 0) && (
        <TaskSection
          title={text.section}
          tasks={unsectioned}
          today={today}
          empty={text.empty}
          projectNameOf={NO_PROJECT_NAME}
          onReorder={reorder}
        />
      )}
      {sections.map((section) => (
        <ProjectSection
          key={section.id}
          project={project}
          section={section}
          tasks={items.filter((task) => task.sectionId === section.id)}
          today={today}
        />
      ))}
      <NewSectionForm key={project.id} projectId={project.id} />
    </ViewPage>
  )
}
