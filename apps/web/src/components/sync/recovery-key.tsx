import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { labels } from "@/lib/labels"

// navigator.clipboard n'existe que dans un contexte sécurisé : une instance auto-hébergée servie en HTTP n'y a pas accès.
function copyWithSelection(phrase: string, container: HTMLElement): boolean {
  const textarea = document.createElement("textarea")
  textarea.value = phrase
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  container.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand("copy")
  } finally {
    textarea.remove()
  }
}

async function copyPhrase(phrase: string, container: HTMLElement): Promise<void> {
  try {
    if (navigator.clipboard) await navigator.clipboard.writeText(phrase)
    else if (!copyWithSelection(phrase, container)) throw new Error("copy refused")
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
      <Button
        variant="outline"
        className="w-full"
        onClick={(event) => void copyPhrase(phrase, event.currentTarget.parentElement ?? document.body)}
        disabled={phrase === ""}
      >
        <Copy />
        {labels.onboarding.copy}
      </Button>
    </div>
  )
}
