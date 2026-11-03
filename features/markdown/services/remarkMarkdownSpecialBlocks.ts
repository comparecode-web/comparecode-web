import { markdownFrontmatterTableMarker } from "@/features/markdown/services/markdownSource";

export const markdownFrontmatterTableId = "comparecode-frontmatter-table";

interface MarkdownPoint {
  offset?: number;
}

interface MarkdownNode {
  type: string;
  value?: string;
  children?: Array<MarkdownNode>;
  position?: { start?: MarkdownPoint; end?: MarkdownPoint };
  data?: Record<string, unknown>;
}

interface MarkdownFile {
  value?: unknown;
}

function stripInlineCodeAndEscapes(line: string): string {
  return line.replace(/`+[^`]*`+/g, "").replace(/\\\|/g, "");
}

function hasTablePipe(line: string): boolean {
  return stripInlineCodeAndEscapes(line).includes("|");
}

function getNodeSource(node: MarkdownNode, source: string): string | null {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (start === undefined || end === undefined) {
    return null;
  }

  return source.slice(start, end);
}

export function isMalformedTableParagraph(text: string): boolean {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    return false;
  }

  const startsLikeTableRow = /^ {0,3}\|/.test(lines[0]);
  const pipeLineCount = lines.filter(hasTablePipe).length;

  return startsLikeTableRow || pipeLineCount >= 2;
}

export function isMalformedTable(text: string): boolean {
  return text.split("\n").some((line) => line.trim() && !line.includes("|"));
}

function createRawNode(text: string): MarkdownNode {
  return {
    type: "markdownRaw",
    data: {
      hName: "pre",
      hChildren: [{ type: "text", value: text }]
    }
  };
}

function createFrontmatterTableNode(): MarkdownNode {
  return {
    type: "markdownFrontmatterTable",
    data: {
      hName: "div",
      hProperties: { id: markdownFrontmatterTableId }
    }
  };
}

export function remarkMarkdownSpecialBlocks() {
  return (root: unknown, file: unknown) => {
    const tree = root as MarkdownNode;
    const { value } = file as MarkdownFile;
    const source = typeof value === "string" ? value : String(value ?? "");
    let hasFrontmatterTable = false;

    tree.children = (tree.children ?? []).map((node) => {
      if (node.type === "html" && !hasFrontmatterTable && node.value?.trim() === markdownFrontmatterTableMarker) {
        hasFrontmatterTable = true;
        return { ...createFrontmatterTableNode(), position: node.position };
      }

      if (node.type !== "paragraph" && node.type !== "table") {
        return node;
      }

      const text = getNodeSource(node, source);
      if (text === null) {
        return node;
      }

      const isMalformed = node.type === "paragraph" ? isMalformedTableParagraph(text) : isMalformedTable(text);

      return isMalformed ? { ...createRawNode(text), position: node.position } : node;
    });
  };
}
