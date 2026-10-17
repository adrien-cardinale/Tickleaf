import { Check, ChevronsUpDown, UserRound } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { switchAccount } from "@/lib/account/account-actions"
import { activeAccount } from "@/lib/account/account-index"
import { useDeviceAccounts } from "@/lib/account/accounts-query"
import { labels } from "@/lib/labels"

function openAccount(id: string) {
  switchAccount(id).catch((error: unknown) =>
    toast.error(labels.settings.accounts.failed, {
      description: error instanceof Error ? error.message : String(error),
    }),
  )
}

export function AccountSwitcher() {
  const { data: index } = useDeviceAccounts()
  if (!index || index.accounts.length < 2) return null
  const current = activeAccount(index)

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={labels.accounts.switcher}>
            <UserRound />
            <span className="truncate">{current?.label ?? labels.accounts.switcher}</span>
            <ChevronsUpDown className="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="min-w-56">
          <DropdownMenuLabel>{labels.accounts.switcher}</DropdownMenuLabel>
          {index.accounts.map((account) => (
            <DropdownMenuItem
              key={account.id}
              disabled={account.id === index.activeId}
              onClick={() => openAccount(account.id)}
            >
              <span className="min-w-0 flex-1 truncate">{account.label}</span>
              {account.id === index.activeId && <Check />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
