import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  ancestorsOf,
  canAddSubproject,
  childProjectsOf,
  countTasks,
  countWithDescendants,
  type Project,
  sortManually,
} from "@tickleaf/core"
import { useState } from "react"
import { MoveProjectDialog } from "@/components/move-project-dialog"
import { ProjectBreadcrumb } from "@/components/project-breadcrumb"
import { ProjectMenu } from "@/components/project-menu"
import { ProjectTitle } from "@/components/project-title"
import { NewSectionForm } from "@/components/sections/new-section-form"
import { ProjectSection } from "@/components/sections/project-section"
import { SubprojectDialog } from "@/components/subproject-dialog"
import { SubprojectList } from "@/components/subproject-list"
import { QuickAdd } from "@/components/tasks/quick-add"
import { type BoardColumn, TaskBoard } from "@/components/tasks/task-board"
import { TaskSection } from "@/components/tasks/task-section"
import { Button } from "@/components/ui/button"
import { ViewPage } from "@/components/view-page"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useTaskActions } from "@/hooks/use-task-actions"
import { useViewData } from "@/hooks/use-view-data"
import { labels } from "@/lib/labels"
import { useSections, useTasks } from "@/lib/queries"

export const Route = createFileRoute("/_app/project/$projectId")({
  component: ProjectPage,
})

const NO_PROJECT_NAME = () => null

const UNSECTIONED = "unsectioned"

type ProjectDialog = "subproject" | "move" | null

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
  const { data: allTasks = [] } = useTasks()
  const { rename, setColor, archive } = useProjectActions()
  const { reorder, moveToSection } = useTaskActions()
  const [editing, setEditing] = useState(false)
  const [dialog, setDialog] = useState<ProjectDialog>(null)
  const project = projects.find((candidate) => candidate.id === projectId)
  const text = labels.views.project

  if (!project) return ready ? <ProjectNotFound /> : null

  const items = sortManually(openTasks.filter((task) => task.projectId === project.id))
  const sections = allSections.filter((section) => section.projectId === project.id)
  const sectionIds = new Set(sections.map((section) => section.id))
  const unsectioned = items.filter((task) => task.sectionId === null || !sectionIds.has(task.sectionId))
  const columns: BoardColumn[] = [
    { id: UNSECTIONED, tasks: unsectioned },
    ...sections.map((section) => ({ id: section.id, tasks: items.filter((task) => task.sectionId === section.id) })),
  ]
  const tasksOf = (columnId: string) => columns.find((column) => column.id === columnId)?.tasks ?? []
  const openByProject = countTasks(allTasks, today).byProject
  const openCountOf = (subproject: Project) => countWithDescendants(projects, openByProject, subproject.id)
  const closeDialog = (open: boolean) => {
    if (!open) setDialog(null)
  }

  const moveTask = (taskId: string, columnId: string, orderedIds: string[]) => {
    const sectionId = columnId === UNSECTIONED ? null : columnId
    const task = items.find((candidate) => candidate.id === taskId)
    return task?.sectionId === sectionId ? reorder(orderedIds) : moveToSection(taskId, sectionId, orderedIds)
  }

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
      breadcrumb={<ProjectBreadcrumb ancestors={ancestorsOf(projects, project.id)} />}
      actions={
        <ProjectMenu
          color={project.color}
          onColorChange={(color) => void setColor(project.id, color)}
          canAddSubproject={canAddSubproject(projects, project.id)}
          onRename={() => setEditing(true)}
          onAddSubproject={() => setDialog("subproject")}
          onMove={() => setDialog("move")}
          onArchive={() => void archiveProject()}
        />
      }
    >
      <QuickAdd context={{ due: null, project }} placeholder={labels.quickAdd.placeholderProject(project.name)} />
      <TaskBoard columns={columns} today={today} projectNameOf={NO_PROJECT_NAME} onMove={moveTask}>
        {(sections.length === 0 || unsectioned.length > 0) && (
          <TaskSection
            title={text.section}
            tasks={unsectioned}
            today={today}
            empty={text.empty}
            projectNameOf={NO_PROJECT_NAME}
            columnId={UNSECTIONED}
          />
        )}
        {sections.map((section) => (
          <ProjectSection
            key={section.id}
            project={project}
            section={section}
            tasks={tasksOf(section.id)}
            today={today}
          />
        ))}
      </TaskBoard>
      <NewSectionForm key={project.id} projectId={project.id} />
      <SubprojectList subprojects={childProjectsOf(projects, project.id)} openCountOf={openCountOf} />
      <SubprojectDialog parent={project} open={dialog === "subproject"} onOpenChange={closeDialog} />
      <MoveProjectDialog project={project} projects={projects} open={dialog === "move"} onOpenChange={closeDialog} />
    </ViewPage>
  )
}
