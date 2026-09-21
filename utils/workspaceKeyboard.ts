export function isWorkspaceShortcutBlocked(event: KeyboardEvent): boolean {
  return event.defaultPrevented
    || !!document.querySelector("dialog[open]")
    || (event.target instanceof Element && !!event.target.closest('[data-tool-controls], [role="listbox"], [role="menu"]'));
}
