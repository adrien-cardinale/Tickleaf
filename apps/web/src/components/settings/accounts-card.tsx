import { useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus } from "lucide-react"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import { OnboardingSteps } from "@/components/startup/onboarding"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { reloadOnActiveAccount, switchAccount } from "@/lib/account/account-actions"
import type { DeviceAccount } from "@/lib/account/account-index"
import { changeAccount } from "@/lib/account/accounts"
import { deviceAccountsQuery, useDeviceAccounts } from "@/lib/account/accounts-query"
import { labels } from "@/lib/labels"

const text = labels.settings.accounts

function showFailure(error: unknown) {
  toast.error(text.failed, { description: error instanceof Error ? error.message : String(error) })
}

function RenameAccountDialog({ account }: { account: DeviceAccount }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(account.label)
  const label = value.trim()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (label === "") return
    try {
      await changeAccount(account.id, { label })
      await queryClient.invalidateQueries({ queryKey: deviceAccountsQuery.queryKey })
      toast.success(text.renamed)
      setOpen(false)
    } catch (error) {
      showFailure(error)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setValue(account.label)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" title={text.rename} aria-label={`${text.rename} : ${account.label}`}>
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <DialogHeader>
            <DialogTitle>{text.renameTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="account-label">{text.renameLabel}</Label>
            <Input id="account-label" value={value} onChange={(event) => setValue(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={label === "" || label === account.label}>
              {text.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AccountRow({ account, active }: { account: DeviceAccount; active: boolean }) {
  return (
    <li className="flex min-h-11 items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-sm">{account.label}</span>
      {active ? (
        <Badge variant="secondary">{text.active}</Badge>
      ) : (
        <Button variant="outline" size="sm" onClick={() => void switchAccount(account.id).catch(showFailure)}>
          {text.open}
        </Button>
      )}
      <RenameAccountDialog account={account} />
    </li>
  )
}

function AddAccountDialog() {
  const done = () => void reloadOnActiveAccount().catch(showFailure)
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus />
          {text.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto px-0">
        <DialogHeader className="px-6">
          <DialogTitle>{text.add}</DialogTitle>
          <DialogDescription>{text.addDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <OnboardingSteps onDone={done} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AccountsCard() {
  const { data: index } = useDeviceAccounts()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y">
          {index?.accounts.map((account) => (
            <AccountRow key={account.id} account={account} active={account.id === index.activeId} />
          ))}
        </ul>
        <AddAccountDialog />
      </CardContent>
    </Card>
  )
}
