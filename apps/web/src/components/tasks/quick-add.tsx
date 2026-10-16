import { type FormEvent, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type QuickAddContext, useTaskActions } from "@/hooks/use-task-actions"
import { useToday } from "@/hooks/use-today"
import { labels } from "@/lib/labels"

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable
}

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
      <kbd className="inline-block rounded-[5px] border border-b-2 px-1.5 font-mono text-[11px] text-muted-foreground">
        /
      </kbd>{" "}
      {labels.quickAdd.hintShortcut}
    </p>
  )
}

export function QuickAdd({ context, placeholder }: QuickAddProps) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const today = useToday()
  const { add } = useTaskActions()

  useEffect(() => {
    const focusOnSlash = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener("keydown", focusOnSlash)
    return () => document.removeEventListener("keydown", focusOnSlash)
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (value.trim() === "") return
    if (await add(value, context, today)) setValue("")
  }

  return (
    <>
      <form onSubmit={submit} className="flex gap-2">
        <label className="sr-only" htmlFor="quick-add">
          {labels.quickAdd.label}
        </label>
        <Input
          id="quick-add"
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
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
