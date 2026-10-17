import type { ReactNode } from "react"

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-block rounded-[5px] border border-b-2 px-1.5 font-mono text-[11px] text-muted-foreground">
      {children}
    </kbd>
  )
}
