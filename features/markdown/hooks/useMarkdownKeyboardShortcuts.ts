import { useCallback, useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";
import type { MarkdownHistoryMode } from "@/features/markdown/store/useMarkdownStore";
import { applyMarkdownEditorCommand, continueMarkdownList, type MarkdownCommandResult } from "@/features/markdown/services/markdownEditorCommands";
import { applyMarkdownEditResult } from "@/features/markdown/hooks/useMarkdownFormattingActions";

export const markdownEditorTabExitEvent = "comparecode:markdown-editor-tab-exit";

const shortcutActions: Record<string, MarkdownFormatAction> = {
  b: "bold",
  i: "italic",
  k: "link",
  e: "inlineCode"
};

interface KeyboardShortcutsInput {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string, options?: { history?: MarkdownHistoryMode }) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function hasAltGraph(event: KeyboardEvent<HTMLTextAreaElement>): boolean {
  return event.altKey || event.getModifierState?.("AltGraph") === true;
}

export function useMarkdownKeyboardShortcuts({ textareaRef, onChange, onUndo, onRedo, canUndo, canRedo }: KeyboardShortcutsInput) {
  const isTabExitArmedRef = useRef(false);

  useEffect(() => {
    const arm = () => {
      if (document.activeElement === textareaRef.current) {
        isTabExitArmedRef.current = true;
      }
    };

    window.addEventListener(markdownEditorTabExitEvent, arm);
    return () => window.removeEventListener(markdownEditorTabExitEvent, arm);
  }, [textareaRef]);

  const apply = useCallback((result: MarkdownCommandResult) => {
    const textarea = textareaRef.current;
    if (textarea) {
      applyMarkdownEditResult(textarea, result, onChange);
    }
  }, [onChange, textareaRef]);

  const runCommand = useCallback((textarea: HTMLTextAreaElement, command: MarkdownFormatAction) => {
    apply(applyMarkdownEditorCommand({
      value: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
      command
    }));
  }, [apply]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229;

    if (event.key === "Escape") {
      if (!event.defaultPrevented) {
        isTabExitArmedRef.current = true;
      }
      return;
    }

    if (event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (isTabExitArmedRef.current) {
        isTabExitArmedRef.current = false;
        return;
      }

      event.preventDefault();
      runCommand(textarea, event.shiftKey ? "outdent" : "indent");
      return;
    }

    if (!["Shift", "Control", "Meta", "Alt", "AltGraph", "CapsLock"].includes(event.key)) {
      isTabExitArmedRef.current = false;
    }

    if (isComposing) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const result = continueMarkdownList(textarea.value, textarea.selectionStart, textarea.selectionEnd);
      if (result) {
        event.preventDefault();
        apply(result);
      }
      return;
    }

    const isModifierPressed = event.ctrlKey || event.metaKey;
    if (!isModifierPressed || hasAltGraph(event)) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      if (canUndo) {
        event.preventDefault();
        onUndo?.();
      }
      return;
    }

    if (key === "y" || (key === "z" && event.shiftKey)) {
      if (canRedo) {
        event.preventDefault();
        onRedo?.();
      }
      return;
    }

    const action = event.shiftKey ? undefined : shortcutActions[key];
    if (action) {
      event.preventDefault();
      runCommand(textarea, action);
    }
  }, [apply, canRedo, canUndo, onRedo, onUndo, runCommand]);

  const handleBlur = useCallback(() => {
    isTabExitArmedRef.current = false;
  }, []);

  return { handleKeyDown, handleBlur };
}
