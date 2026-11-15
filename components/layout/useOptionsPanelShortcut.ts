"use client";

import { useEffect } from "react";
import { isEditableTarget, isWorkspaceShortcutBlocked } from "@/utils/workspaceKeyboard";

export function useOptionsPanelShortcut(toggleOptionsPanel: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isWorkspaceShortcutBlocked(event)) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (event.repeat || isEditableTarget(event.target)) {
        return;
      }

      if (event.key.toLowerCase() !== "o") {
        return;
      }

      event.preventDefault();
      toggleOptionsPanel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [toggleOptionsPanel]);
}
