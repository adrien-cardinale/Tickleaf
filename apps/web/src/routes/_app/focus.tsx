import { createFileRoute } from "@tanstack/react-router"
import { buildFocusView, FOCUS_LIMIT, type FocusView, suggestedFocus, type Task } from "@tickleaf/core"
import { Play } from "lucide-react"
import { useMemo, useState } from "react"
import { FocusSession } from "@/components/focus/focus-session"
import { TaskSection } from "@/components/tasks/task-section"
import { Button } from "@/components/ui/button"
import { ViewPage } from "@/components/view-page"
import { useTaskActions } from "@/hooks/use-task-actions"
import { useViewData } from "@/hooks/use-view-data"
import { labels } from "@/lib/labels"

export const Route = createFileRoute("/_app/focus")({
  component: FocusPage,
})

const text = labels.views.focus

function focusDescription(view: FocusView): string {
  if (view.overLimit) return text.overLimit(view.tasks.length, FOCUS_LIMIT)
  return text.description(view.tasks.length, FOCUS_LIMIT)
}

type SuggestionsProps = {
  suggestions: readonly Task[]
  now: Date
  projectNameOf: (task: Task) => string | null
  onAddAll: () => void
}

function Suggestions({ suggestions, now, projectNameOf, onAddAll }: SuggestionsProps) {
  return (
    <TaskSection
      title={text.suggestions}
      action={
        <Button variant="link" className="h-auto p-0" onClick={onAddAll}>
          {text.addAll}
        </Button>
      }
      tasks={suggestions}
      now={now}
      projectNameOf={projectNameOf}
    />
  )
}

function StartButton({ disabled, onStart }: { disabled: boolean; onStart: () => void }) {
  return (
    <Button disabled={disabled} onClick={onStart}>
      <Play />
      {text.start}
    </Button>
  )
}

function FocusPage() {
  const { today, now, openTasks, projectNameOf } = useViewData()
  const { reorderAmong, focusMany } = useTaskActions()
  const [running, setRunning] = useState(false)
  const view = useMemo(() => buildFocusView(openTasks, today), [openTasks, today])
  const suggestions = useMemo(() => suggestedFocus(openTasks, today), [openTasks, today])
  const empty = view.tasks.length === 0

  const addSuggestions = () =>
    void focusMany(
      suggestions.map((task) => task.id),
      today,
    )

  return (
    <ViewPage
      title={text.title}
      documentTitle={text.title}
      description={focusDescription(view)}
      actions={<StartButton disabled={empty} onStart={() => setRunning(true)} />}
    >
      <TaskSection
        title={text.section}
        tasks={view.tasks}
        now={now}
        empty={text.empty}
        projectNameOf={projectNameOf}
        onReorder={reorderAmong}
      />
      {empty && suggestions.length > 0 && (
        <Suggestions suggestions={suggestions} now={now} projectNameOf={projectNameOf} onAddAll={addSuggestions} />
      )}
      {running && (
        <FocusSession tasks={view.tasks} today={today} projectNameOf={projectNameOf} onExit={() => setRunning(false)} />
      )}
    </ViewPage>
  )
}
