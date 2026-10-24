import { Link, useMatchRoute, useNavigate, useParams } from "@tanstack/react-router"
import { ancestorsOf, buildProjectTree, countWithDescendants, type Project, type ProjectNode } from "@tickleaf/core"
import { ChevronRight } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { ProjectContextMenu } from "@/components/project-context-menu"
import { ProjectDot } from "@/components/project-dot"
import { ContextMenuTrigger } from "@/components/ui/context-menu"
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useCollapsedProjects } from "@/hooks/use-collapsed-projects"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"

type ProjectTreeContext = {
  projects: readonly Project[]
  isOpen: (node: ProjectNode<Project>) => boolean
  toggle: (id: string) => void
  countOf: (node: ProjectNode<Project>) => number
  isActive: (id: string) => boolean
  replace: boolean
  onNavigate: () => void
  onArchived: (id: string) => void
}

type ProjectItemProps = { node: ProjectNode<Project>; tree: ProjectTreeContext }

function CountBadge({ value, className }: { value: number; className?: string }) {
  if (value === 0) return null
  return (
    <SidebarMenuBadge className={cn("font-normal text-muted-foreground tabular-nums", className)}>
      {value}
    </SidebarMenuBadge>
  )
}

function ToggleAction({ node, tree, className }: ProjectItemProps & { className?: string }) {
  if (node.children.length === 0) return null
  const open = tree.isOpen(node)
  const label = open ? labels.nav.collapseProject(node.project.name) : labels.nav.expandProject(node.project.name)
  return (
    <SidebarMenuAction
      className={className}
      aria-label={label}
      title={label}
      aria-expanded={open}
      onClick={() => tree.toggle(node.project.id)}
    >
      <ChevronRight className={cn("transition-transform", open && "rotate-90")} />
    </SidebarMenuAction>
  )
}

function ProjectLink({ node, tree, ...slotProps }: ProjectItemProps & ComponentProps<"a">) {
  const active = tree.isActive(node.project.id)
  return (
    <Link
      {...slotProps}
      to="/project/$projectId"
      params={{ projectId: node.project.id }}
      replace={tree.replace}
      onClick={tree.onNavigate}
      aria-current={active ? "page" : undefined}
    >
      <span className="grid size-4 shrink-0 place-items-center" aria-hidden="true">
        <ProjectDot color={node.project.color} />
      </span>
      <span>{node.project.name}</span>
    </Link>
  )
}

function ProjectMenuArea({ node, tree, children }: ProjectItemProps & { children: ReactNode }) {
  return (
    <ProjectContextMenu
      project={node.project}
      projects={tree.projects}
      onArchived={() => tree.onArchived(node.project.id)}
    >
      {children}
    </ProjectContextMenu>
  )
}

function ChildProjects({ node, tree }: ProjectItemProps) {
  if (node.children.length === 0 || !tree.isOpen(node)) return null
  return (
    <SidebarMenuSub className="mr-0">
      {node.children.map((child) => (
        <SubProjectItem key={child.project.id} node={child} tree={tree} />
      ))}
    </SidebarMenuSub>
  )
}

function SubProjectItem({ node, tree }: ProjectItemProps) {
  const hasChildren = node.children.length > 0
  return (
    <SidebarMenuSubItem>
      <ProjectMenuArea node={node} tree={tree}>
        <SidebarMenuSubButton
          asChild
          isActive={tree.isActive(node.project.id)}
          className={hasChildren ? "pr-14" : "pr-8"}
        >
          <ContextMenuTrigger asChild>
            <ProjectLink node={node} tree={tree} />
          </ContextMenuTrigger>
        </SidebarMenuSubButton>
      </ProjectMenuArea>
      <ToggleAction node={node} tree={tree} className="top-1" />
      <CountBadge value={tree.countOf(node)} className={cn("top-1", hasChildren && "right-7")} />
      <ChildProjects node={node} tree={tree} />
    </SidebarMenuSubItem>
  )
}

function RootProjectItem({ node, tree }: ProjectItemProps) {
  const hasChildren = node.children.length > 0
  return (
    <SidebarMenuItem>
      <ProjectMenuArea node={node} tree={tree}>
        <SidebarMenuButton
          asChild
          isActive={tree.isActive(node.project.id)}
          tooltip={node.project.name}
          className={cn(hasChildren && "group-has-data-[sidebar=menu-action]/menu-item:pr-14")}
        >
          <ContextMenuTrigger asChild>
            <ProjectLink node={node} tree={tree} />
          </ContextMenuTrigger>
        </SidebarMenuButton>
      </ProjectMenuArea>
      <ToggleAction node={node} tree={tree} />
      <CountBadge value={tree.countOf(node)} className={cn(hasChildren && "right-7")} />
      <ChildProjects node={node} tree={tree} />
    </SidebarMenuItem>
  )
}

type SidebarProjectTreeProps = {
  projects: readonly Project[]
  openByProject: Readonly<Record<string, number>>
  onNavigate: () => void
}

export function SidebarProjectTree({ projects, openByProject, onNavigate }: SidebarProjectTreeProps) {
  const matchRoute = useMatchRoute()
  const navigate = useNavigate()
  const { projectId: activeId } = useParams({ strict: false })
  const { isMobile } = useSidebar()
  const { isCollapsed, toggle } = useCollapsedProjects()
  const isOpen = (node: ProjectNode<Project>) => !isCollapsed(node.project.id)

  const containsActive = (id: string) =>
    activeId !== undefined &&
    (activeId === id || ancestorsOf(projects, activeId).some((ancestor) => ancestor.id === id))

  const tree: ProjectTreeContext = {
    projects,
    isOpen,
    toggle,
    countOf: (node) =>
      isOpen(node)
        ? (openByProject[node.project.id] ?? 0)
        : countWithDescendants(projects, openByProject, node.project.id),
    isActive: (id) => Boolean(matchRoute({ to: "/project/$projectId", params: { projectId: id } })),
    replace: isMobile,
    onNavigate,
    onArchived: (id) => {
      if (containsActive(id)) void navigate({ to: "/inbox" })
    },
  }

  return (
    <SidebarMenu>
      {buildProjectTree(projects).map((node) => (
        <RootProjectItem key={node.project.id} node={node} tree={tree} />
      ))}
    </SidebarMenu>
  )
}
