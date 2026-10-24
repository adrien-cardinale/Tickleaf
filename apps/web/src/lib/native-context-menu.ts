const EDITABLE_SELECTOR = "input, textarea, [contenteditable]:not([contenteditable='false'])"

function isEditable(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(EDITABLE_SELECTOR) !== null
}

export function blockNativeContextMenu(): void {
  document.addEventListener("contextmenu", (event) => {
    if (!isEditable(event.target)) event.preventDefault()
  })
}
