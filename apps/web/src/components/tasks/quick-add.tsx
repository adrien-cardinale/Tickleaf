import { type FormEvent, type KeyboardEvent, useState } from "react"
import { Kbd } from "@/components/kbd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type QuickAddContext, useTaskActions } from "@/hooks/use-task-actions"
import { useToday } from "@/hooks/use-today"
import { labels } from "@/lib/labels"
import { QUICK_ADD_INPUT_ID } from "@/lib/shortcuts"

type QuickAddProps = {
  context: QuickAddContext
  placeholder: string
}

function Token({ children }: { children: string }) {
  return <code className="rounded-[5px] bg-muted px-1.5 py-px font-mono text-xs">{children}</code>
}

function QuickAddHint() {
  const [first, second, third] = labels.quickAdd.hintTokens
  return (
    <p className="-mt-3 text-xs text-muted-foreground">
      {labels.quickAdd.hintBefore} <Token>{first}</Token>, <Token>{second}</Token>, <Token>{third}</Token>,{" "}
      <Token>p1</Token>…<Token>p4</Token> {labels.quickAdd.hintOr} <Token>#Projet</Token> {labels.quickAdd.hintAfter}{" "}
      <Kbd>/</Kbd>
      {labels.quickAdd.hintShortcut}
    </p>
  )
}

export function QuickAdd({ context, placeholder }: QuickAddProps) {
  const [value, setValue] = useState("")
  const today = useToday()
  const { add } = useTaskActions()

  const blurOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    event.currentTarget.blur()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (value.trim() === "") return
    if (await add(value, context, today)) setValue("")
  }

  return (
    <>
      <form onSubmit={submit} className="flex gap-2">
        <label className="sr-only" htmlFor={QUICK_ADD_INPUT_ID}>
          {labels.quickAdd.label}
        </label>
        <Input
          id={QUICK_ADD_INPUT_ID}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={blurOnEscape}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-0 flex-1"
        />
        <Button type="submit">{labels.quickAdd.submit}</Button>
      </form>
      <QuickAddHint />
    </>
  )
}
