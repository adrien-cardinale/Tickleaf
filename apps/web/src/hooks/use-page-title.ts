import { useEffect } from "react"
import { labels } from "@/lib/labels"

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${labels.app.name}`
  }, [title])
}
