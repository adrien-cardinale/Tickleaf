import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { labels } from "@/lib/labels"
import { parseServerUrl } from "@/lib/sync/server-url"
import { changeServerUrl } from "@/lib/sync/sync-store"

export function ServerUrlForm({ current }: { current: string | null }) {
  const [value, setValue] = useState(current ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const unchanged = value.trim() === (current ?? "")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const serverUrl = parseServerUrl(value)
    if (value.trim() !== "" && serverUrl === null) return setError(labels.onboarding.invalidServer)
    setPending(true)
    await changeServerUrl(serverUrl)
    setPending(false)
    toast.success(labels.sync.dialog.serverSaved)
  }

  return (
    <form className="space-y-2" onSubmit={(event) => void submit(event)}>
      <Label htmlFor="sync-server-url">{labels.onboarding.serverLabel}</Label>
      <div className="flex gap-2">
        <Input
          id="sync-server-url"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={labels.onboarding.serverPlaceholder}
          value={value}
          aria-invalid={error !== null}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
        />
        <Button type="submit" variant="outline" disabled={unchanged || pending}>
          {labels.sync.dialog.serverSave}
        </Button>
      </div>
      {error !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{labels.onboarding.serverHint}</p>
      )}
    </form>
  )
}
