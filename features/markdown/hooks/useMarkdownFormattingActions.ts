import { useCallback, type RefObject } from "react";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";

interface FormattingActionsInput {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}

interface SelectionRange {
  start: number;
  end: number;
  selectedText: string;
}

function getSelection(textarea: HTMLTextAreaElement): SelectionRange {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  return {
    start,
    end,
    selectedText: textarea.value.slice(start, end)
  };
}

function toTitleCase(value: string): string {
  return value.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function prefixLines(value: string, prefix: string): string {
  return value
    .split("\n")
    .map((line) => `${prefix}${line || "item"}`)
    .join("\n");
}

function numberedLines(value: string): string {
  return value
    .split("\n")
    .map((line, index) => `${index + 1}. ${line || "item"}`)
    .join("\n");
}

function wrapEmphasis(value: string, marker: string): string {
  if (!value.includes("\n")) {
    return `${marker}${value}${marker}`;
  }

  return value
    .split("\n")
    .map((line) => line.trim() ? `${marker}${line}${marker}` : line)
    .join("\n");
}

function buildReplacement(action: MarkdownFormatAction, selectedText: string): string {
  const fallback = selectedText || "text";

  switch (action) {
    case "bold":
      return wrapEmphasis(fallback, "**");
    case "italic":
      return wrapEmphasis(fallback, "*");
    case "strikethrough":
      return wrapEmphasis(fallback, "~~");
    case "quote":
      return prefixLines(selectedText || "Quote", "> ");
    case "titleCase":
      return toTitleCase(selectedText || "Title Case Text");
    case "h1":
      return `# ${selectedText || "Heading 1"}`;
    case "h2":
      return `## ${selectedText || "Heading 2"}`;
    case "alignLeft":
      return `<div align="left">\n${selectedText || "Left aligned content"}\n</div>`;
    case "alignCenter":
      return `<div align="center">\n${selectedText || "Centered content"}\n</div>`;
    case "alignRight":
      return `<div align="right">\n${selectedText || "Right aligned content"}\n</div>`;
    case "orderedList":
      return numberedLines(selectedText || "First item\nSecond item");
    case "bulletList":
      return prefixLines(selectedText || "First item\nSecond item", "- ");
    case "taskList":
      return prefixLines(selectedText || "First task\nSecond task", "- [ ] ");
    case "inlineCode":
      return `\`${fallback}\``;
    case "codeBlock":
      return `\`\`\`ts\n${selectedText || "const value = true;"}\n\`\`\``;
    case "link":
      return `[${selectedText || "Link text"}](https://example.com)`;
    case "image":
      return `![${selectedText || "Alt text"}](https://example.com/image.png)`;
    case "table":
      return `| Column A | Column B |\n| --- | --- |\n| Value A | Value B |`;
    case "mermaid":
      return `\`\`\`mermaid\nflowchart LR\n  A[Start] --> B[Preview]\n\`\`\``;
    case "math":
      return selectedText ? `$${selectedText}$` : `$$\nE = mc^2\n$$`;
    default:
      return fallback;
  }
}

export function useMarkdownFormattingActions({ textareaRef, value, onChange }: FormattingActionsInput) {
  const applyFormat = useCallback((action: MarkdownFormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const { start, end, selectedText } = getSelection(textarea);
    const replacement = buildReplacement(action, selectedText);
    const nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;

    onChange(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextStart = start;
      const nextEnd = start + replacement.length;
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }, [onChange, textareaRef, value]);

  return { applyFormat };
}
