import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

interface MarkdownPasteInput {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  clipboardData: DataTransfer;
}

interface MarkdownPasteResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

let turndownService: TurndownService | null = null;

function getTurndownService(): TurndownService {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-"
    });
    turndownService.use(gfm);
    turndownService.keep(["mark", "u", "kbd"]);
  }

  return turndownService;
}

function normalizePastedMarkdown(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/^([ \t]*[-+*]) {2,}/gm, "$1 ")
    .trim();
}

function escapeTableCell(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .trim();
}

function collectLeafText(element: Element): Array<string> {
  if (element.children.length === 0) {
    const text = element.textContent?.trim() ?? "";
    return text ? [text] : [];
  }

  return Array.from(element.children).flatMap(collectLeafText);
}

function getCellText(cell: HTMLTableCellElement): string {
  const childTexts = Array.from(cell.children)
    .flatMap(collectLeafText)
    .filter(Boolean);

  if (childTexts.length > 1) {
    return childTexts.join(", ");
  }

  return cell.textContent?.trim() ?? "";
}

function tableToMarkdown(table: HTMLTableElement): string {
  const rows = Array.from(table.rows).map((row) => Array.from(row.cells).map(getCellText));
  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.trim()));

  if (nonEmptyRows.length === 0) {
    return "";
  }

  const columnCount = Math.max(...nonEmptyRows.map((row) => row.length));
  const normalizedRows = nonEmptyRows.map((row) => Array.from({ length: columnCount }, (_, index) => escapeTableCell(row[index] ?? "")));
  const hasExplicitHeader = table.tHead !== null;
  const isKeyValueTable = !hasExplicitHeader && normalizedRows.every((row) => row.length === 2);
  const header = isKeyValueTable
    ? ["Field", "Value"]
    : hasExplicitHeader
      ? normalizedRows[0]
      : Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`);
  const bodyRows = hasExplicitHeader ? normalizedRows.slice(1) : normalizedRows;
  const separator = header.map(() => "---");
  const markdownRows = [header, separator, ...bodyRows];

  return markdownRows.map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function convertTablesToMarkdown(document: Document): Map<string, string> {
  const markdownByToken = new Map<string, string>();

  document.querySelectorAll("table").forEach((table, index) => {
    const markdown = tableToMarkdown(table);
    const token = `CCMARKDOWNTABLETOKEN${index}`;
    const placeholder = document.createElement("p");
    placeholder.textContent = token;
    markdownByToken.set(token, markdown);
    table.replaceWith(placeholder);
  });

  return markdownByToken;
}

function convertHtmlToMarkdown(html: string): string {
  if (!html.trim()) {
    return "";
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const markdownTables = convertTablesToMarkdown(document);
  let markdown = getTurndownService().turndown(document.body.innerHTML);

  markdownTables.forEach((tableMarkdown, token) => {
    markdown = markdown.replace(token, tableMarkdown);
  });

  return normalizePastedMarkdown(markdown);
}

function getClipboardMarkdown(clipboardData: DataTransfer): string {
  const html = clipboardData.getData("text/html");
  const plainText = clipboardData.getData("text/plain");

  if (html.trim()) {
    try {
      const markdown = convertHtmlToMarkdown(html);
      if (markdown.trim()) {
        return markdown;
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to convert pasted HTML to Markdown.", error);
      }
    }
  }

  return plainText;
}

export function buildMarkdownPasteResult(input: MarkdownPasteInput): MarkdownPasteResult | null {
  const pastedMarkdown = getClipboardMarkdown(input.clipboardData);
  if (!pastedMarkdown) {
    return null;
  }

  const selectionStart = Math.max(0, Math.min(input.selectionStart, input.value.length));
  const selectionEnd = Math.max(selectionStart, Math.min(input.selectionEnd, input.value.length));
  const nextValue = `${input.value.slice(0, selectionStart)}${pastedMarkdown}${input.value.slice(selectionEnd)}`;
  const nextSelection = selectionStart + pastedMarkdown.length;

  return {
    value: nextValue,
    selectionStart: nextSelection,
    selectionEnd: nextSelection
  };
}
