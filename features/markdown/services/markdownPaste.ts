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
      fence: "```",
      strongDelimiter: "**",
      bulletListMarker: "-"
    });
    turndownService.escape = (value) => value;
    turndownService.use(gfm);
    turndownService.keep(["details", "ins", "kbd", "mark", "sub", "summary", "sup", "u"]);
  }

  return turndownService;
}

function normalizePastedMarkdown(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/^([ \t]*[-+*]) {2,}/gm, "$1 ")
    .trim();
}

function normalizePlainClipboardText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ");
}

function looksLikeMarkdownSource(value: string): boolean {
  const normalized = normalizePlainClipboardText(value);

  return [
    /^ {0,3}#{1,6}\s+\S/m,
    /^ {0,3}(?:[-+*]|\d+\.)\s+\S/m,
    /^ {0,3}- \[[ xX]\]\s+\S/m,
    /^ {0,3}>\s?\S/m,
    /^ {0,3}(?:`{3,}|~{3,})/m,
    /^ {0,3}\|.+\|\s*$/m,
    /^ {0,3}\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/m,
    /`[^`\n]+`/,
    /\*\*[^*\n]+\*\*/,
    /~~[^~\n]+~~/,
    /!?\[[^\]\n]+\]\([^) \n]+(?:\s+"[^"\n]+")?\)/,
    /^\[[^\]\n]+\]:\s+\S+/m,
    /<\/?(?:details|summary)(?:\s|>)/i,
    /^---\n[\s\S]*?\n---(?:\n|$)/
  ].some((pattern) => pattern.test(normalized));
}

function isSafeUrl(value: string, allowedProtocols: Array<string>): boolean {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return true;
  }

  if (trimmedValue.startsWith("#") || trimmedValue.startsWith("/") || trimmedValue.startsWith("./") || trimmedValue.startsWith("../")) {
    return true;
  }

  try {
    const url = new URL(trimmedValue, "https://comparecode.local");
    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeClipboardHtml(document: Document): void {
  document.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((element) => {
    element.remove();
  });

  document.body.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name.startsWith("on") || name === "style" || name === "srcdoc") {
        element.removeAttribute(attribute.name);
        return;
      }

      if ((name === "href" || name === "xlink:href") && !isSafeUrl(value, ["http:", "https:", "mailto:"])) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "src" && !isSafeUrl(value, ["http:", "https:"])) {
        element.removeAttribute(attribute.name);
      }
    });
  });
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
  sanitizeClipboardHtml(document);
  const markdownTables = convertTablesToMarkdown(document);
  let markdown = getTurndownService().turndown(document.body.innerHTML.replace(/&(?:nbsp|#160);/g, " "));

  markdownTables.forEach((tableMarkdown, token) => {
    markdown = markdown.replace(token, tableMarkdown);
  });

  return normalizePastedMarkdown(markdown);
}

function getClipboardMarkdown(clipboardData: DataTransfer): string {
  const html = clipboardData.getData("text/html");
  const plainText = clipboardData.getData("text/plain");
  const normalizedPlainText = normalizePlainClipboardText(plainText);

  if (normalizedPlainText.trim() && looksLikeMarkdownSource(normalizedPlainText)) {
    return normalizedPlainText;
  }

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

  return normalizedPlainText;
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
