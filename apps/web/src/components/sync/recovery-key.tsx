import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { labels } from "@/lib/labels"

async function copyPhrase(phrase: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(phrase)
    toast.success(labels.onboarding.copied)
  } catch {
    toast.error(labels.onboarding.copyFailed)
  }
}

export function RecoveryKey({ phrase }: { phrase: string }) {
  return (
    <div className="space-y-2">
      <p className="rounded-md border bg-muted/40 p-3 font-mono text-sm leading-relaxed tracking-wide break-words select-all">
        {phrase}
      </p>
      <Button variant="outline" className="w-full" onClick={() => void copyPhrase(phrase)} disabled={phrase === ""}>
        <Copy />
        {labels.onboarding.copy}
      </Button>
    </div>
  )
}
