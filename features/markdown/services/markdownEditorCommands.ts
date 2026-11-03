import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";
import { getMarkdownMermaidTemplate, type MarkdownMermaidTemplateId } from "@/features/markdown/services/markdownMermaidTemplates";

interface MarkdownCommandInput {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  command: MarkdownFormatAction;
  tableRows?: number;
  tableColumns?: number;
  mermaidTemplate?: MarkdownMermaidTemplateId;
}

export interface MarkdownCommandResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface TextRange {
  start: number;
  end: number;
  text: string;
}

interface ReplacementPlan {
  text: string;
  selectStartOffset?: number;
  selectEndOffset?: number;
}

const alertLabels = {
  alertNote: "NOTE",
  alertTip: "TIP",
  alertImportant: "IMPORTANT",
  alertWarning: "WARNING",
  alertCaution: "CAUTION"
} as const satisfies Partial<Record<MarkdownFormatAction, string>>;

export const markdownTableLimits = {
  minRows: 1,
  maxRows: 100,
  minColumns: 1,
  maxColumns: 50
};

function clampSelection(value: string, start: number, end: number): TextRange {
  const selectionStart = Math.max(0, Math.min(start, value.length));
  const selectionEnd = Math.max(selectionStart, Math.min(end, value.length));

  return {
    start: selectionStart,
    end: selectionEnd,
    text: value.slice(selectionStart, selectionEnd)
  };
}

function applyTextReplacement(value: string, start: number, end: number, replacement: string): string {
  return `${value.slice(0, start)}${replacement}${value.slice(end)}`;
}

function isStandaloneMarkerBlock(text: string, marker: string): boolean {
  const lines = text.split("\n");

  return lines.length > 1 && lines[0].trim() === marker && lines[lines.length - 1].trim() === marker;
}

function replaceSelection(value: string, range: TextRange, plan: ReplacementPlan): MarkdownCommandResult {
  const nextValue = applyTextReplacement(value, range.start, range.end, plan.text);
  const nextSelectionStart = range.start + (plan.selectStartOffset ?? 0);
  const nextSelectionEnd = range.start + (plan.selectEndOffset ?? plan.text.length);

  return {
    value: nextValue,
    selectionStart: nextSelectionStart,
    selectionEnd: nextSelectionEnd
  };
}

function wrapSelection(value: string, range: TextRange, marker: string, fallback: string): MarkdownCommandResult {
  if (range.text && isStandaloneMarkerBlock(range.text, marker)) {
    return {
      value,
      selectionStart: range.start,
      selectionEnd: range.end
    };
  }

  if (range.text.startsWith(marker) && range.text.endsWith(marker)) {
    const inner = range.text.slice(marker.length, -marker.length);
    if (inner.trim() && !isStandaloneMarkerBlock(range.text, marker)) {
      return replaceSelection(value, range, {
        text: inner,
        selectStartOffset: 0,
        selectEndOffset: inner.length
      });
    }
  }

  const previous = value.slice(range.start - marker.length, range.start);
  const next = value.slice(range.end, range.end + marker.length);

  if (range.text.trim() && previous === marker && next === marker) {
    const nextValue = `${value.slice(0, range.start - marker.length)}${range.text}${value.slice(range.end + marker.length)}`;

    return {
      value: nextValue,
      selectionStart: range.start - marker.length,
      selectionEnd: range.end - marker.length
    };
  }

  const content = range.text || fallback;
  const replacement = `${marker}${content}${marker}`;

  return replaceSelection(value, range, {
    text: replacement,
    selectStartOffset: marker.length,
    selectEndOffset: marker.length + content.length
  });
}

function toTitleCase(text: string): string {
  return text.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function toUpperCase(text: string): string {
  return text.toUpperCase();
}

function toLowerCase(text: string): string {
  return text.toLowerCase();
}

function getTouchedLineRange(value: string, start: number, end: number): TextRange {
  const effectiveEnd = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", effectiveEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  return {
    start: lineStart,
    end: lineEnd,
    text: value.slice(lineStart, lineEnd)
  };
}

