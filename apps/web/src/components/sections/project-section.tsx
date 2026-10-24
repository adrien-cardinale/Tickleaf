import type { IsoDate, Project, Section, Task } from "@tickleaf/core"
import { useState } from "react"
import { NameEditor } from "@/components/name-editor"
import { TaskSection } from "@/components/tasks/task-section"
import { useSectionActions } from "@/hooks/use-section-actions"
import { labels } from "@/lib/labels"
import { SectionMenu } from "./section-menu"
import { SectionTaskAdd } from "./section-task-add"

const NO_PROJECT_NAME = () => null

type ProjectSectionProps = {
  project: Project
  section: Section
  tasks: readonly Task[]
  today: IsoDate
}

export function ProjectSection({ project, section, tasks, today }: ProjectSectionProps) {
  const [editing, setEditing] = useState(false)
  const { rename, remove } = useSectionActions()
  const text = labels.views.section

  const title = editing ? (
    <NameEditor
      id={`section-name-${section.id}`}
      label={text.nameLabel}
      name={section.name}
      onDone={() => setEditing(false)}
      onRename={(name) => void rename(section.id, name)}
      className="h-7 text-sm font-semibold"
    />
  ) : (
    section.name
  )

  return (
    <TaskSection
      title={title}
      detail={tasks.length > 0 ? String(tasks.length) : undefined}
      action={
        <SectionMenu name={section.name} onRename={() => setEditing(true)} onDelete={() => void remove(section.id)} />
      }
      tasks={tasks}
      today={today}
      empty={text.empty}
      projectNameOf={NO_PROJECT_NAME}
      footer={<SectionTaskAdd project={project} section={section} />}
      columnId={section.id}
    />
  )
}
