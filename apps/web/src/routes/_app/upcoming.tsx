import { createFileRoute } from "@tanstack/react-router"
import { buildUpcomingView } from "@tickleaf/core"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskSection } from "@/components/tasks/task-section"
import { ViewPage } from "@/components/view-page"
import { useViewData } from "@/hooks/use-view-data"
import { dayHeading } from "@/lib/format"
import { labels } from "@/lib/labels"

export const Route = createFileRoute("/_app/upcoming")({
  component: UpcomingPage,
})

const UPCOMING_CONTEXT = { due: null, project: null }

function UpcomingPage() {
  const { today, openTasks, projectNameOf } = useViewData()
  const view = buildUpcomingView(openTasks, today)
  const text = labels.views.upcoming
  const isEmpty = view.days.length === 0 && view.later.length === 0

  return (
    <ViewPage title={text.title} documentTitle={text.title} description={text.description}>
      <QuickAdd context={UPCOMING_CONTEXT} placeholder={labels.quickAdd.placeholder} />
      {view.days.map((day) => {
        const heading = dayHeading(day.date, today)
        return (
          <TaskSection
            key={day.date}
            title={heading.title}
            detail={heading.detail}
            tasks={day.tasks}
            today={today}
            empty={text.emptyDay}
            projectNameOf={projectNameOf}
          />
        )
      })}
      {view.later.length > 0 && (
        <TaskSection title={text.later} tasks={view.later} today={today} projectNameOf={projectNameOf} />
      )}
      {isEmpty && <p className="py-8 text-center text-muted-foreground">{text.empty}</p>}
    </ViewPage>
  )
}
