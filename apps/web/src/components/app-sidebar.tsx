import { Link, useMatchRoute } from "@tanstack/react-router"
import { countTasks } from "@tickleaf/core"
import { Plus } from "lucide-react"
import { useState } from "react"
import { BrandMark } from "@/components/brand-mark"
import { navigationItems } from "@/components/navigation"
import { NewProjectForm } from "@/components/new-project-form"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useToday } from "@/hooks/use-today"
import { labels } from "@/lib/labels"
import { useProjects, useTasks } from "@/lib/queries"

function CountBadge({ value }: { value: number }) {
  if (value === 0) return null
  return <SidebarMenuBadge className="font-normal text-muted-foreground tabular-nums">{value}</SidebarMenuBadge>
}

function ProjectDot() {
  return (
    <span className="grid size-4 shrink-0 place-items-center" aria-hidden="true">
      <span className="size-2 rounded-full border-[1.5px] border-muted-foreground" />
    </span>
  )
}

export function AppSidebar() {
  const matchRoute = useMatchRoute()
  const today = useToday()
  const { data: tasks = [] } = useTasks()
  const { data: projects = [] } = useProjects()
  const { isMobile, setOpenMobile } = useSidebar()
  const [creatingProject, setCreatingProject] = useState(false)
  const counts = countTasks(tasks, today)
  const closeMobileSidebar = () => setOpenMobile(false)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2 text-[15px] font-semibold tracking-tight">
          <BrandMark className="size-5 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">{labels.app.name}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="sr-only">{labels.nav.views}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = Boolean(matchRoute({ to: item.to }))
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link
                        to={item.to}
                        replace={isMobile}
                        onClick={closeMobileSidebar}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    <CountBadge value={item.count(counts)} />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium tracking-[0.06em] uppercase">
            {labels.nav.projects}
          </SidebarGroupLabel>
          <SidebarGroupAction
            title={labels.nav.newProject}
            aria-label={labels.nav.newProject}
            aria-expanded={creatingProject}
            onClick={() => setCreatingProject((open) => !open)}
          >
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => {
                const isActive = Boolean(matchRoute({ to: "/project/$projectId", params: { projectId: project.id } }))
                return (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={project.name}>
                      <Link
                        to="/project/$projectId"
                        params={{ projectId: project.id }}
                        replace={isMobile}
                        onClick={closeMobileSidebar}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <ProjectDot />
                        <span>{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <CountBadge value={counts.byProject[project.id] ?? 0} />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
            {creatingProject && (
              <div className="group-data-[collapsible=icon]:hidden">
                <NewProjectForm
                  onCancel={() => setCreatingProject(false)}
                  onCreated={() => {
                    setCreatingProject(false)
                    closeMobileSidebar()
                  }}
                />
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
