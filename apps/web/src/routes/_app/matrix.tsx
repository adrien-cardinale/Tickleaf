import { createFileRoute } from "@tanstack/react-router"
import { buildMatrixView, MATRIX_QUADRANTS, type MatrixQuadrant } from "@tickleaf/core"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskSection } from "@/components/tasks/task-section"
import { Badge } from "@/components/ui/badge"
import { ViewPage } from "@/components/view-page"
import { useViewData } from "@/hooks/use-view-data"
import { labels } from "@/lib/labels"

export const Route = createFileRoute("/_app/matrix")({
  component: MatrixPage,
})

const MATRIX_CONTEXT = { due: null, project: null }

function isDoFirst(quadrant: MatrixQuadrant): boolean {
  return quadrant === "doFirst"
}

function QuadrantBadge({ quadrant, count }: { quadrant: MatrixQuadrant; count: number }) {
  if (isDoFirst(quadrant)) {
    return <Badge className="bg-red-50 text-red-600 tabular-nums dark:bg-red-400/12 dark:text-red-400">{count}</Badge>
  }
  return (
    <Badge variant="secondary" className="tabular-nums">
      {count}
    </Badge>
  )
}

function QuadrantTitle({ quadrant }: { quadrant: MatrixQuadrant }) {
  const title = labels.views.matrix.quadrants[quadrant].title
  if (!isDoFirst(quadrant)) return title
  return <span className="text-red-600 dark:text-red-400">{title}</span>
}

function MatrixPage() {
  const { today, openTasks, projectNameOf } = useViewData()
  const view = buildMatrixView(openTasks, today)
  const text = labels.views.matrix

  return (
    <ViewPage title={text.title} documentTitle={text.title} description={text.description} width="wide">
      <QuickAdd context={MATRIX_CONTEXT} placeholder={labels.quickAdd.placeholder} />
      <div className="grid gap-5 md:grid-cols-2">
        {MATRIX_QUADRANTS.map((quadrant) => (
          <TaskSection
            key={quadrant}
            title={<QuadrantTitle quadrant={quadrant} />}
            detail={text.quadrants[quadrant].action}
            badge={<QuadrantBadge quadrant={quadrant} count={view[quadrant].length} />}
            tasks={view[quadrant]}
            today={today}
            empty={text.quadrants[quadrant].empty}
            projectNameOf={projectNameOf}
          />
        ))}
      </div>
    </ViewPage>
  )
}
