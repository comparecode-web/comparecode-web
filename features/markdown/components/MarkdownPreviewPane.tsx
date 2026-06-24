"use client";

import { Component, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkGemoji from "remark-gemoji";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import { MermaidBlock } from "./MermaidBlock";
import { CodeBlock } from "./CodeBlock";
import { MarkdownAlert } from "./MarkdownAlert";
import { MarkdownFrontmatterTable } from "./MarkdownFrontmatterTable";
import { parseMarkdownFrontmatterDetailed } from "@/features/markdown/services/markdownFrontmatter";
import { normalizeMultilineStyleMarkers } from "@/features/markdown/services/markdownPreprocess";
import { markdownSanitizeSchema } from "@/features/markdown/services/markdownSanitizeSchema";
import { remarkSoftLineBreaks } from "@/features/markdown/services/markdownSoftBreaks";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { cn } from "@/utils/uiHelpers";

interface MarkdownPreviewPaneProps {
  value: string;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

interface MarkdownRenderBoundaryProps {
  fallback: string;
  children: ReactNode;
}

interface MarkdownRenderBoundaryState {
  hasError: boolean;
}

function getCellStyle(style: CSSProperties | undefined, align: string | undefined): CSSProperties | undefined {
  const nextStyle: CSSProperties = { ...style };

  if (align === "left" || align === "center" || align === "right") {
    nextStyle.textAlign = align;
  }

  return Object.keys(nextStyle).length > 0 ? nextStyle : undefined;
}

class MarkdownRenderBoundary extends Component<MarkdownRenderBoundaryProps, MarkdownRenderBoundaryState> {
  state: MarkdownRenderBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MarkdownRenderBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Markdown preview section render failed.", error);
    }
  }

  componentDidUpdate(previousProps: MarkdownRenderBoundaryProps) {
    if (previousProps.fallback !== this.props.fallback && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <pre className="whitespace-pre-wrap break-words font-sans text-text-primary">
          {this.props.fallback}
        </pre>
      );
    }

    return this.props.children;
  }
}

const frontmatterTableMarker = "<!-- comparecode-frontmatter-table -->";

interface MarkdownSourceBlock {
  source: string;
  key: string;
  isRaw: boolean;
}

interface MarkerFrontmatterSection {
  markdownBeforeMarker: string;
  fields: ReturnType<typeof parseMarkdownFrontmatterDetailed>["fields"];
}

interface MarkdownNodePosition {
  position?: {
    start?: { line?: number };
    end?: { line?: number };
  };
}

function isBlockCodeNode(node: unknown, code: string, className: string | undefined): boolean {
  const position = (node as MarkdownNodePosition | undefined)?.position;

  return Boolean(className) || code.includes("\n") || Boolean(position?.start?.line && position?.end?.line && position.end.line > position.start.line);
}

function renderRawMarkdown(value: string, key?: string) {
  if (!value.trim()) {
    return null;
  }

  return (
    <pre key={key} className="my-2 whitespace-pre-wrap break-words rounded border border-border-default bg-bg-secondary p-3 font-mono text-sm leading-6 text-text-primary">
      {value}
    </pre>
  );
}

