import { createFileRoute } from "@tanstack/react-router"
import { sortManually } from "@tickleaf/core"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskSection } from "@/components/tasks/task-section"
import { ViewPage } from "@/components/view-page"
import { useTaskActions } from "@/hooks/use-task-actions"
import { useViewData } from "@/hooks/use-view-data"
import { labels } from "@/lib/labels"

export const Route = createFileRoute("/_app/inbox")({
  component: InboxPage,
})

const INBOX_CONTEXT = { due: null, project: null }

function InboxPage() {
  const { today, openTasks, projectNameOf } = useViewData()
  const { reorder } = useTaskActions()
  const inbox = sortManually(openTasks.filter((task) => task.projectId === null))
  const text = labels.views.inbox
  return (
    <ViewPage title={text.title} documentTitle={text.title} description={text.description}>
      <QuickAdd context={INBOX_CONTEXT} placeholder={labels.quickAdd.placeholder} />
      <TaskSection
        title={text.section}
        tasks={inbox}
        today={today}
        empty={text.empty}
        projectNameOf={projectNameOf}
        onReorder={reorder}
      />
    </ViewPage>
  )
}
