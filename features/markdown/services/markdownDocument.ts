import { unified } from "unified";
import remarkParse from "remark-parse";
import { createMarkdownSlugger } from "@/features/markdown/services/markdownSlug";
import { markdownBaseRemarkPlugins } from "@/features/markdown/services/markdownRemarkPlugins";
import { prepareMarkdownSource } from "@/features/markdown/services/markdownSource";

interface MarkdownNode {
  type: string;
  depth?: number;
  value?: string;
  alt?: string;
  children?: Array<MarkdownNode>;
  position?: { start?: { line?: number; offset?: number } };
  data?: { hProperties?: Record<string, unknown> } & Record<string, unknown>;
}

export interface MarkdownHeading {
  depth: number;
  text: string;
  id: string;
  line: number;
  offset: number;
}

export interface MarkdownDocumentModel {
  headings: Array<MarkdownHeading>;
}

export const markdownHeadingIdPrefix = "user-content-";

export function getMarkdownNodeText(node: MarkdownNode): string {
  if (typeof node.value === "string" && node.type !== "html") {
    return node.value;
  }

  if (node.type === "image") {
    return node.alt ?? "";
  }

  return (node.children ?? []).map(getMarkdownNodeText).join("");
}

function visitHeadings(node: MarkdownNode, visit: (heading: MarkdownNode) => void) {
  if (node.type === "heading") {
    visit(node);
  }

  for (const child of node.children ?? []) {
    visitHeadings(child, visit);
  }
}

export function remarkMarkdownHeadingIds() {
  return (tree: unknown) => {
    const slug = createMarkdownSlugger();

    visitHeadings(tree as MarkdownNode, (heading) => {
      const id = slug(getMarkdownNodeText(heading));
      heading.data = { ...heading.data, hProperties: { ...heading.data?.hProperties, id } };
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(markdownBaseRemarkPlugins)
  .use(remarkMarkdownHeadingIds);

let cachedValue: string | null = null;
let cachedModel: MarkdownDocumentModel = { headings: [] };

export function getMarkdownDocument(value: string): MarkdownDocumentModel {
  if (value === cachedValue) {
    return cachedModel;
  }

  const prepared = prepareMarkdownSource(value);
  const tree = processor.runSync(processor.parse(prepared.source), prepared.source) as MarkdownNode;
  const headings: Array<MarkdownHeading> = [];

  visitHeadings(tree, (heading) => {
    headings.push({
      depth: heading.depth ?? 1,
      text: getMarkdownNodeText(heading).trim(),
      id: String(heading.data?.hProperties?.id ?? ""),
      line: heading.position?.start?.line ?? 1,
      offset: heading.position?.start?.offset ?? 0
    });
  });

  cachedValue = value;
  cachedModel = { headings };
  return cachedModel;
}

export function buildMarkdownTableOfContents(headings: Array<MarkdownHeading>, minDepth = 2, maxDepth = 4): string {
  const included = headings.filter((heading) => heading.depth >= minDepth && heading.depth <= maxDepth && heading.text);
  if (included.length === 0) {
    return "";
  }

  const baseDepth = Math.min(...included.map((heading) => heading.depth));
  let previousLevel = -1;

  return included.map((heading) => {
    const level = Math.min(heading.depth - baseDepth, previousLevel + 1);
    previousLevel = level;
    const text = heading.text.replace(/([[\]\\])/g, "\\$1");
    return `${"  ".repeat(level)}- [${text}](#${heading.id})`;
  }).join("\n");
}
