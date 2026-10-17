import { useEffect } from "react"
import { useTasks } from "@/lib/queries"
import { scheduleReminders } from "@/lib/reminders/reminder-notifications"
import { upcomingReminders } from "@/lib/reminders/reminder-plan"

const SCHEDULE_DELAY_MS = 1_000
const RESCHEDULE_INTERVAL_MS = 60 * 60 * 1_000

export function ReminderScheduler() {
  const { data: tasks } = useTasks()

  useEffect(() => {
    if (!tasks) return
    const schedule = () => {
      const now = new Date()
      scheduleReminders(upcomingReminders(tasks, now), now).catch((error) =>
        console.error("Programmation des rappels impossible", error),
      )
    }
    const debounce = setTimeout(schedule, SCHEDULE_DELAY_MS)
    const refresh = setInterval(schedule, RESCHEDULE_INTERVAL_MS)
    return () => {
      clearTimeout(debounce)
      clearInterval(refresh)
    }
  }, [tasks])

  return null
}