function splitMarkdownBlocks(value: string): Array<string> {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const blocks: Array<string> = [];
  let buffer: Array<string> = [];
  let inFence = false;
  let fenceChar = "";
  let fenceLength = 0;
  let inMathBlock = false;

  const flush = () => {
    const source = buffer.join("\n").trimEnd();
    if (source.trim()) {
      blocks.push(source);
    }

    buffer = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);

    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceLength = marker.length;
      } else if (marker[0] === fenceChar && marker.length >= fenceLength) {
        inFence = false;
      }
    }

    if (!inFence && trimmed === "$$") {
      inMathBlock = !inMathBlock;
    }

    if (!inFence && !inMathBlock && !trimmed) {
      flush();
      continue;
    }

    buffer.push(line);
  }

  flush();
  return blocks;
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) {
    return false;
  }

  const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isInvalidTableLikeBlock(value: string): boolean {
  if (/^ {0,3}(`{3,}|~{3,})/.test(value)) {
    return false;
  }

  const lines = value.split("\n").filter((line) => line.trim());
  const pipeLines = lines.filter((line) => line.includes("|"));

  if (pipeLines.length === 0) {
    return false;
  }

  if (lines.length < 2 || !lines.some(isTableSeparatorLine)) {
    return true;
  }

  return lines.some((line) => !line.includes("|"));
}

function buildMarkdownSourceBlocks(value: string): Array<MarkdownSourceBlock> {
  return splitMarkdownBlocks(value).map((source, index) => ({
    source,
    key: `markdown-block-${index}`,
    isRaw: isInvalidTableLikeBlock(source)
  }));
}

function extractMarkerFrontmatter(markdownBeforeMarker: string): MarkerFrontmatterSection {
  const match = /(^|\n)(---\n[\s\S]*?\n---)\s*$/.exec(markdownBeforeMarker);
  if (!match) {
    return {
      markdownBeforeMarker,
      fields: []
    };
  }

  const parsed = parseMarkdownFrontmatterDetailed(match[2]);
  if (parsed.status !== "valid") {
    return {
      markdownBeforeMarker,
      fields: []
    };
  }

  return {
    markdownBeforeMarker: markdownBeforeMarker.slice(0, match.index + match[1].length).trimEnd(),
    fields: parsed.fields
  };
}

const markdownComponents: Components = {
  a({ children, href }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-primary underline underline-offset-2 hover:text-accent-hover">
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return <MarkdownAlert>{children}</MarkdownAlert>;
  },
  table({ children }) {
    return (
      <div className="max-w-full overflow-auto custom-scrollbar">
        <table className="w-auto max-w-full table-auto border-collapse text-sm">
          {children}
        </table>
      </div>
    );
  },
  li({ children, className }) {
    const isTaskItem = className?.includes("task-list-item");

    return <li className={cn(className, "my-0.5", isTaskItem && "list-none pl-0")}>{children}</li>;
  },
  th({ children, align, colSpan, rowSpan, style }) {
    return (
      <th
        colSpan={colSpan}
        rowSpan={rowSpan}
        className="break-words border border-border-default bg-bg-secondary px-3 py-2 text-left font-semibold"
        style={getCellStyle(style, align)}
      >
        {children}
      </th>
    );
  },
  td({ children, align, colSpan, rowSpan, style }) {
    return (
      <td
        colSpan={colSpan}
        rowSpan={rowSpan}
        className="break-words border border-border-default px-3 py-2 align-top"
        style={getCellStyle(style, align)}
      >
        {children}
      </td>
    );
  },
  code({ children, className, node }) {
    const code = String(children).replace(/\n$/, "");
    const language = /language-([a-zA-Z0-9_-]+)/.exec(className ?? "")?.[1];

    if (language === "mermaid") {
      return <MermaidBlock chart={code} />;
    }

    return <CodeBlock language={language} inline={!isBlockCodeNode(node, code, className)}>{code}</CodeBlock>;
  },
  pre({ children }) {
    return <>{children}</>;
  },
  mark({ children }) {
    return <mark className="rounded bg-[var(--markdown-mark-bg)] px-1 text-[var(--markdown-mark-fg)]">{children}</mark>;
  },
  u({ children }) {
    return <u className="underline">{children}</u>;
  },
  kbd({ children }) {
    return (
      <kbd className="rounded border border-[var(--markdown-code-border)] bg-[var(--markdown-code-bg)] px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary shadow-sm">
        {children}
      </kbd>
    );
  },
  input({ type, checked, disabled, ...props }) {
    if (type === "checkbox") {
      return <input {...props} type="checkbox" checked={Boolean(checked)} disabled={disabled} readOnly className="mr-2 align-middle accent-accent-primary" />;
    }

    return <input {...props} type={type} disabled={disabled} className="mr-2 align-middle accent-accent-primary" />;
  }
};

export function MarkdownPreviewPane({ value, previewRef }: MarkdownPreviewPaneProps) {
  const frontmatter = parseMarkdownFrontmatterDetailed(value);
  const markdownContent = normalizeMultilineStyleMarkers(frontmatter.content);
  const hasFrontmatterTableMarker = markdownContent.includes(frontmatterTableMarker);
  const [markdownBeforeFrontmatterTable, markdownAfterFrontmatterTable = ""] = markdownContent.split(frontmatterTableMarker);
  const markerFrontmatter = hasFrontmatterTableMarker ? extractMarkerFrontmatter(markdownBeforeFrontmatterTable) : null;
  const frontmatterFields = markerFrontmatter?.fields.length ? markerFrontmatter.fields : frontmatter.fields;
  const fontSize = useMarkdownUIStore((state) => state.fontSize);
  const renderMarkdown = (content: string) => {
    if (!content.trim()) {
      return null;
    }

    return (
      <MarkdownRenderBoundary fallback={content}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkGemoji, remarkMath, remarkSoftLineBreaks]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], [rehypeKatex, { throwOnError: false, strict: false }]]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </MarkdownRenderBoundary>
    );
  };
  const renderMarkdownBlocks = (content: string, keyPrefix: string) => (
    buildMarkdownSourceBlocks(content).map((block) => {
      if (block.isRaw) {
        return renderRawMarkdown(block.source, `${keyPrefix}-${block.key}-raw`);
      }

      return (
        <div key={`${keyPrefix}-${block.key}`}>
          {renderMarkdown(block.source)}
        </div>
      );
    })
  );

  return (
    <div ref={previewRef} className="h-full min-w-0 overflow-auto overflow-x-hidden bg-bg-primary custom-scrollbar">
      <article
        className={cn(
          "mx-auto min-w-0 max-w-full overflow-x-hidden px-4 py-4 text-sm leading-7 text-text-primary sm:px-6",
          "[&_h1]:mb-4 [&_h1]:mt-2 [&_h1]:border-b [&_h1]:border-border-default [&_h1]:pb-2 [&_h1]:text-3xl [&_h1]:font-bold",
          "[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-border-default [&_h2]:pb-1 [&_h2]:text-2xl [&_h2]:font-semibold",
          "[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold",
          "[&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-base [&_h4]:font-semibold",
          "[&_h5]:mb-1.5 [&_h5]:mt-4 [&_h5]:text-sm [&_h5]:font-semibold",
          "[&_h6]:mb-1.5 [&_h6]:mt-4 [&_h6]:text-sm [&_h6]:font-medium [&_h6]:text-text-secondary",
          "[&_hr]:my-6 [&_hr]:border-border-default",
          "[&_*]:max-w-full [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border-default",
          "[&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
        )}
        style={{ fontSize: `${fontSize}px` }}
      >
        {frontmatter.status === "invalid" ? (
          <>
            {renderRawMarkdown(frontmatter.raw, "invalid-frontmatter")}
            {renderMarkdownBlocks(markdownContent, "invalid-frontmatter-content")}
          </>
        ) : hasFrontmatterTableMarker ? (
          <>
            {renderMarkdownBlocks(markerFrontmatter?.markdownBeforeMarker ?? markdownBeforeFrontmatterTable, "before-frontmatter-table")}
            <MarkdownFrontmatterTable fields={frontmatterFields} />
            {renderMarkdownBlocks(markdownAfterFrontmatterTable, "after-frontmatter-table")}
          </>
        ) : (
          <>
            <MarkdownFrontmatterTable fields={frontmatter.fields} />
            {renderMarkdownBlocks(markdownContent, "markdown-content")}
          </>
        )}
      </article>
    </div>
  );
}
