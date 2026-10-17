import { Check, KeyRound, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { BrandMark } from "@/components/brand-mark"
import { RecoveryKey } from "@/components/sync/recovery-key"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatMasterKey, generateMasterKey, parseMasterKey } from "@/lib/crypto/master-key"
import { completeOnboarding } from "@/lib/crypto/onboarding"
import { labels } from "@/lib/labels"
import { asksForServerUrl, isAndroid } from "@/lib/runtime"
import { parseServerUrl } from "@/lib/sync/server-url"
import { ScanLinkButton } from "./scan-link-button"

type Mode = "choose" | "create" | "restore"

type StepProps = { onDone: () => void; onBack: () => void }

const FOOTER_CLASS = "flex-col-reverse gap-2 sm:flex-row sm:justify-end"
const FOOTER_BUTTON_CLASS = "w-full sm:w-auto"

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function ServerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  if (!asksForServerUrl()) return null
  return (
    <div className="space-y-2">
      <Label htmlFor="server-url">{labels.onboarding.serverLabel}</Label>
      <Input
        id="server-url"
        type="url"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="url"
        placeholder={labels.onboarding.serverPlaceholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-sm text-muted-foreground">{labels.onboarding.serverHint}</p>
    </div>
  )
}

function FieldError({ message }: { message: string | null }) {
  if (message === null) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}

function useServerField() {
  const [serverInput, setServerInput] = useState("")
  const read = (): { ok: true; url: string | null } | { ok: false } => {
    if (serverInput.trim() === "") return { ok: true, url: null }
    const url = parseServerUrl(serverInput)
    return url === null ? { ok: false } : { ok: true, url }
  }
  return { serverInput, setServerInput, read }
}

function CreateKeyStep({ onDone, onBack }: StepProps) {
  const [key] = useState(generateMasterKey)
  const [phrase, setPhrase] = useState("")
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const server = useServerField()

  useEffect(() => {
    formatMasterKey(key).then(setPhrase, (caught: unknown) =>
      setError(messageOf(caught, labels.onboarding.keyGenerationFailed)),
    )
  }, [key])

  const submit = async () => {
    const serverUrl = server.read()
    if (!serverUrl.ok) return setError(labels.onboarding.invalidServer)
    setPending(true)
    try {
      await completeOnboarding({ key, created: true, serverUrl: serverUrl.url })
      onDone()
    } catch (caught) {
      setError(messageOf(caught, labels.onboarding.saveFailed))
      setPending(false)
    }
  }

  return (
    <>
      <CardContent className="space-y-4">
        <Alert>
          <KeyRound />
          <AlertTitle>{labels.onboarding.warningTitle}</AlertTitle>
          <AlertDescription>{labels.onboarding.warningDescription}</AlertDescription>
        </Alert>
        <RecoveryKey phrase={phrase} />
        <ServerField value={server.serverInput} onChange={server.setServerInput} />
        <div className="flex items-center gap-2">
          <Checkbox id="key-saved" checked={saved} onCheckedChange={(value) => setSaved(value === true)} />
          <Label htmlFor="key-saved">{labels.onboarding.savedConfirm}</Label>
        </div>
        <FieldError message={error} />
      </CardContent>
      <CardFooter className={FOOTER_CLASS}>
        <Button variant="outline" className={FOOTER_BUTTON_CLASS} onClick={onBack} disabled={pending}>
          {labels.onboarding.back}
        </Button>
        <Button
          className={FOOTER_BUTTON_CLASS}
          onClick={() => void submit()}
          disabled={!saved || phrase === "" || pending}
        >
          <Check />
          {labels.onboarding.continue}
        </Button>
      </CardFooter>
    </>
  )
}

function RestoreKeyStep({ onDone, onBack }: StepProps) {
  const [phrase, setPhrase] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const server = useServerField()

  const submit = async () => {
    const serverUrl = server.read()
    if (!serverUrl.ok) return setError(labels.onboarding.invalidServer)
    setPending(true)
    try {
      const key = await parseMasterKey(phrase)
      await completeOnboarding({ key, created: false, serverUrl: serverUrl.url })
      onDone()
    } catch (caught) {
      setError(messageOf(caught, labels.onboarding.saveFailed))
      setPending(false)
    }
  }

  return (
    <>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recovery-key">{labels.onboarding.yourKey}</Label>
          <Textarea
            id="recovery-key"
            className="font-mono"
            rows={3}
            spellCheck={false}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder={labels.onboarding.keyPlaceholder}
            value={phrase}
            aria-invalid={error !== null}
            onChange={(event) => {
              setPhrase(event.target.value)
              setError(null)
            }}
          />
        </div>
        <ServerField value={server.serverInput} onChange={server.setServerInput} />
        <FieldError message={error} />
      </CardContent>
      <CardFooter className={FOOTER_CLASS}>
        <Button variant="outline" className={FOOTER_BUTTON_CLASS} onClick={onBack} disabled={pending}>
          {labels.onboarding.back}
        </Button>
        <Button
          className={FOOTER_BUTTON_CLASS}
          onClick={() => void submit()}
          disabled={phrase.trim() === "" || pending}
        >
          <Check />
          {labels.onboarding.restore}
        </Button>
      </CardFooter>
    </>
  )
}

function ChooseStep({ onChoose, onDone }: { onChoose: (mode: Mode) => void; onDone: () => void }) {
  const android = isAndroid()
  return (
    <CardContent className="flex flex-col gap-2">
      {android && (
        <>
          <p className="text-sm text-muted-foreground">{labels.onboarding.scan.hint}</p>
          <ScanLinkButton onDone={onDone} />
        </>
      )}
      <Button variant={android ? "outline" : "default"} onClick={() => onChoose("create")}>
        <Plus />
        {labels.onboarding.createKey}
      </Button>
      <Button variant="outline" onClick={() => onChoose("restore")}>
        <KeyRound />
        {android ? labels.onboarding.enterKeyManually : labels.onboarding.haveKey}
      </Button>
    </CardContent>
  )
}

function OnboardingSteps({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("choose")
  const back = () => setMode("choose")
  if (mode === "create") return <CreateKeyStep onDone={onDone} onBack={back} />
  if (mode === "restore") return <RestoreKeyStep onDone={onDone} onBack={back} />
  return <ChooseStep onChoose={setMode} onDone={onDone} />
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <main className="flex min-h-svh items-start justify-center bg-muted/40 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center sm:px-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BrandMark className="size-6" />
            {labels.app.name}
          </CardTitle>
          <CardDescription>{labels.onboarding.intro}</CardDescription>
        </CardHeader>
        <OnboardingSteps onDone={onDone} />
      </Card>
    </main>
  )
}
