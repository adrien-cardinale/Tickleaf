import { createFileRoute } from "@tanstack/react-router"
import { buildTodayView } from "@tickleaf/core"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskSection } from "@/components/tasks/task-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ViewPage } from "@/components/view-page"
import { useTaskActions } from "@/hooks/use-task-actions"
import { useViewData } from "@/hooks/use-view-data"
import { capitalize, formatLongDate } from "@/lib/format"
import { labels } from "@/lib/labels"

export const Route = createFileRoute("/_app/today")({
  component: TodayPage,
})

function TodayPage() {
  const { today, openTasks, projectNameOf } = useViewData()
  const { rescheduleOverdue } = useTaskActions()
  const view = buildTodayView(openTasks, today)
  const text = labels.views.today
  const hasOverdue = view.overdue.length > 0

  return (
    <ViewPage title={text.title} documentTitle={text.title} description={capitalize(formatLongDate(today))}>
      <QuickAdd context={{ due: today, project: null }} placeholder={labels.quickAdd.placeholderToday} />
      {hasOverdue && (
        <TaskSection
          title={text.overdue}
          badge={
            <Badge className="bg-red-50 text-red-600 tabular-nums dark:bg-red-400/12 dark:text-red-400">
              {view.overdue.length}
            </Badge>
          }
          action={
            <Button variant="link" className="h-auto p-0" onClick={() => void rescheduleOverdue(today)}>
              {text.reschedule}
            </Button>
          }
          tasks={view.overdue}
          today={today}
          projectNameOf={projectNameOf}
        />
      )}
      <TaskSection
        title={text.section}
        tasks={view.today}
        today={today}
        empty={hasOverdue ? text.emptyAfterOverdue : text.empty}
        projectNameOf={projectNameOf}
      />
    </ViewPage>
  )
}
