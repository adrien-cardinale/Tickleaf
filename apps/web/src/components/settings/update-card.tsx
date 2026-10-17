import { useQuery } from "@tanstack/react-query"
import { CircleCheck, Download, ExternalLink, RefreshCw, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { labels } from "@/lib/labels"
import { runtimeKind } from "@/lib/runtime"
import { RELEASES_PAGE_URL } from "@/lib/updates/github-release"
import {
  APP_VERSION,
  type AvailableUpdate,
  checkForNativeUpdate,
  type NativeChannel,
  openExternalUrl,
} from "@/lib/updates/update-service"

const text = labels.settings.updates

async function checkServiceWorker(): Promise<void> {
  const registration = await navigator.serviceWorker?.getRegistration()
  if (!registration) {
    toast.info(text.unavailable)
    return
  }
  await registration.update()
  if (registration.installing === null && registration.waiting === null) toast.success(text.upToDate)
}

function ServiceWorkerCheck() {
  const [checking, setChecking] = useState(false)

  const check = async () => {
    setChecking(true)
    try {
      await checkServiceWorker()
    } catch {
      toast.error(text.checkFailed)
    } finally {
      setChecking(false)
    }
  }

  return (
    <Button variant="outline" onClick={() => void check()} disabled={checking}>
      <RefreshCw className={checking ? "animate-spin" : undefined} />
      {checking ? text.checking : text.check}
    </Button>
  )
}

async function openUrl(url: string): Promise<void> {
  try {
    await openExternalUrl(url)
  } catch {
    toast.error(text.openFailed)
  }
}

function UpdateNotice({ update }: { update: AvailableUpdate }) {
  return (
    <Alert>
      <Download />
      <AlertTitle>{text.available(update.version)}</AlertTitle>
      {update.notes && (
        <AlertDescription>
          <div className="max-h-40 w-full overflow-y-auto text-sm whitespace-pre-line">{update.notes}</div>
        </AlertDescription>
      )}
    </Alert>
  )
}

function ReleaseCheck({ channel }: { channel: NativeChannel }) {
  const [installing, setInstalling] = useState(false)
  const [ratio, setRatio] = useState<number | null>(null)

  const check = useQuery({
    queryKey: ["update-check", channel],
    queryFn: () => checkForNativeUpdate(channel),
  })

  const update = check.data ?? null

  const install = async () => {
    if (!update?.install) return
    setInstalling(true)
    setRatio(null)
    try {
      await update.install(setRatio)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.installFailed)
      setInstalling(false)
      setRatio(null)
    }
  }

  return (
    <>
      {check.isError && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>{text.checkFailed}</AlertTitle>
          <AlertDescription>{check.error instanceof Error ? check.error.message : ""}</AlertDescription>
        </Alert>
      )}

      {update && <UpdateNotice update={update} />}

      {!update && check.isSuccess && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck className="size-4" />
          {text.upToDate}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant={update ? "outline" : "default"}
          onClick={() => void check.refetch()}
          disabled={check.isFetching || installing}
        >
          <RefreshCw className={check.isFetching ? "animate-spin" : undefined} />
          {check.isFetching ? text.checking : text.check}
        </Button>

        {update?.install && (
          <Button onClick={() => void install()} disabled={installing}>
            <Download />
            {installing ? text.installing(ratio === null ? null : Math.round(ratio * 100)) : text.install}
          </Button>
        )}

        {update && !update.install && (
          <Button onClick={() => void openUrl(update.downloadUrl ?? RELEASES_PAGE_URL)}>
            {channel === "android" ? <Download /> : <ExternalLink />}
            {channel === "android" ? text.downloadApk : text.openRelease}
          </Button>
        )}

        {check.isError && (
          <Button variant="outline" onClick={() => void openUrl(RELEASES_PAGE_URL)}>
            <ExternalLink />
            {text.openRelease}
          </Button>
        )}
      </div>
    </>
  )
}

export function UpdateCard() {
  const channel = runtimeKind()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description[channel]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-1 sm:grid-cols-[12rem_1fr]">
          <dt className="text-sm text-muted-foreground">{text.installedVersion}</dt>
          <dd className="text-sm">{APP_VERSION}</dd>
        </dl>
        {channel === "web" ? <ServiceWorkerCheck /> : <ReleaseCheck channel={channel} />}
      </CardContent>
    </Card>
  )
}
