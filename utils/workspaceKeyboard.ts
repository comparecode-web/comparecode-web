export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
}

export function isWorkspaceShortcutBlocked(event: KeyboardEvent): boolean {
  return event.defaultPrevented
    || !!document.querySelector("dialog[open]")
    || (event.target instanceof Element && !!event.target.closest('[data-tool-controls], [role="listbox"], [role="menu"]'));
}
