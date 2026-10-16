import { RotateCw, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { labels } from "@/lib/labels"

const SCREEN_PADDING = "px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"

export function StartupLoading() {
  return (
    <main className={`flex min-h-svh ${SCREEN_PADDING}`} aria-busy="true">
      <span className="sr-only">{labels.boot.opening}</span>
      <div className="hidden w-64 shrink-0 flex-col gap-2 border-r pr-4 md:flex">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-4 h-7 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-full" />
      </div>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 md:px-6">
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </main>
  )
}

type StartupFailureProps = {
  message: string
  onRetry: () => void
}

export function StartupFailure({ message, onRetry }: StartupFailureProps) {
  return (
    <main className={`flex min-h-svh items-start justify-center sm:items-center ${SCREEN_PADDING}`}>
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>{labels.boot.openFailed}</AlertTitle>
          <AlertDescription className="break-words">{message}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={onRetry}>
          <RotateCw />
          {labels.boot.retry}
        </Button>
      </div>
    </main>
  )
}
