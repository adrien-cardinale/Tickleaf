import { createFileRoute } from "@tanstack/react-router"
import { compareCompleted } from "@tickleaf/core"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskSection } from "@/components/tasks/task-section"
import { ViewPage } from "@/components/view-page"
import { useViewData } from "@/hooks/use-view-data"
import { labels } from "@/lib/labels"

export const Route = createFileRoute("/_app/completed")({
  component: CompletedPage,
})

const COMPLETED_CONTEXT = { due: null, project: null }

function CompletedPage() {
  const { today, completedTasks, projectNameOf } = useViewData()
  const history = [...completedTasks].sort(compareCompleted)
  const text = labels.views.completed

  return (
    <ViewPage title={text.title} documentTitle={text.title} description={text.description(history.length)}>
      <QuickAdd context={COMPLETED_CONTEXT} placeholder={labels.quickAdd.placeholder} />
      <TaskSection
        title={text.section}
        tasks={history}
        today={today}
        empty={text.empty}
        projectNameOf={projectNameOf}
      />
    </ViewPage>
  )
}
