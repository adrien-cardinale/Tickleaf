import type { ReactNode } from "react"
import { usePageTitle } from "@/hooks/use-page-title"
import { cn } from "@/lib/utils"

const WIDTH_CLASSES = {
  default: "max-w-[720px]",
  wide: "max-w-[1100px]",
} as const

type ViewPageProps = {
  title: ReactNode
  documentTitle: string
  description?: string
  breadcrumb?: ReactNode
  actions?: ReactNode
  width?: keyof typeof WIDTH_CLASSES
  children: ReactNode
}

export function ViewPage({
  title,
  documentTitle,
  description,
  breadcrumb,
  actions,
  width = "default",
  children,
}: ViewPageProps) {
  usePageTitle(documentTitle)
  return (
    <div className={cn("mx-auto flex w-full flex-col gap-5", WIDTH_CLASSES[width])}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {breadcrumb}
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight text-balance">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}
