import type { ReactNode } from "react"
import { usePageTitle } from "@/hooks/use-page-title"

type ViewPageProps = {
  title: ReactNode
  documentTitle: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function ViewPage({ title, documentTitle, description, actions, children }: ViewPageProps) {
  usePageTitle(documentTitle)
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight text-balance">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}
