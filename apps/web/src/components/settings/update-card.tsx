import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { labels } from "@/lib/labels"

const text = labels.settings.updates

async function checkForUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker?.getRegistration()
  if (!registration) {
    toast.info(text.unavailable)
    return
  }
  await registration.update()
  if (registration.installing === null && registration.waiting === null) toast.success(text.upToDate)
}

export function UpdateCard() {
  const [checking, setChecking] = useState(false)

  const check = async () => {
    setChecking(true)
    try {
      await checkForUpdate()
    } catch {
      toast.error(text.checkFailed)
    } finally {
      setChecking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-1 sm:grid-cols-[12rem_1fr]">
          <dt className="text-sm text-muted-foreground">{text.installedVersion}</dt>
          <dd className="text-sm">{__APP_VERSION__}</dd>
        </dl>
        <Button variant="outline" onClick={() => void check()} disabled={checking}>
          <RefreshCw className={checking ? "animate-spin" : undefined} />
          {checking ? text.checking : text.check}
        </Button>
      </CardContent>
    </Card>
  )
}
