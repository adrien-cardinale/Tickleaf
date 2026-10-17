import { Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspace } from "@/components/workspace-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { labels } from "@/lib/labels"

const text = labels.settings.shortcuts

export function ShortcutsCard() {
  const { openShortcuts } = useWorkspace()
  const isMobile = useIsMobile()
  if (isMobile) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={openShortcuts}>
          <Keyboard />
          {text.action}
        </Button>
      </CardContent>
    </Card>
  )
}
