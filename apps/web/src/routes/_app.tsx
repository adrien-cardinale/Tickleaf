import { createFileRoute, type ErrorComponentProps, Outlet, useRouter } from "@tanstack/react-router"
import { RotateCw } from "lucide-react"
import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { BrandMark } from "@/components/brand-mark"
import { ReminderScheduler } from "@/components/reminder-scheduler"
import { SearchField } from "@/components/search-field"
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { WorkspaceProvider } from "@/components/workspace-context"
import { usePageTitle } from "@/hooks/use-page-title"
import { labels } from "@/lib/labels"
import { projectsQuery, tasksQuery } from "@/lib/queries"
import { isTauri } from "@/lib/runtime"

export const Route = createFileRoute("/_app")({
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(tasksQuery), context.queryClient.ensureQueryData(projectsQuery)]),
  component: AppLayout,
  errorComponent: AppError,
})

function AppShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-3 border-b bg-background/88 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-[8px]">
            <SidebarTrigger className="-ml-1" />
            <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight md:hidden">
              <BrandMark className="size-5" />
              {labels.app.name}
            </span>
            <SearchField />
          </header>
          <div className="flex-1 px-4 pt-6 pb-[calc(3rem+env(safe-area-inset-bottom))] text-sm sm:px-6">{children}</div>
        </SidebarInset>
        <TaskDetailSheet />
        {isTauri() && <ReminderScheduler />}
      </SidebarProvider>
    </WorkspaceProvider>
  )
}

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function AppError({ error }: ErrorComponentProps) {
  const router = useRouter()
  usePageTitle(labels.error.title)
  return (
    <AppShell>
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-medium">{labels.error.loadFailed}</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : labels.boot.unexpected}
          </p>
          <Button variant="outline" onClick={() => void router.invalidate()}>
            <RotateCw />
            {labels.boot.retry}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  )
}