function replaceTouchedLines(
  value: string,
  range: TextRange,
  transform: (lines: Array<string>) => Array<string>
): MarkdownCommandResult {
  const replacement = transform(range.text.split("\n")).join("\n");

  return replaceSelection(value, range, {
    text: replacement,
    selectStartOffset: 0,
    selectEndOffset: replacement.length
  });
}

function stripLinePrefix(line: string): string {
  return line
    .replace(/^(\s*)>\s?/, "$1")
    .replace(/^(\s*)(?:[-*+]\s+|\d+\.\s+|- \[[ xX]\]\s+)/, "$1");
}

function applyHeading(value: string, range: TextRange, level: number): MarkdownCommandResult {
  const marker = `${"#".repeat(level)} `;
  const hasMultipleLines = range.text.includes("\n");

  return replaceTouchedLines(value, range, (lines) => lines.map((line) => {
    const indent = line.match(/^\s*/)?.[0] ?? "";
    const content = line.slice(indent.length);
    const currentHeading = /^(#{1,6})\s+/.exec(content);
    const cleanContent = content.replace(/^#{1,6}\s+/, "");

    if (!cleanContent.trim()) {
      return hasMultipleLines ? line : `${indent}${marker}Heading`;
    }

    if (currentHeading?.[1].length === level) {
      return `${indent}${cleanContent}`;
    }

    return `${indent}${marker}${cleanContent}`;
  }));
}

function toggleQuote(value: string, range: TextRange): MarkdownCommandResult {
  const lines = range.text.split("\n");
  const contentLines = lines.filter((line) => line.trim());
  const allQuoted = contentLines.length > 0 && contentLines.every((line) => /^\s*>\s?/.test(line));

  return replaceTouchedLines(value, range, (items) => items.map((line) => {
    if (!line.trim()) {
      return items.length === 1 ? "> Quote" : line;
    }

    if (allQuoted) {
      return line.replace(/^(\s*)>\s?/, "$1");
    }

    const indent = line.match(/^\s*/)?.[0] ?? "";
    return `${indent}> ${line.slice(indent.length)}`;
  }));
}

function toggleBulletList(value: string, range: TextRange): MarkdownCommandResult {
  const lines = range.text.split("\n");
  const contentLines = lines.filter((line) => line.trim());
  const allBullets = contentLines.length > 0 && contentLines.every((line) => /^\s*[-*+]\s+/.test(line));

  return replaceTouchedLines(value, range, (items) => items.map((line) => {
    if (!line.trim()) {
      return items.length === 1 ? "- item" : line;
    }

    if (allBullets) {
      return line.replace(/^(\s*)[-*+]\s+/, "$1");
    }

    const indent = line.match(/^\s*/)?.[0] ?? "";
    return `${indent}- ${stripLinePrefix(line).slice(indent.length) || "item"}`;
  }));
}

function toggleOrderedList(value: string, range: TextRange): MarkdownCommandResult {
  const lines = range.text.split("\n");
  const contentLines = lines.filter((line) => line.trim());
  const allOrdered = contentLines.length > 0 && contentLines.every((line) => /^\s*\d+\.\s+/.test(line));
  let index = 1;

  return replaceTouchedLines(value, range, (items) => items.map((line) => {
    if (!line.trim()) {
      if (items.length === 1) {
        index += 1;
        return "1. item";
      }

      return line;
    }

    if (allOrdered) {
      return line.replace(/^(\s*)\d+\.\s+/, "$1");
    }

    const indent = line.match(/^\s*/)?.[0] ?? "";
    const nextLine = `${indent}${index}. ${stripLinePrefix(line).slice(indent.length) || "item"}`;
    index += 1;
    return nextLine;
  }));
}

function toggleTaskList(value: string, range: TextRange): MarkdownCommandResult {
  const lines = range.text.split("\n");
  const contentLines = lines.filter((line) => line.trim());
  const allTasks = contentLines.length > 0 && contentLines.every((line) => /^\s*- \[[ xX]\]\s+/.test(line));

  return replaceTouchedLines(value, range, (items) => items.map((line) => {
    if (!line.trim()) {
      return items.length === 1 ? "- [ ] task" : line;
    }

    if (allTasks) {
      return line.replace(/^(\s*)- \[[ xX]\]\s+/, "$1");
    }

    const indent = line.match(/^\s*/)?.[0] ?? "";
    return `${indent}- [ ] ${stripLinePrefix(line).slice(indent.length) || "task"}`;
  }));
}

function buildSeparatedBlock(value: string, range: TextRange, block: string): ReplacementPlan {
  const leadingBreak = range.start > 0 && value[range.start - 1] !== "\n" ? "\n\n" : "";
  const trailingBreak = range.end < value.length && value[range.end] !== "\n" ? "\n\n" : "";

  return {
    text: `${leadingBreak}${block}${trailingBreak}`
  };
}

function insertSeparatedBlock(value: string, range: TextRange, block: string): MarkdownCommandResult {
  return replaceSelection(value, range, buildSeparatedBlock(value, range, block));
}

function insertCodeBlock(value: string, range: TextRange): MarkdownCommandResult {
  const code = range.text || "const mode = \"markdown\";";
  const block = `\`\`\`ts\n${code}\n\`\`\``;
  const plan = buildSeparatedBlock(value, range, block);
  const contentStart = plan.text.indexOf(code);

  return replaceSelection(value, range, {
    text: plan.text,
    selectStartOffset: contentStart,
    selectEndOffset: contentStart + code.length
  });
}

function insertAlignment(value: string, range: TextRange, align: "left" | "center" | "right"): MarkdownCommandResult {
  const content = range.text || `${align.charAt(0).toUpperCase()}${align.slice(1)} aligned content`;
  const opener = `<div align="${align}">\n`;
  const block = `${opener}${content}\n</div>`;
  const plan = buildSeparatedBlock(value, range, block);
  const contentStart = plan.text.indexOf(content);

  return replaceSelection(value, range, {
    text: plan.text,
    selectStartOffset: contentStart,
    selectEndOffset: contentStart + content.length
  });
}

function insertLink(value: string, range: TextRange): MarkdownCommandResult {
  const text = range.text || "Link text";
  const url = "https://example.com";
  const replacement = `[${text}](${url})`;
  const urlStart = replacement.indexOf(url);

  return replaceSelection(value, range, {
    text: replacement,
    selectStartOffset: urlStart,
    selectEndOffset: urlStart + url.length
  });
}

function insertImage(value: string, range: TextRange): MarkdownCommandResult {
  const text = range.text || "Alt text";
  const url = "https://example.com/image.png";
  const replacement = `![${text}](${url})`;
  const urlStart = replacement.indexOf(url);

  return replaceSelection(value, range, {
    text: replacement,
    selectStartOffset: urlStart,
    selectEndOffset: urlStart + url.length
  });
}

function insertReference(value: string, range: TextRange): MarkdownCommandResult {
  const text = range.text || "Reference text";
  const id = "reference-id";
  const replacement = `[${text}][${id}]\n\n[${id}]: https://example.com`;
  const urlStart = replacement.lastIndexOf("https://example.com");

  return replaceSelection(value, range, {
    text: replacement,
    selectStartOffset: urlStart,
    selectEndOffset: urlStart + "https://example.com".length
  });
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function buildTable(rows: number, columns: number): string {
  const headers = Array.from({ length: columns }, (_, index) => `Column ${index + 1}`);
  const separators = Array.from({ length: columns }, () => "---");
  const bodyRows = Array.from({ length: rows }, (_, rowIndex) => (
    Array.from({ length: columns }, (_, columnIndex) => `Value ${rowIndex + 1}.${columnIndex + 1}`)
  ));
  const tableRows = [headers, separators, ...bodyRows];

  return tableRows.map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function insertMath(value: string, range: TextRange): MarkdownCommandResult {
  if (range.text && !range.text.includes("\n")) {
    return replaceSelection(value, range, {
      text: `$${range.text}$`,
      selectStartOffset: 1,
      selectEndOffset: range.text.length + 1
    });
  }

  const formula = range.text || "\\Delta = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}";
  const block = `$$\n${formula}\n$$`;
  const plan = buildSeparatedBlock(value, range, block);
  const formulaStart = plan.text.indexOf(formula);

  return replaceSelection(value, range, {
    text: plan.text,
    selectStartOffset: formulaStart,
    selectEndOffset: formulaStart + formula.length
  });
}

function insertAlert(value: string, range: TextRange, kind: string): MarkdownCommandResult {
  const content = range.text || "Alert content";
  const quotedContent = content.split("\n").map((line) => `> ${line}`).join("\n");

  return insertSeparatedBlock(value, range, `> [!${kind}]\n${quotedContent}`);
}

function applyCurrentLineText(value: string, range: TextRange, transform: (text: string) => string): MarkdownCommandResult {
  const lineRange = getTouchedLineRange(value, range.start, range.end);
  const selectedRange = range.start === range.end ? lineRange : range;
  const nextText = transform(selectedRange.text || "Title Case Text");

  return replaceSelection(value, selectedRange, {
    text: nextText,
    selectStartOffset: 0,
    selectEndOffset: nextText.length
  });
}

function removeHeading(value: string, range: TextRange): MarkdownCommandResult {
  return replaceTouchedLines(value, range, (lines) => lines.map((line) => {
    const indent = line.match(/^\s*/)?.[0] ?? "";
    return `${indent}${line.slice(indent.length).replace(/^#{1,6}\s+/, "")}`;
  }));
}

function insertInlineMath(value: string, range: TextRange): MarkdownCommandResult {
  if (range.text.includes("\n")) {
    return insertMath(value, range);
  }

  return wrapSelection(value, range, "$", "x^2");
}

function insertBlockMath(value: string, range: TextRange): MarkdownCommandResult {
  const formula = range.text || "\\Delta = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}";
  const plan = buildSeparatedBlock(value, range, `$$\n${formula}\n$$`);
  const formulaStart = plan.text.indexOf(formula);

  return replaceSelection(value, range, {
    text: plan.text,
    selectStartOffset: formulaStart,
    selectEndOffset: formulaStart + formula.length
  });
}

function insertFencedBlock(value: string, range: TextRange, language: string, fallback: string): MarkdownCommandResult {
  const content = range.text || fallback;
  const plan = buildSeparatedBlock(value, range, `\`\`\`${language}\n${content}\n\`\`\``);
  const contentStart = plan.text.indexOf(content);

  return replaceSelection(value, range, {
    text: plan.text,
    selectStartOffset: contentStart,
    selectEndOffset: contentStart + content.length
  });
}

function insertDetails(value: string, range: TextRange): MarkdownCommandResult {
  const content = range.text || "Hidden content";
  const plan = buildSeparatedBlock(value, range, `<details>\n<summary>Summary</summary>\n\n${content}\n\n</details>`);
  const contentStart = plan.text.indexOf(content);

  return replaceSelection(value, range, {
    text: plan.text,
    selectStartOffset: contentStart,
    selectEndOffset: contentStart + content.length
  });
}

function insertFootnote(value: string, range: TextRange): MarkdownCommandResult {
  const usedNumbers = Array.from(value.matchAll(/\[\^(\d+)\]/g), (match) => Number(match[1]));
  const label = String(Math.max(0, ...usedNumbers) + 1);
  const reference = `${range.text}[^${label}]`;
  const before = `${value.slice(0, range.start)}${reference}${value.slice(range.end)}`;
  const separator = before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const note = "Footnote text";
  const nextValue = `${before}${separator}[^${label}]: ${note}`;

  return {
    value: nextValue,
    selectionStart: nextValue.length - note.length,
    selectionEnd: nextValue.length
  };
}

const listItemPattern = /^( *)([-*+]|\d{1,9}[.)])( +)/;

interface ListMarker {
  indent: number;
  contentColumn: number;
}

function getListMarker(line: string): ListMarker | null {
  const match = listItemPattern.exec(line);
  if (!match) {
    return null;
  }

  return { indent: match[1].length, contentColumn: match[0].length };
}

function getLeadingSpaces(line: string): number {
  return line.match(/^ */)?.[0].length ?? 0;
}

function findPreviousListMarker(lines: Array<string>, index: number, matches: (marker: ListMarker) => boolean): ListMarker | null {
  for (let current = index - 1; current >= 0; current--) {
    const line = lines[current];
    if (!line.trim()) {
      continue;
    }

    const marker = getListMarker(line);
    if (!marker) {
      if (getLeadingSpaces(line) === 0) {
        return null;
      }
      continue;
    }

    if (matches(marker)) {
      return marker;
    }
  }

  return null;
}

function getShiftedIndent(lines: Array<string>, index: number, direction: "indent" | "outdent"): number {
  const line = lines[index];
  const indent = getLeadingSpaces(line);
  const marker = getListMarker(line);

  if (direction === "indent") {
    if (marker) {
      const sibling = findPreviousListMarker(lines, index, (candidate) => candidate.indent === indent);
      return sibling ? sibling.contentColumn : indent + marker.contentColumn - marker.indent;
    }

    return indent + 2;
  }

  if (marker) {
    const parent = findPreviousListMarker(lines, index, (candidate) => candidate.contentColumn === indent);
    if (parent) {
      return parent.indent;
    }
  }

  return Math.max(0, indent - 2);
}

function shiftLines(value: string, range: TextRange, direction: "indent" | "outdent"): MarkdownCommandResult {
  const lineRange = getTouchedLineRange(value, range.start, range.end);
  const allLines = value.split("\n");
  const firstLineIndex = value.slice(0, lineRange.start).split("\n").length - 1;
  const touchedCount = lineRange.text.split("\n").length;
  let firstLineDelta = 0;

  for (let index = firstLineIndex; index < firstLineIndex + touchedCount; index++) {
    const line = allLines[index];
    if (!line.trim() && touchedCount > 1) {
      continue;
    }

    const indent = getLeadingSpaces(line);
    const nextIndent = getShiftedIndent(allLines, index, direction);
    allLines[index] = `${" ".repeat(nextIndent)}${line.slice(indent)}`;
    if (index === firstLineIndex) {
      firstLineDelta = nextIndent - indent;
    }
  }

  const replacement = allLines.slice(firstLineIndex, firstLineIndex + touchedCount).join("\n");
  const nextValue = `${value.slice(0, lineRange.start)}${replacement}${value.slice(lineRange.end)}`;

  if (range.start === range.end) {
    const caret = Math.max(lineRange.start, range.start + firstLineDelta);
    return { value: nextValue, selectionStart: caret, selectionEnd: caret };
  }

  return { value: nextValue, selectionStart: lineRange.start, selectionEnd: lineRange.start + replacement.length };
}

function isInsideFencedCode(value: string, position: number): boolean {
  let fence: string | null = null;

  for (const line of value.slice(0, position).split("\n").slice(0, -1)) {
    const match = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (!match) {
      continue;
    }

    if (fence === null) {
      fence = match[1];
    } else if (match[1][0] === fence[0] && match[1].length >= fence.length) {
      fence = null;
    }
  }

  return fence !== null;
}

export function continueMarkdownList(value: string, selectionStart: number, selectionEnd: number): MarkdownCommandResult | null {
  if (selectionStart !== selectionEnd || isInsideFencedCode(value, selectionStart)) {
    return null;
  }

  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEndIndex = value.indexOf("\n", selectionStart);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const line = value.slice(lineStart, lineEnd);
  const listMatch = /^( *)([-*+]|(\d{1,9})([.)]))( +)(\[[ xX]\] +)?/.exec(line);
  const quoteMatch = listMatch ? null : /^( *(?:> ?)+)/.exec(line);
  const prefix = listMatch?.[0] ?? quoteMatch?.[0];

  if (!prefix || selectionStart < lineStart + prefix.length) {
    return null;
  }

  if (!line.slice(prefix.length).trim()) {
    const separator = lineStart === 0 || value.slice(0, lineStart).endsWith("\n\n") ? "" : "\n";
    const nextValue = `${value.slice(0, lineStart)}${separator}${value.slice(lineEnd)}`;
    const caret = lineStart + separator.length;
    return { value: nextValue, selectionStart: caret, selectionEnd: caret };
  }

  let nextPrefix = prefix;
  if (listMatch) {
    const [, indent, bullet, number, delimiter, spacing, task] = listMatch;
    const marker = number ? `${Number(number) + 1}${delimiter}` : bullet;
    nextPrefix = `${indent}${marker}${spacing}${task ? "[ ] " : ""}`;
  }

  const insertion = `\n${nextPrefix}`;
  const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;
  const caret = selectionStart + insertion.length;

  return { value: nextValue, selectionStart: caret, selectionEnd: caret };
}

export function getMarkdownHeadingLevel(value: string, position: number): number {
  const lineStart = value.lastIndexOf("\n", Math.max(0, position - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", position);
  const line = value.slice(lineStart, lineEndIndex === -1 ? value.length : lineEndIndex);

  return /^ {0,3}(#{1,6})\s/.exec(line)?.[1].length ?? 0;
}

export function applyMarkdownEditorCommand(input: MarkdownCommandInput): MarkdownCommandResult {
  const range = clampSelection(input.value, input.selectionStart, input.selectionEnd);
  const lineRange = getTouchedLineRange(input.value, range.start, range.end);

  switch (input.command) {
    case "bold":
      return wrapSelection(input.value, range, "**", "bold text");
    case "italic":
      return wrapSelection(input.value, range, "*", "italic text");
    case "strikethrough":
      return wrapSelection(input.value, range, "~~", "struck text");
    case "inlineCode":
      return wrapSelection(input.value, range, "`", "code");
    case "quote":
      return toggleQuote(input.value, lineRange);
    case "titleCase":
      return applyCurrentLineText(input.value, range, toTitleCase);
    case "upperCase":
      return applyCurrentLineText(input.value, range, toUpperCase);
    case "lowerCase":
      return applyCurrentLineText(input.value, range, toLowerCase);
    case "paragraph":
      return removeHeading(input.value, lineRange);
    case "h1":
      return applyHeading(input.value, lineRange, 1);
    case "h2":
      return applyHeading(input.value, lineRange, 2);
    case "h3":
      return applyHeading(input.value, lineRange, 3);
    case "h4":
      return applyHeading(input.value, lineRange, 4);
    case "h5":
      return applyHeading(input.value, lineRange, 5);
    case "h6":
      return applyHeading(input.value, lineRange, 6);
    case "alignLeft":
      return insertAlignment(input.value, range, "left");
    case "alignCenter":
      return insertAlignment(input.value, range, "center");
    case "alignRight":
      return insertAlignment(input.value, range, "right");
    case "orderedList":
      return toggleOrderedList(input.value, lineRange);
    case "bulletList":
      return toggleBulletList(input.value, lineRange);
    case "taskList":
      return toggleTaskList(input.value, lineRange);
    case "horizontalRule":
      return insertSeparatedBlock(input.value, range, "---");
    case "codeBlock":
      return insertCodeBlock(input.value, range);
    case "link":
      return insertLink(input.value, range);
    case "reference":
      return insertReference(input.value, range);
    case "image":
      return insertImage(input.value, range);
    case "table":
      return insertSeparatedBlock(
        input.value,
        range,
        buildTable(
          clampNumber(input.tableRows, markdownTableLimits.minRows, markdownTableLimits.maxRows, 2),
          clampNumber(input.tableColumns, markdownTableLimits.minColumns, markdownTableLimits.maxColumns, 2)
        )
      );
    case "math":
      return insertMath(input.value, range);
    case "mathInline":
      return insertInlineMath(input.value, range);
    case "mathBlock":
      return insertBlockMath(input.value, range);
    case "terminalBlock":
      return insertFencedBlock(input.value, range, "bash", "npm run dev");
    case "details":
      return insertDetails(input.value, range);
    case "footnote":
      return insertFootnote(input.value, range);
    case "mermaidTemplate":
      return insertFencedBlock(input.value, range, "mermaid", getMarkdownMermaidTemplate(input.mermaidTemplate).source);
    case "indent":
      return shiftLines(input.value, range, "indent");
    case "outdent":
      return shiftLines(input.value, range, "outdent");
    case "emoji":
      return replaceSelection(input.value, range, { text: ":joy:" });
    case "symbol":
      return replaceSelection(input.value, range, { text: "&copy;" });
    case "alertNote":
    case "alertTip":
    case "alertImportant":
    case "alertWarning":
    case "alertCaution":
      return insertAlert(input.value, range, alertLabels[input.command]);
    default:
      return {
        value: input.value,
        selectionStart: range.start,
        selectionEnd: range.end
      };
  }
}
