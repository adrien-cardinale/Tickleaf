import { todayIso } from "@tickleaf/core"
import { Download } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { downloadBlob } from "@/lib/download"
import { exportFileName, tasksToCsv } from "@/lib/export/tasks-csv"
import { labels } from "@/lib/labels"
import { runDb } from "@/lib/queries"
import { listProjects } from "@/lib/services/projects"
import { listAllTasks } from "@/lib/services/tasks"

const text = labels.settings.export

async function exportTasks(): Promise<void> {
  const csv = await runDb(async (db) => tasksToCsv(await listAllTasks(db), await listProjects(db)))
  const saved = await downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), exportFileName(todayIso()))
  if (saved.path === null) toast.success(text.done)
  else toast.success(text.saved, { description: saved.path })
}

export function ExportCard() {
  const [pending, setPending] = useState(false)

  const run = async () => {
    setPending(true)
    try {
      await exportTasks()
    } catch (error) {
      toast.error(text.failed, { description: error instanceof Error ? error.message : String(error) })
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => void run()} disabled={pending}>
          <Download />
          {text.action}
        </Button>
      </CardContent>
    </Card>
  )
}
