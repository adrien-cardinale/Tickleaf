import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { usePageTitle } from "@/hooks/use-page-title"
import { labels } from "@/lib/labels"

export type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFound,
})

function NotFound() {
  usePageTitle(labels.notFound.title)
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl font-semibold tracking-tight text-muted-foreground tabular-nums">404</p>
      <div className="space-y-1">
        <h1 className="text-lg font-medium">{labels.notFound.title}</h1>
        <p className="text-sm text-muted-foreground">{labels.notFound.description}</p>
      </div>
      <Button asChild>
        <Link to="/today">{labels.notFound.back}</Link>
      </Button>
    </div>
  )
}
