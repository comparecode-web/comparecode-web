import { useCallback, type RefObject } from "react";
import { flushSync } from "react-dom";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";
import type { MarkdownHistoryMode } from "@/features/markdown/store/useMarkdownStore";
import { applyMarkdownEditorCommand, type MarkdownCommandResult } from "@/features/markdown/services/markdownEditorCommands";
import type { MarkdownMermaidTemplateId } from "@/features/markdown/services/markdownMermaidTemplates";

export interface MarkdownFormatOptions {
  tableRows?: number;
  tableColumns?: number;
  mermaidTemplate?: MarkdownMermaidTemplateId;
}

interface FormattingActionsInput {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string, options?: { history?: MarkdownHistoryMode }) => void;
}

export function applyMarkdownEditResult(
  textarea: HTMLTextAreaElement,
  result: MarkdownCommandResult,
  onChange: FormattingActionsInput["onChange"],
  history: MarkdownHistoryMode = "operation"
) {
  const { scrollTop, scrollLeft } = textarea;
  const restore = () => {
    textarea.scrollTop = scrollTop;
    textarea.scrollLeft = scrollLeft;
    textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
  };

  // Commit the new value before the next paint so the browser never shows its caret-at-end position.
  flushSync(() => onChange(result.value, { history }));
  restore();

  window.requestAnimationFrame(() => {
    if (document.activeElement !== textarea) {
      textarea.focus({ preventScroll: true });
      restore();
    }
  });
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

    applyMarkdownEditResult(textarea, result, onChange);
  }, [onChange, textareaRef]);

  return { applyFormat };
}
