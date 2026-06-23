import { useCallback, type RefObject } from "react";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";
import { applyMarkdownEditorCommand } from "@/features/markdown/services/markdownEditorCommands";

export interface MarkdownFormatOptions {
  tableRows?: number;
  tableColumns?: number;
}

interface FormattingActionsInput {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string, options?: { history?: "checkpoint" }) => void;
}

export function useMarkdownFormattingActions({ textareaRef, onChange }: FormattingActionsInput) {
  const applyFormat = useCallback((action: MarkdownFormatAction, options?: MarkdownFormatOptions) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const result = applyMarkdownEditorCommand({
      value: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
      command: action,
      ...options
    });

    onChange(result.value, { history: "checkpoint" });

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }, [onChange, textareaRef]);

  return { applyFormat };
}
