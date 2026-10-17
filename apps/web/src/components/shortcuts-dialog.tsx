import { Fragment } from "react"
import { Kbd } from "@/components/kbd"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWorkspace } from "@/components/workspace-context"
import { labels } from "@/lib/labels"
import {
  type KeyBinding,
  type KeyStroke,
  keyLabel,
  type Shortcut,
  type ShortcutGroup,
  shortcutGroups,
  shortcuts,
} from "@/lib/shortcuts"

const text = labels.shortcuts

function Separator({ children }: { children: string }) {
  return <span className="text-xs text-muted-foreground">{children}</span>
}

function StrokeKeys({ stroke }: { stroke: KeyStroke }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {stroke.map((key, index) => (
        <Fragment key={key}>
          {index > 0 && <Separator>+</Separator>}
          <Kbd>{keyLabel(key)}</Kbd>
        </Fragment>
      ))}
    </span>
  )
}

function BindingKeys({ binding }: { binding: KeyBinding }) {
  return (
    <span className="inline-flex items-center gap-1">
      {binding.map((stroke, index) => (
        <Fragment key={stroke.join("+")}>
          {index > 0 && <Separator>{text.sequence}</Separator>}
          <StrokeKeys stroke={stroke} />
        </Fragment>
      ))}
    </span>
  )
}

function ShortcutItem({ shortcut }: { shortcut: Shortcut }) {
  return (
    <li className="flex items-center justify-between gap-4 py-1.5">
      <span>{shortcut.description}</span>
      <span className="inline-flex shrink-0 items-center gap-1.5">
        {shortcut.bindings.map((binding, index) => (
          <Fragment key={binding.flat().join(" ")}>
            {index > 0 && <Separator>{text.or}</Separator>}
            <BindingKeys binding={binding} />
          </Fragment>
        ))}
      </span>
    </li>
  )
}

function ShortcutSection({ group }: { group: ShortcutGroup }) {
  const items = shortcuts.filter((shortcut) => shortcut.group === group)
  return (
    <section>
      <h3 className="mb-1 text-xs font-medium text-muted-foreground">{text.groups[group]}</h3>
      <ul className="divide-y text-sm">
        {items.map((shortcut) => (
          <ShortcutItem key={shortcut.id} shortcut={shortcut} />
        ))}
      </ul>
    </section>
  )
}

export function ShortcutsDialog() {
  const { shortcutsOpen, closeShortcuts } = useWorkspace()
  return (
    <Dialog open={shortcutsOpen} onOpenChange={(open) => !open && closeShortcuts()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {shortcutGroups.map((group) => (
            <ShortcutSection key={group} group={group} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
