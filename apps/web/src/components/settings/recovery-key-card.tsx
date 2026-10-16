import { RecoveryKeySection } from "@/components/sync/recovery-key-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { labels } from "@/lib/labels"

export function RecoveryKeyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.settings.recoveryKey.title}</CardTitle>
        <CardDescription>{labels.settings.recoveryKey.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <RecoveryKeySection />
      </CardContent>
    </Card>
  )
}
